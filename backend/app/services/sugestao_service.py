import json
import re
import threading
import time
import unicodedata
from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.models.sugestao_refeicao import SugestaoRefeicao
from app.models.refeicao import Refeicao
from app.models.item_refeicao import ItemRefeicao
from app.repositories.perfil_nutri_repo import PerfilNutriRepository
from app.repositories.meta_nutri_repo import MetaNutriRepository
from app.repositories.alimento_repo import AlimentoRepository
from app.repositories.refeicao_repo import RefeicaoRepository
from app.services.fatsecret_service import FatSecretService
from app.services.nutricao_service import NutricaoService
from fastapi import HTTPException, status


def _normalizar(texto: str) -> str:
    """Minúsculas sem acento, para comparar nomes de alimentos."""
    if not texto:
        return ""
    return unicodedata.normalize("NFKD", texto).encode("ASCII", "ignore").decode("utf-8").lower().strip()


class _CacheBusca:
    """
    Cache em memória para as buscas do FatSecret.

    Antes, gerar as 4 refeições fazia ~30 requisições HTTP sequenciais
    (8 termos x 4 refeições), o que estourava o RNF01 de 6 segundos.
    O cache reduz a uma requisição por termo único.
    """

    TTL_SEGUNDOS = 3600
    _lock = threading.Lock()
    _store: Dict[str, tuple[float, List[Dict]]] = {}
    _vazios: set[str] = set()

    @classmethod
    def get(cls, termo: str) -> List[Dict]:
        agora = time.time()
        with cls._lock:
            if termo in cls._vazios:
                return []
            entrada = cls._store.get(termo)
            if entrada and agora - entrada[0] < cls.TTL_SEGUNDOS:
                return list(entrada[1])
        return []  # cache miss — quem chama busca de verdade

    @classmethod
    def set(cls, termo: str, alimentos: List[Dict]) -> None:
        with cls._lock:
            if alimentos:
                cls._store[termo] = (time.time(), list(alimentos))
            else:
                cls._vazios.add(termo)

    @classmethod
    def buscar(cls, termo: str, max_resultados: int = 20) -> List[Dict]:
        em_cache = cls.get(termo)
        if em_cache:
            return em_cache
        try:
            resultado = FatSecretService.buscar_alimentos(termo, pagina=0, max_resultados=max_resultados)
            alimentos = resultado.get("alimentos", []) or []
        except Exception:
            alimentos = []
        cls.set(termo, alimentos)
        return list(alimentos)


class SugestaoService:

    # Configuração das refeições: (nome, % das calorias diárias)
    REFEICOES_CONFIG = [
        ("Café da manhã", 0.25),
        ("Almoço", 0.35),
        ("Jantar", 0.30),
        ("Lanche", 0.10),
    ]

    # Termos de busca por tipo de refeição (para FatSecret)
    BUSCA_POR_TIPO = {
        "Café da manhã": ["ovos", "aveia", "iogurte", "pão integral", "frutas", "vitamina", "granola", "queijo"],
        "Almoço": ["arroz feijão", "frango grelhado", "peixe", "carne magra", "salada", "quinoa", "batata doce", "legumes"],
        "Jantar": ["omelete", "sopa", "sanduíche natural", "wrap", "salada proteína", "peixe assado", "frango desfiado"],
        "Lanche": ["banana", "pasta amendoim", "iogurte proteico", "castanhas", "barrinha cereal", "whey", "frutas secas"],
    }

    # Categorias que não fazem sentido como item de refeição (evita
    # que o otimizador escolha, por exemplo, "óleo de canola").
    TERMOS_EXCLUIDOS = {
        "oleo", "azeite", "acucar", "sal", "pimenta", "Tempero",
        "Molho", "extrato", "Essencia", "corante", "levedo",
    }

    # Peso de cada macro no erro da otimização. Caloria domina porque
    # é o que o usuário enxerga; proteína é a meta mais buscada.
    PESOS = {"calorias": 1.0, "proteinas": 0.8, "carboidratos": 0.5, "gorduras": 0.4}

    # Faixa aceitável de porção por item, em gramas.
    PORCAO_MIN_G = 25.0
    PORCAO_MAX_G = 400.0
    PORCAO_PASSO_G = 5.0

    def __init__(self, db: Session):
        self.db = db
        self.perfil_repo = PerfilNutriRepository(db)
        self.meta_repo = MetaNutriRepository(db)
        self.alimento_repo = AlimentoRepository(db)
        self.refeicao_repo = RefeicaoRepository(db)

    def _buscar_alimentos_fatsecret(self, termo: str, max_resultados: int = 20) -> List[Dict]:
        """Busca alimentos no FatSecret (com cache em memória)."""
        return _CacheBusca.buscar(termo, max_resultados=max_resultados)

    @staticmethod
    def _para_100g(alimento: Dict) -> Dict | None:
        """
        Normaliza um alimento para a base de 100 g.

        Este era o bug central da implementação antiga: o código tratava as
        calorias como se fossem "por 100 g" e depois multiplicava por
        `quantidade_metrica / 100`. Mas o FatSecret devolve os macros da
        PORÇÃO (ex.: ovos = 50 g com 143 kcal). O resultado era uma contagem
        errada por um fator de escala em praticamente todo item.

        Aqui convertemos tudo para 100 g, que é a base comparável.
        """
        porcao = float(alimento.get("quantidade_metrica") or 100.0)
        if porcao <= 0:
            porcao = 100.0
        fator = 100.0 / porcao

        nome = alimento.get("nome") or alimento.get("food_name") or alimento.get("nome_alimento")
        if not nome:
            return None

        cal = float(alimento.get("calorias") or 0.0) * fator
        carb = float(alimento.get("carboidratos") or 0.0) * fator
        prot = float(alimento.get("proteinas") or 0.0) * fator
        gord = float(alimento.get("gorduras") or 0.0) * fator
        porcao_padrao = float(alimento.get("porcao_padrao_g") or porcao)

        return {
            "nome": nome,
            "marca": alimento.get("marca") or alimento.get("brand_name") or "",
            "calorias": round(cal, 2),
            "carboidratos": round(carb, 2),
            "proteinas": round(prot, 2),
            "gorduras": round(gord, 2),
            "quantidade_metrica": porcao,
            "unidade_metrica": alimento.get("unidade_metrica") or "g",
            "porcao_padrao_g": porcao_padrao,
            "food_id": alimento.get("food_id"),
        }

    def _filtrar_alimentos_por_macros(
        self,
        alimentos: List[Dict],
        meta_calorias: float,
        meta_carb: float,
        meta_prot: float,
        meta_gord: float,
        tolerancia: float = 0.3,
    ) -> List[Dict]:
        """
        Filtra e normaliza os alimentos candidatos para 100 g.

        A versão anterior aceitava praticamente todo alimento com caloria > 0
        e ignorava meta_calorias/meta_carb/meta_prot/meta_gord/tolerancia.
        Aqui o filtro realmente descarta o que não serve para a refeição.
        """
        filtrados: List[Dict] = []
        vistos: set[str] = set()

        for bruto in alimentos:
            normalizado = self._para_100g(bruto)
            if not normalizado:
                continue

            cal = normalizado["calorias"]

            # Sem valor nutricional utilizável
            if cal <= 0:
                continue

            # Ignora itens que não fazem sentido como item de refeição
            # (óleo, sal, temperos) — eles distorcem a otimização.
            nome_norm = _normalizar(normalizado["nome"])
            if any(termo in nome_norm for termo in self.TERMOS_EXCLUIDOS):
                continue

            # Deduplicação por nome normalizado
            if nome_norm in vistos:
                continue
            vistos.add(nome_norm)

            filtrados.append(normalizado)

        # Usa de fato as metas: descarta o que, sozinho na menor porção
        # permitida, já estoura o orçamento calórico da refeição. Sem isso o
        # pool chegava ao otimizador com itens impossíveis de 조합.
        viaveis = [a for a in filtrados if self._cabe_na_refeicao(a, meta_calorias, tolerancia)]

        # Rede de segurança: se o filtro esvaziar o pool (metas muito baixas
        # ou alimentos muito densos), mantém os candidatos normalizados para
        # que a refeição ainda seja montada.
        return viaveis or filtrados

    @staticmethod
    def _cabe_na_refeicao(alimento: Dict, meta_calorias: float, tolerancia: float) -> bool:
        """True se o alimento não estoura sozinho a meta calórica da refeição."""
        limite = max(meta_calorias, 1.0) * (1.0 + tolerancia)
        return alimento["calorias"] * (SugestaoService.PORCAO_MIN_G / 100.0) <= limite

    def _erro(self, totais: Dict[str, float], alvo: Dict[str, float]) -> float:
        """
        Erro ponderado entre o total da combinação e o alvo.

        Usamos desvio relativo (percentual) para cada macro, de modo que
        calorias em kcal, gramas de carboidrato e gramas de proteína sejam
        comparáveis na mesma escala.
        """
        erro = 0.0
        for macro, peso in self.PESOS.items():
            alvo_macro = max(alvo.get(macro, 0.0), 1e-6)
            desvio = (totais.get(macro, 0.0) - alvo_macro) / alvo_macro
            erro += peso * (desvio ** 2)
        return erro

    def _macros_da_porcao(self, alimento: Dict, gramas: float) -> Dict[str, float]:
        """Macros de uma porção específica (alimento já normalizado para 100 g)."""
        fator = gramas / 100.0
        return {
            "calorias": alimento["calorias"] * fator,
            "carboidratos": alimento["carboidratos"] * fator,
            "proteinas": alimento["proteinas"] * fator,
            "gorduras": alimento["gorduras"] * fator,
        }

    def _totalizar(self, combinacao: List[Dict]) -> Dict[str, float]:
        totais = {"calorias": 0.0, "carboidratos": 0.0, "proteinas": 0.0, "gorduras": 0.0}
        for item in combinacao:
            macros = self._macros_da_porcao(item, item["quantidade_sugerida_g"])
            for chave in totais:
                totais[chave] += macros[chave]
        return totais

    def _arredondar_porcao(self, gramas: float) -> float:
        """Arredonda a porção para passos de 5 g, respeitando as faixas."""
        limitada = min(max(gramas, self.PORCAO_MIN_G), self.PORCAO_MAX_G)
        return max(round(limitada / self.PORCAO_PASSO_G) * self.PORCAO_PASSO_G, self.PORCAO_PASSO_G)

    def _selecionar_combinacao_otima(
        self,
        alimentos: List[Dict],
        alvo_cal: float,
        alvo_carb: float,
        alvo_prot: float,
        alvo_gord: float,
        max_itens: int = 4,
    ) -> List[Dict]:
        """
        Seleciona a combinação de alimentos que melhor atinge as macros alvo.

        A versão anterior era um guloso que apenas evitava estourar 120% do
        alvo, o que deixava o resultado final muito abaixo da meta (chegando a
        desvios de 89% nas gorduras). Aqui fazemos uma busca local de verdade:

        1. Começa com o item mais próximo do alvo (semente).
        2. Testa adicionar cada candidato restante, medindo o erro real.
        3. Refina as porções por coordenada-descida para fechar a meta.

        A entrada `alimentos` deve estar normalizada em 100 g (ver `_para_100g`).
        """
        if not alimentos:
            return []

        alvo = {
            "calorias": alvo_cal,
            "carboidratos": alvo_carb,
            "proteinas": alvo_prot,
            "gorduras": alvo_gord,
        }

        # 1. Semente: item mais próximo do alvo, com a porção que fecha as calorias.
        porcao_inicial = self._arredondar_porcao(alvo_cal / max(alimentos[0]["calorias"], 1e-6))
        semente = min(
            alimentos,
            key=lambda a: self._erro(self._macros_da_porcao(a, porcao_inicial), alvo),
        )
        combinacao = [{**semente, "quantidade_sugerida_g": porcao_inicial}]

        # 2. Expansão gulosa: adiciona o candidato que mais reduz o erro.
        while len(combinacao) < max_itens:
            total_atual = self._totalizar(combinacao)
            melhor_erro = self._erro(total_atual, alvo)
            melhor_candidato = None
            restante_cal = max(alvo_cal - total_atual["calorias"], 0.0)

            for candidato in alimentos:
                if any(candidato["nome"] == item["nome"] for item in combinacao):
                    continue
                gramas = self._arredondar_porcao(
                    max(restante_cal / max(candidato["calorias"], 1e-6), self.PORCAO_MIN_G)
                )
                teste = combinacao + [{**candidato, "quantidade_sugerida_g": gramas}]
                erro = self._erro(self._totalizar(teste), alvo)
                if erro < melhor_erro:
                    melhor_erro = erro
                    melhor_candidato = {**candidato, "quantidade_sugerida_g": gramas}

            if melhor_candidato is None:
                break
            combinacao.append(melhor_candidato)

        # 3. Refino das porções.
        combinacao = self._refinar_porcoes(combinacao, alvo)

        # 4. Macros finais de cada item, já com a porção definitiva.
        resultado = []
        for item in combinacao:
            macros = self._macros_da_porcao(item, item["quantidade_sugerida_g"])
            resultado.append({
                **item,
                "calorias_item": round(macros["calorias"], 1),
                "carb_item": round(macros["carboidratos"], 1),
                "prot_item": round(macros["proteinas"], 1),
                "gord_item": round(macros["gorduras"], 1),
            })
        return resultado

    def _refinar_porcoes(self, combinacao: List[Dict], alvo: Dict[str, float], iteracoes: int = 60) -> List[Dict]:
        """
        Ajuste fino das porções por coordenada-descida.

        Duas passagens: primeiro multiplicativa (meia porção, 3/4, dobro...),
        depois aditiva em passos pequenos (±5 g, ±10 g, ±15 g). A segunda
        passada é o que fecha o desvio residual e é o que garante que a
        quantidade sugerida seja realmente comível pelo usuário.
        """
        combinacao = [dict(item) for item in combinacao]
        if not combinacao:
            return combinacao

        melhor_erro_global = self._erro(self._totalizar(combinacao), alvo)
        # (multiplicativo?, valores). 1ª passada reposiciona a porção;
        # 2ª passada fecha o resíduo em passos de 5 g.
        passes = (
            (True, (0.5, 0.75, 1.25, 1.5, 2.0)),
            (False, (-15.0, -10.0, -5.0, 5.0, 10.0, 15.0)),
        )

        for multiplicativo, fatores in passes:
            for _ in range(iteracoes):
                melhorou = False

                for indice, item in enumerate(combinacao):
                    porcao_atual = item["quantidade_sugerida_g"]
                    melhor_porcao = porcao_atual
                    melhor_erro = melhor_erro_global

                    for fator in fatores:
                        porcao_bruta = porcao_atual * fator if multiplicativo else porcao_atual + fator
                        porcao_teste = self._arredondar_porcao(porcao_bruta)
                        if porcao_teste == porcao_atual:
                            continue
                        combinacao[indice]["quantidade_sugerida_g"] = porcao_teste
                        erro = self._erro(self._totalizar(combinacao), alvo)
                        if erro < melhor_erro:
                            melhor_erro = erro
                            melhor_porcao = porcao_teste

                    combinacao[indice]["quantidade_sugerida_g"] = melhor_porcao
                    if melhor_erro < melhor_erro_global:
                        melhor_erro_global = melhor_erro
                        melhorou = True

                if not melhorou:
                    break  # convergiu neste passe

        return combinacao

    def _importar_alimento_local(self, item: Dict) -> Dict | None:
        """
        Garante o alimento na base local para poder virar item de refeição.

        Dois bugs corrigidos aqui:

        - Antes consultava `buscar_por_origem("FatSecret", food_id)`, que
          filtrava `nome_alimento LIKE %food_id%`. Como o nome do alimento
          nunca contém o food_id, a busca SEMPRE retornava None e o mesmo
          alimento era importado de novo a cada geração (duplicatas no banco).
          Agora o food_id fica gravado em `origem_dados` e é buscado por ele.

        - Antes chamava `FatSecretService.importar_alimento(food_id)`, gerando
          uma requisição HTTP por item. Como já temos os dados normalizados
          para 100 g em mãos, gravamos direto, sem rede.
        """
        food_id = item.get("food_id")
        if not food_id:
            return None

        try:
            existente = self.alimento_repo.buscar_por_origem("FatSecret", food_id)
            if existente:
                return {
                    "id_alimento": existente.id_alimento,
                    "nome_alimento": existente.nome_alimento,
                    "porcao_padrao_g": existente.porcao_padrao_g,
                }

            # Os macros já estão normalizados para 100 g por `_para_100g`.
            dados = {
                "nome_alimento": item["nome"],
                "porcao_padrao_g": 100.0,
                "calorias": item["calorias"],
                "carboidratos": item["carboidratos"],
                "proteinas": item["proteinas"],
                "gorduras": item["gorduras"],
                "origem_dados": f"FatSecret:{food_id}",
            }
            alimento = self.alimento_repo.create(dados)
            return {
                "id_alimento": alimento.id_alimento,
                "nome_alimento": alimento.nome_alimento,
                "porcao_padrao_g": alimento.porcao_padrao_g,
            }
        except Exception:
            self.db.rollback()
            return None

    def gerar_todas(self, id_usuario: UUID | str) -> List[SugestaoRefeicao]:
        meta = self.meta_repo.get_meta_atual(id_usuario)
        if not meta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Defina suas metas nutricionais antes de gerar sugestões"
            )

        perfil = self.perfil_repo.get_by_usuario(id_usuario)
        objetivo = perfil.objetivo_nutricional if perfil else "manter_peso"
        hoje = date.today().isoformat()

        # Extrai valores numéricos das metas (são floats do SQLAlchemy)
        meta_cal = float(meta.calorias_diarias)
        meta_carb = float(meta.carboidrato_g)
        meta_prot = float(meta.proteina_g)
        meta_gord = float(meta.gordura_g)

        # Remove sugestões antigas do dia
        self.db.query(SugestaoRefeicao).filter(
            SugestaoRefeicao.id_usuario == str(id_usuario),
            SugestaoRefeicao.data_geracao == hoje,
        ).delete()

        sugestoes = []
        
        for tipo, pct in self.REFEICOES_CONFIG:
            # Metas para esta refeição
            alvo_cal = meta_cal * pct
            alvo_carb = meta_carb * pct
            alvo_prot = meta_prot * pct
            alvo_gord = meta_gord * pct

            # Busca alimentos variados no FatSecret para este tipo de refeição
            todos_alimentos = []
            for termo in self.BUSCA_POR_TIPO.get(tipo, []):
                alimentos = self._buscar_alimentos_fatsecret(termo, max_resultados=10)
                todos_alimentos.extend(alimentos)
            
            # Remove duplicatas por food_id
            vistos = set()
            unicos = []
            for a in todos_alimentos:
                fid = a.get("food_id")
                if fid and fid not in vistos:
                    vistos.add(fid)
                    unicos.append(a)
            
            # Filtra por macros compatíveis
            filtrados = self._filtrar_alimentos_por_macros(
                unicos, alvo_cal, alvo_carb, alvo_prot, alvo_gord
            )
            
            # Seleciona melhor combinação
            combinacao = self._selecionar_combinacao_otima(
                filtrados, alvo_cal, alvo_carb, alvo_prot, alvo_gord
            )
            
            # Importa alimentos selecionados para base local
            alimentos_sugeridos = []
            total_cal = total_carb = total_prot = total_gord = 0.0

            for item in combinacao:
                local = self._importar_alimento_local(item)
                if local:
                    item["id_alimento_local"] = local["id_alimento"]
                alimentos_sugeridos.append(self._item_sugerido(item))
                total_cal += item["calorias_item"]
                total_carb += item["carb_item"]
                total_prot += item["prot_item"]
                total_gord += item["gord_item"]

            # Sem resultado (FatSecret indisponível, sem meta, etc.):
            # devolve uma sugestão sem alimentos em vez de inventar um item
            # falso. A versão anterior criava "Sugestão almoço para perder_peso"
            # com os macros da meta, o que é nutricionalmente enganoso.
            if not alimentos_sugeridos:
                total_cal = total_carb = total_prot = total_gord = 0.0

            sugestao = SugestaoRefeicao(
                id_usuario=str(id_usuario),
                nome=f"{tipo} • {round(total_cal)} kcal",
                descricao=(
                    f"Combinação para {objetivo.replace('_', ' ')} "
                    f"com base nas suas metas ({round(meta_cal)} kcal/dia)"
                ),
                tipo_refeicao=tipo,
                calorias=round(total_cal),
                carboidratos=round(total_carb),
                proteinas=round(total_prot),
                gorduras=round(total_gord),
                alimentos_sugeridos=json.dumps(alimentos_sugeridos, ensure_ascii=False),
                aceita=False,
                data_geracao=hoje,
            )
            self.db.add(sugestao)
            self.db.flush()
            sugestoes.append(sugestao)

        self.db.commit()
        return [self._serializar(s) for s in sugestoes]

    @staticmethod
    def _item_sugerido(item: Dict) -> Dict:
        """Normaliza um item da combinação para o formato persistido."""
        return {
            "id_alimento_local": item.get("id_alimento_local"),
            "food_id": item.get("food_id"),
            "nome": item["nome"],
            "marca": item.get("marca", ""),
            "quantidade_g": item["quantidade_sugerida_g"],
            "calorias": round(item["calorias_item"], 1),
            "carboidratos": round(item["carb_item"], 1),
            "proteinas": round(item["prot_item"], 1),
            "gorduras": round(item["gord_item"], 1),
        }

    @staticmethod
    def _serializar(sugestao: SugestaoRefeicao) -> Dict:
        """Converte o model em dict de resposta (com o JSON deserializado)."""
        return {
            "id_sugestao": sugestao.id_sugestao,
            "id_usuario": sugestao.id_usuario,
            "nome": sugestao.nome,
            "descricao": sugestao.descricao,
            "tipo_refeicao": sugestao.tipo_refeicao,
            "calorias": sugestao.calorias,
            "carboidratos": sugestao.carboidratos,
            "proteinas": sugestao.proteinas,
            "gorduras": sugestao.gorduras,
            "aceita": sugestao.aceita,
            "data_geracao": sugestao.data_geracao,
            "alimentos_sugeridos": (
                json.loads(sugestao.alimentos_sugeridos) if sugestao.alimentos_sugeridos else []
            ),
        }

    def listar_por_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 50) -> List[Dict]:
        lista = (
            self.db.query(SugestaoRefeicao)
            .filter(SugestaoRefeicao.id_usuario == str(id_usuario))
            .order_by(SugestaoRefeicao.data_geracao.desc(), SugestaoRefeicao.id_sugestao.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [self._serializar(s) for s in lista]

    def aceitar(self, id_sugestao: UUID | str, id_usuario: UUID | str | None = None) -> Dict:
        """
        Marca a sugestão como aceita e materializa a refeição no diário.

        Antes apenas ligava a flag `aceita` — os alimentos nunca entravam no
        diário, então aceitar não tinha efeito prático no app. Também havia um
        bug que devolvia `carboidratos` com o valor de `calorias`.

        `id_usuario`, quando informado, garante que a sugestão pertence a quem
        está aceitando (proteção contra IDOR).
        """
        sugestao = self.db.query(SugestaoRefeicao).filter(
            SugestaoRefeicao.id_sugestao == str(id_sugestao)
        ).first()
        if not sugestao:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sugestão não encontrada")

        if id_usuario is not None and str(sugestao.id_usuario) != str(id_usuario):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sugestão de outro usuário")

        itens = json.loads(sugestao.alimentos_sugeridos) if sugestao.alimentos_sugeridos else []

        refeicao = Refeicao(
            id_usuario=str(sugestao.id_usuario),
            data_refeicao=date.today(),
            tipo_refeicao=sugestao.tipo_refeicao,
        )
        self.db.add(refeicao)
        self.db.flush()

        itens_criados = 0
        for item in itens:
            id_alimento = item.get("id_alimento_local")
            quantidade = float(item.get("quantidade_g") or 0)
            if not id_alimento or quantidade <= 0:
                continue
            if not self.alimento_repo.get_by_id(id_alimento):
                continue
            self.db.add(ItemRefeicao(
                id_refeicao=str(refeicao.id_refeicao),
                id_alimento=str(id_alimento),
                quantidade_alimento_g=quantidade,
            ))
            itens_criados += 1

        sugestao.aceita = True
        self.db.commit()
        self.db.refresh(refeicao)
        self.db.refresh(sugestao)

        return {
            "sugestao": self._serializar(sugestao),
            "id_refeicao": str(refeicao.id_refeicao),
            "itens_criados": itens_criados,
        }
