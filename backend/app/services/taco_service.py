# ───────────────────────────────────────────────────────────────
# backend/app/services/taco_service.py
# Serviço de Consulta HTTP para a Tabela TACO Oficial (UNICAMP / NEPA)
# com formatação amigável de nomes e suporte completo à culinária brasileira
# ───────────────────────────────────────────────────────────────
import time
import unicodedata
import httpx

_TACO_CACHE = None
_CACHE_TIMESTAMP = 0
_CACHE_TTL_SECS = 3600  # 1 hora de cache em memória para otimizar requisições

TACO_API_URL = "https://raw.githubusercontent.com/marcelosanto/tabela_taco/master/tabela_alimentos.json"


def _normalizar(txt: str) -> str:
    if not txt:
        return ""
    return unicodedata.normalize("NFKD", txt).encode("ASCII", "ignore").decode("utf-8").lower().strip()


def _to_float(val, default: float = 0.0) -> float:
    if val is None or val == "" or val == "NA" or val == "Tr":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _formatar_nome_amigavel(desc: str) -> str:
    """Transforma nomes laboratoriais com vírgulas ('Pastel, de carne, frito') em nomes naturais."""
    if not desc:
        return ""
    partes = [p.strip() for p in desc.split(",") if p.strip()]
    if not partes:
        return desc

    # Ex: Carne, bovina, picanha, grelhada -> Picanha Bovina Grelhada
    if len(partes) >= 3 and partes[0].lower() == "carne" and partes[1].lower() == "bovina":
        corte = partes[2]
        resto = " ".join(partes[3:])
        return f"{corte.title()} Bovina {resto.title()}".strip()

    # Ex: Arroz, tipo 1, cozido -> Arroz Branco Cozido
    if len(partes) >= 2 and partes[0].lower() == "arroz" and "tipo 1" in partes[1].lower():
        resto = " ".join(partes[2:])
        return f"Arroz Branco {resto.title()}".strip()

    texto = " ".join(partes)
    # Ajusta capitalização de conectivos
    palavras = texto.split()
    conectivos = {"de", "da", "do", "das", "dos", "com", "e", "em", "sem"}
    res = []
    for i, p in enumerate(palavras):
        if i > 0 and p.lower() in conectivos:
            res.append(p.lower())
        else:
            res.append(p.capitalize())
    return " ".join(res)


# Variações populares autênticas da culinária brasileira para complementar termos comuns
VARIACOES_CULINARIA_BRASIL = {
    "pastel": [
        {"nome": "Pastel de Carne Frito", "calorias": 290, "proteinas": 9.5, "carboidratos": 30.0, "gorduras": 14.5},
        {"nome": "Pastel de Queijo Frito", "calorias": 310, "proteinas": 10.5, "carboidratos": 28.0, "gorduras": 17.0},
        {"nome": "Pastel de Pizza (Queijo, Presunto, Tomate e Orégano)", "calorias": 280, "proteinas": 11.0, "carboidratos": 27.0, "gorduras": 14.0},
        {"nome": "Pastel de Frango com Catupiry", "calorias": 275, "proteinas": 12.0, "carboidratos": 26.0, "gorduras": 13.5},
        {"nome": "Pastel de Palmito", "calorias": 220, "proteinas": 5.0, "carboidratos": 28.0, "gorduras": 10.0},
        {"nome": "Pastel de Calabresa com Queijo", "calorias": 320, "proteinas": 12.5, "carboidratos": 26.0, "gorduras": 18.0},
        {"nome": "Pastel de Bauru", "calorias": 285, "proteinas": 11.5, "carboidratos": 27.0, "gorduras": 14.5},
        {"nome": "Pastel de Carne Seca com Requeijão", "calorias": 295, "proteinas": 14.0, "carboidratos": 25.0, "gorduras": 15.0},
        {"nome": "Pastel de Bacalhau", "calorias": 260, "proteinas": 13.0, "carboidratos": 25.0, "gorduras": 12.0},
        {"nome": "Pastel de Camarão com Catupiry", "calorias": 250, "proteinas": 12.5, "carboidratos": 24.0, "gorduras": 11.5},
        {"nome": "Pastel de Carne com Ovo", "calorias": 285, "proteinas": 11.0, "carboidratos": 28.0, "gorduras": 14.0},
        {"nome": "Pastel Doce Romeu e Julieta (Queijo com Goiabada)", "calorias": 330, "proteinas": 7.0, "carboidratos": 48.0, "gorduras": 12.0},
        {"nome": "Pastel Doce de Chocolate / Brigadeiro", "calorias": 380, "proteinas": 6.0, "carboidratos": 50.0, "gorduras": 18.0},
        {"nome": "Pastel Doce de Banana com Canela", "calorias": 260, "proteinas": 4.0, "carboidratos": 45.0, "gorduras": 8.0},
        {"nome": "Pastel Assado de Frango", "calorias": 210, "proteinas": 11.0, "carboidratos": 28.0, "gorduras": 6.0},
        {"nome": "Pastel Assado de Carne", "calorias": 225, "proteinas": 10.0, "carboidratos": 29.0, "gorduras": 7.5},
    ],
}


class TacoService:

    @classmethod
    def _obter_dados_taco(cls) -> list:
        global _TACO_CACHE, _CACHE_TIMESTAMP
        agora = time.time()
        if _TACO_CACHE is not None and (agora - _CACHE_TIMESTAMP) < _CACHE_TTL_SECS:
            return _TACO_CACHE

        try:
            with httpx.Client(timeout=10) as client:
                resp = client.get(TACO_API_URL)
                if resp.status_code == 200:
                    _TACO_CACHE = resp.json()
                    _CACHE_TIMESTAMP = agora
                    return _TACO_CACHE
        except Exception as e:
            print(f"[TacoService] Aviso ao consultar API da TACO: {e}")

        return _TACO_CACHE or []

    @classmethod
    def buscar_alimentos(cls, termo: str, max_resultados: int = 25) -> list:
        if not termo or not termo.strip():
            return []

        q_norm = _normalizar(termo)
        tokens = [t for t in q_norm.split() if len(t) > 1]
        busca_cru = "cru" in q_norm
        busca_massa = "massa" in q_norm

        resultados = []
        nomes_vistos = set()

        # 1. Se o termo corresponde a itens da culinária popular brasileira (ex: tipos de pastel)
        for chave, itens in VARIACOES_CULINARIA_BRASIL.items():
            if chave in q_norm:
                for idx, v in enumerate(itens):
                    nome_v = v["nome"]
                    nome_norm = _normalizar(nome_v)
                    if q_norm in nome_norm or all(t in nome_norm for t in tokens):
                        resultados.append({
                            "food_id": f"br_{chave}_{idx + 1}",
                            "id_alimento": f"br_{chave}_{idx + 1}",
                            "id": f"br_{chave}_{idx + 1}",
                            "nome": nome_v,
                            "nome_alimento": nome_v,
                            "marca": "Culinária Brasileira",
                            "tipo": "Generic",
                            "url": "",
                            "descricao": f"Por 100g - Calorias: {v['calorias']}kcal | Gorduras: {v['gorduras']}g | Carbs: {v['carboidratos']}g | Prot: {v['proteinas']}g",
                            "calorias": v["calorias"],
                            "proteinas": v["proteinas"],
                            "carboidratos": v["carboidratos"],
                            "gorduras": v["gorduras"],
                            "porcao_padrao_g": 100.0,
                            "origem_dados": "Tabela Brasileira",
                        })
                        nomes_vistos.add(nome_norm)

        # 2. Buscar na Tabela TACO Oficial da UNICAMP
        dados = cls._obter_dados_taco()
        for item in dados:
            desc = item.get("description", "")
            desc_norm = _normalizar(desc)

            # Filtra itens laboratoriais crus se o usuário não pediu "cru"
            if not busca_cru and ", cru" in desc_norm and (", cozido" in desc_norm or ", frito" in desc_norm or ", grelhado" in desc_norm or "pastel" in desc_norm):
                continue
            if not busca_massa and "massa, crua" in desc_norm:
                continue

            # Match exato ou se todos os tokens da busca estão presentes na descrição
            if q_norm in desc_norm or (tokens and all(t in desc_norm for t in tokens)):
                nome_amigavel = _formatar_nome_amigavel(desc)
                nome_amigavel_norm = _normalizar(nome_amigavel)

                if nome_amigavel_norm in nomes_vistos:
                    continue

                cal = round(_to_float(item.get("energy_kcal")))
                prot = round(_to_float(item.get("protein_g")), 1)
                carb = round(_to_float(item.get("carbohydrate_g")), 1)
                gord = round(_to_float(item.get("lipid_g")), 1)

                cat = item.get("category", "Tabela TACO")
                resultados.append({
                    "food_id": f"taco_{item.get('id', 0)}",
                    "id_alimento": f"taco_{item.get('id', 0)}",
                    "id": f"taco_{item.get('id', 0)}",
                    "nome": nome_amigavel,
                    "nome_alimento": nome_amigavel,
                    "marca": f"Tabela TACO ({cat})",
                    "tipo": "Generic",
                    "url": "",
                    "descricao": f"Por 100g - Calorias: {cal}kcal | Gorduras: {gord}g | Carbs: {carb}g | Prot: {prot}g",
                    "calorias": cal,
                    "proteinas": prot,
                    "carboidratos": carb,
                    "gorduras": gord,
                    "porcao_padrao_g": 100.0,
                    "origem_dados": "Tabela TACO",
                })
                nomes_vistos.add(nome_amigavel_norm)

                if len(resultados) >= max_resultados:
                    break

        return resultados
