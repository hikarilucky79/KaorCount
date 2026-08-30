import re
import httpx

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
        return response.json()

    @classmethod
    def buscar_alimentos(cls, nome: str, pagina: int = 0, max_resultados: int = 20) -> dict:
        resultado = cls._request({
            "method": "foods.search",
            "search_expression": nome,
            "page_number": pagina,
            "max_results": max_resultados,
        })
        foods_data = resultado.get("foods", {})
        foods = _as_list(foods_data.get("food", []))

        alimentos_formatados = []
        for f in foods:
            desc = f.get("food_description") or ""
            macros = _parse_food_description(desc)
            alimentos_formatados.append({
                "food_id": f.get("food_id"),
                "id_alimento": f.get("food_id"),
                "id": f.get("food_id"),
                "nome": f.get("food_name"),
                "nome_alimento": f.get("food_name"),
                "marca": f.get("brand_name", ""),
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

        return {
            "alimentos": alimentos_formatados,
            "total_resultados": int(foods_data.get("total_results", 0)),
            "pagina": int(foods_data.get("page_number", 0)),
            "max_resultados": int(foods_data.get("max_results", 20)),
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
        porcao = detalhes["porcao_padrao"]
        return {
            "nome_alimento": detalhes["nome"],
            "porcao_padrao_g": porcao["quantidade_metrica"] if porcao["quantidade_metrica"] > 0 else 100.0,
            "calorias": porcao["calorias"],
            "carboidratos": porcao["carboidratos"],
            "proteinas": porcao["proteinas"],
            "gorduras": porcao["gorduras"],
            "origem_dados": "FatSecret",
        }
