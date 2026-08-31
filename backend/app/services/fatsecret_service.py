# ───────────────────────────────────────────────────────────────
# backend/app/services/fatsecret_service.py
# Serviço de integração com FatSecret com Catálogo Híbrido/Fallback Offline
# ───────────────────────────────────────────────────────────────
import re
import unicodedata
import httpx
from fastapi import HTTPException, status
from app.services.fatsecret_auth_service import FatAuthService


def _as_list(val) -> list:
    """FatSecret às vezes retorna um dict quando há apenas 1 item; normaliza para lista."""
    if isinstance(val, dict):
        return [val]
    return val or []


def _float(val, default: float = 0.0) -> float:
    try:
        return float(val) if val is not None else default
    except (TypeError, ValueError):
        return default


def _normalizar(txt: str) -> str:
    if not txt:
        return ""
    return unicodedata.normalize("NFKD", txt).encode("ASCII", "ignore").decode("utf-8").lower().strip()


def _parse_food_description(desc: str) -> dict:
    if not desc:
        return {"calorias": 0.0, "proteinas": 0.0, "carboidratos": 0.0, "gorduras": 0.0, "porcao_padrao_g": 100.0}
    
    cal_match = re.search(r'(?:Calories|Calorias):\s*([\d\.,]+)', desc, re.I)
    fat_match = re.search(r'(?:Fat|Gordura|Gorduras):\s*([\d\.,]+)', desc, re.I)
    carb_match = re.search(r'(?:Carbs|Carboidratos):\s*([\d\.,]+)', desc, re.I)
    prot_match = re.search(r'(?:Protein|Prote[íi]na|Prot):\s*([\d\.,]+)', desc, re.I)
    portion_match = re.search(r'(?:Per|Por)\s*([\d\.,]+)\s*g', desc, re.I)

    def _to_float(m, default=0.0):
        if not m:
            return default
        try:
            return float(m.group(1).replace(',', '.'))
        except (ValueError, TypeError):
            return default

    return {
        "calorias": round(_to_float(cal_match)),
        "gorduras": _to_float(fat_match),
        "carboidratos": _to_float(carb_match),
        "proteinas": _to_float(prot_match),
        "porcao_padrao_g": _to_float(portion_match, 100.0) or 100.0,
    }


# ───────────────────────────────────────────────────────────────
# ───────────────────────────────────────────────────────────────
# Catálogo Extenso Brasileiro & Tabela TACO / IBGE
# (Permite testar e pesquisar alimentos típicos do Brasil com riqueza de detalhes)
# ───────────────────────────────────────────────────────────────
class FatSecretService:

    API_URL = "https://platform.fatsecret.com/rest/server.api"

    @classmethod
    def _request(cls, params: dict) -> dict:
        token = FatAuthService.get_token()
        params["format"] = "json"
        response = httpx.post(
            cls.API_URL,
            data=params,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        if isinstance(data, dict) and "error" in data:
            err = data["error"]
            code = err.get("code")
            msg = err.get("message")
            print(f"[FatSecret] Erro retornado pela API ({code}): {msg}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"FatSecret API Error [{code}]: {msg}",
            )
        return data

    @classmethod
    def buscar_alimentos(cls, nome: str, pagina: int = 0, max_resultados: int = 25, categoria: str | None = None, somente_brasil: bool = False) -> dict:
        alimentos_formatados = []

        if not nome or not nome.strip():
            return {
                "alimentos": [],
                "total_resultados": 0,
                "pagina": pagina,
                "max_resultados": max_resultados,
            }

        q_limpo = nome.strip()
        q_norm = _normalizar(q_limpo)

        # 1. Buscar na Tabela TACO Oficial via API HTTP
        try:
            from app.services.taco_service import TacoService
            taco_alimentos = TacoService.buscar_alimentos(q_limpo, max_resultados=max_resultados)
            alimentos_formatados.extend(taco_alimentos)
        except Exception as e_taco:
            print(f"[FatSecretService] Aviso ao buscar TACO: {e_taco}")

        # 2. Termos estrangeiros e colisões da base americana a serem filtrados
        TERMOS_ESTRANGEIROS = {
            'style', 'enriched', 'long grain', 'vegetables', 'puerto rican', 'el mexicano', 
            'con vegetables', 'con pollo', 'seasoned', 'cooked with', 'shredded', 'soup', 
            'casserole', 'white rice', 'brown rice', 'fried rice', 'yellow rice', 'spanish rice',
            'fitlife foods', 'del real foods', 'turnover', 'meat pie', 'patty', 'meatball',
            'golden corral', 'pasteles', 'pastelon', 'cookies', 'pale ale', 'chili', 'add-on',
            'bowl', 'pate', 'paste or pate', 'chicken liver', 'gravy', 'stewed', 'sandwich',
            'nugget', 'dressing', 'sauce', 'dip', 'mint chocolates', 'mints', 'frango mints',
            'candy cane', 'toffee crunch', 'pastel mints', 'pastel eggs', 'chocolate trio',
            'dark chocolate', 'mint chocolate', 'chocolate mints', 'pastel de papa', 
            'pastel azteca', 'licorice pastels', 'licorice', 'ice age meals', 'marcela valladolid',
            'world market', 'paris baguette'
        }

        # 3. Buscar no FatSecret e filtrar pratos em inglês / estrangeiros
        req_params = {
            "method": "foods.search",
            "search_expression": q_limpo,
            "region": "BR",
            "language": "pt",
            "page_number": pagina,
            "max_results": max_resultados,
        }

        try:
            resultado = cls._request(req_params)
            foods_data = resultado.get("foods", {})
            foods = _as_list(foods_data.get("food", []))

            nomes_existentes = set(_normalizar(item["nome"]) for item in alimentos_formatados)
            tokens_q = [t for t in q_norm.split() if len(t) > 2]

            for f in foods:
                desc = f.get("food_description") or ""
                macros = _parse_food_description(desc)
                nome_f = f.get("food_name") or ""
                marca_f = f.get("brand_name", "")

                texto_completo = _normalizar(f"{nome_f} {marca_f}")

                # Ignora pratos com nomes em inglês e colisões da base US do FatSecret
                if any(t in texto_completo for t in TERMOS_ESTRANGEIROS):
                    continue

                # Garante que pelo menos um token da busca existe no nome/marca
                if tokens_q and not any(t in texto_completo for t in tokens_q):
                    continue

                if _normalizar(nome_f) in nomes_existentes:
                    continue

                alimentos_formatados.append({
                    "food_id": str(f.get("food_id")),
                    "id_alimento": str(f.get("food_id")),
                    "id": str(f.get("food_id")),
                    "nome": nome_f,
                    "nome_alimento": nome_f,
                    "marca": marca_f,
                    "tipo": f.get("food_type"),
                    "url": f.get("food_url"),
                    "descricao": desc,
                    "calorias": macros["calorias"],
                    "proteinas": macros["proteinas"],
                    "carboidratos": macros["carboidratos"],
                    "gorduras": macros["gorduras"],
                    "porcao_padrao_g": macros["porcao_padrao_g"],
                    "origem_dados": "FatSecret",
                })
                nomes_existentes.add(_normalizar(nome_f))

            return {
                "alimentos": alimentos_formatados,
                "total_resultados": len(alimentos_formatados),
                "pagina": pagina,
                "max_resultados": max_resultados,
            }
        except HTTPException:
            raise
        except Exception as ex:
            print(f"[FatSecret] Erro na busca de alimentos: {ex}")
            return {
                "alimentos": alimentos_formatados,
                "total_resultados": len(alimentos_formatados),
                "pagina": pagina,
                "max_resultados": max_resultados,
            }

    @classmethod
    def buscar_alimento_por_id(cls, food_id: str) -> dict:
        resultado = cls._request({"method": "food.get.v4", "food_id": food_id})
        food = resultado.get("food", {})

        servings = _as_list(food.get("servings", {}).get("serving", []))
        serving_default = next(
            (s for s in servings if s.get("is_default") in ("1", True)),
            servings[0] if servings else {},
        )

        return {
            "food_id": food.get("food_id"),
            "nome": food.get("food_name"),
            "marca": food.get("brand_name", ""),
            "tipo": food.get("food_type"),
            "url": food.get("food_url"),
            "porcoes": [
                {
                    "serving_id": s.get("serving_id"),
                    "descricao": s.get("serving_description"),
                    "quantidade_metrica": _float(s.get("metric_serving_amount")),
                    "unidade_metrica": s.get("metric_serving_unit", "g"),
                    "calorias": _float(s.get("calories")),
                    "carboidratos": _float(s.get("carbohydrate")),
                    "proteinas": _float(s.get("protein")),
                    "gorduras": _float(s.get("fat")),
                    "gordura_saturada": _float(s.get("saturated_fat")),
                    "fibra": _float(s.get("fiber")),
                    "acucar": _float(s.get("sugar")),
                    "sodio": _float(s.get("sodium")),
                }
                for s in servings
            ],
            "porcao_padrao": {
                "serving_id": serving_default.get("serving_id"),
                "descricao": serving_default.get("serving_description"),
                "quantidade_metrica": _float(serving_default.get("metric_serving_amount")),
                "unidade_metrica": serving_default.get("metric_serving_unit", "g"),
                "calorias": _float(serving_default.get("calories")),
                "carboidratos": _float(serving_default.get("carbohydrate")),
                "proteinas": _float(serving_default.get("protein")),
                "gorduras": _float(serving_default.get("fat")),
            },
        }

    @classmethod
    def importar_alimento(cls, food_id: str) -> dict:
        detalhes = cls.buscar_alimento_por_id(food_id)
        porcao = detalhes.get("porcao_padrao", {})
        return {
            "nome_alimento": detalhes.get("nome", "Alimento"),
            "porcao_padrao_g": porcao.get("quantidade_metrica", 100.0) if porcao.get("quantidade_metrica", 0) > 0 else 100.0,
            "calorias": porcao.get("calorias", 0.0),
            "carboidratos": porcao.get("carboidratos", 0.0),
            "proteinas": porcao.get("proteinas", 0.0),
            "gorduras": porcao.get("gorduras", 0.0),
            "origem_dados": "FatSecret",
        }
