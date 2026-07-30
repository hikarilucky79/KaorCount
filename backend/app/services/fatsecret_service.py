import httpx

from app.services.fatsecret_auth_service import FatAuthService


class FatSecretService:

    API_URL = "https://platform.fatsecret.com/rest/server.api"

    @classmethod
    def _request(cls, params: dict) -> dict:
        token = FatAuthService.get_token()
        params["format"] = "json"

        response = httpx.post(
            cls.API_URL,
            data=params,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout=15,
        )
        response.raise_for_status()
        return response.json()

    @classmethod
    def buscar_alimentos(cls, nome: str, pagina: int = 0, max_resultados: int = 20) -> dict:
        params = {
            "method": "foods.search",
            "search_expression": nome,
            "page_number": pagina,
            "max_results": max_resultados,
        }
        resultado = cls._request(params)

        foods_data = resultado.get("foods", {})
        foods = foods_data.get("food", [])
        if isinstance(foods, dict):
            foods = [foods]

        return {
            "alimentos": [
                {
                    "food_id": f.get("food_id"),
                    "nome": f.get("food_name"),
                    "marca": f.get("brand_name", ""),
                    "tipo": f.get("food_type"),
                    "url": f.get("food_url"),
                    "descricao": f.get("food_description"),
                }
                for f in foods
            ],
            "total_resultados": int(foods_data.get("total_results", 0)),
            "pagina": int(foods_data.get("page_number", 0)),
            "max_resultados": int(foods_data.get("max_results", 20)),
        }

    @classmethod
    def buscar_alimento_por_id(cls, food_id: str) -> dict:
        params = {
            "method": "food.get.v4",
            "food_id": food_id,
        }
        resultado = cls._request(params)
        food = resultado.get("food", {})

        servings = food.get("servings", {}).get("serving", [])
        if isinstance(servings, dict):
            servings = [servings]

        serving_default = next((s for s in servings if s.get("is_default") in ("1", True)), servings[0] if servings else {})

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
                    "quantidade_metrica": float(s.get("metric_serving_amount", 0) or 0),
                    "unidade_metrica": s.get("metric_serving_unit", "g"),
                    "calorias": float(s.get("calories", 0) or 0),
                    "carboidratos": float(s.get("carbohydrate", 0) or 0),
                    "proteinas": float(s.get("protein", 0) or 0),
                    "gorduras": float(s.get("fat", 0) or 0),
                    "gordura_saturada": float(s.get("saturated_fat", 0) or 0),
                    "fibra": float(s.get("fiber", 0) or 0),
                    "acucar": float(s.get("sugar", 0) or 0),
                    "sodio": float(s.get("sodium", 0) or 0),
                }
                for s in servings
            ],
            "porcao_padrao": {
                "serving_id": serving_default.get("serving_id"),
                "descricao": serving_default.get("serving_description"),
                "quantidade_metrica": float(serving_default.get("metric_serving_amount", 0) or 0),
                "unidade_metrica": serving_default.get("metric_serving_unit", "g"),
                "calorias": float(serving_default.get("calories", 0) or 0),
                "carboidratos": float(serving_default.get("carbohydrate", 0) or 0),
                "proteinas": float(serving_default.get("protein", 0) or 0),
                "gorduras": float(serving_default.get("fat", 0) or 0),
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
