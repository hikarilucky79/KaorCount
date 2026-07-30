from datetime import date


class NutricaoService:

    FATOR_ATIVIDADE = {
        "sedentario": 1.2,
        "leve": 1.375,
        "moderado": 1.55,
        "ativo": 1.725,
        "muito_ativo": 1.9,
    }

    OBJETIVO_CALORIAS = {
        "perder_peso": 0.8,
        "manter_peso": 1.0,
        "ganhar_peso": 1.15,
        "ganhar_massa": 1.2,
    }

    @staticmethod
    def calcular_tmb(data_nascimento: date, genero: str, peso_kg: float = 70.0, altura_cm: float = 170.0) -> float:
        hoje = date.today()
        idade = hoje.year - data_nascimento.year - (
            (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day)
        )

        if genero.lower() in ("masculino", "m"):
            return 10 * peso_kg + 6.25 * altura_cm - 5 * idade + 5
        elif genero.lower() in ("feminino", "f"):
            return 10 * peso_kg + 6.25 * altura_cm - 5 * idade - 161
        else:
            return 10 * peso_kg + 6.25 * altura_cm - 5 * idade

    @staticmethod
    def calcular_calorias_diarias(
        tmb: float,
        nivel_atividade: str = "sedentario",
        objetivo: str = "manter_peso",
    ) -> float:
        fator = NutricaoService.FATOR_ATIVIDADE.get(nivel_atividade.lower(), 1.2)
        ajuste = NutricaoService.OBJETIVO_CALORIAS.get(objetivo.lower(), 1.0)
        return round(tmb * fator * ajuste)

    @staticmethod
    def calcular_macros(calorias_diarias: float, objetivo: str = "manter_peso") -> dict:
        if objetivo.lower() == "ganhar_massa":
            pct_carb, pct_prot, pct_gord = 0.50, 0.30, 0.20
        elif objetivo.lower() == "perder_peso":
            pct_carb, pct_prot, pct_gord = 0.35, 0.40, 0.25
        else:
            pct_carb, pct_prot, pct_gord = 0.45, 0.30, 0.25

        kcal_carb = calorias_diarias * pct_carb
        kcal_prot = calorias_diarias * pct_prot
        kcal_gord = calorias_diarias * pct_gord

        return {
            "calorias_diarias": round(calorias_diarias),
            "carboidrato_g": round(kcal_carb / 4),
            "proteina_g": round(kcal_prot / 4),
            "gordura_g": round(kcal_gord / 9),
        }

    @staticmethod
    def calcular_macros_item(
        calorias_porcao: float,
        carb_porcao: float,
        prot_porcao: float,
        gord_porcao: float,
        porcao_padrao_g: float,
        quantidade_g: float,
    ) -> dict:
        fator = quantidade_g / porcao_padrao_g
        return {
            "calorias": round(calorias_porcao * fator, 2),
            "carboidratos": round(carb_porcao * fator, 2),
            "proteinas": round(prot_porcao * fator, 2),
            "gorduras": round(gord_porcao * fator, 2),
        }
