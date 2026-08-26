from datetime import date


class NutricaoService:

    FATOR_ATIVIDADE = {"sedentario": 1.2, "leve": 1.375, "moderado": 1.55, "ativo": 1.725, "muito_ativo": 1.9}
    OBJETIVO_CALORIAS = {"perder_peso": 0.8, "manter_peso": 1.0, "ganhar_peso": 1.15, "ganhar_massa": 1.2}
    MACROS_POR_OBJETIVO = {
        "ganhar_massa": (0.50, 0.30, 0.20),
        "perder_peso": (0.35, 0.40, 0.25),
    }
    MACROS_PADRAO = (0.45, 0.30, 0.25)

    @staticmethod
    def calcular_tmb(data_nascimento: date, genero: str, peso_kg: float = 70.0, altura_cm: float = 170.0) -> float:
        hoje = date.today()
        idade = hoje.year - data_nascimento.year - (
            (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day)
        )
        base = 10 * peso_kg + 6.25 * altura_cm - 5 * idade
        ajuste = 5 if genero.lower() in ("masculino", "m") else (-161 if genero.lower() in ("feminino", "f") else 0)
        return base + ajuste

    @staticmethod
    def calcular_calorias_diarias(tmb: float, nivel_atividade: str = "sedentario", objetivo: str = "manter_peso") -> float:
        fator = NutricaoService.FATOR_ATIVIDADE.get(nivel_atividade.lower(), 1.2)
        ajuste = NutricaoService.OBJETIVO_CALORIAS.get(objetivo.lower(), 1.0)
        return round(tmb * fator * ajuste)

    @staticmethod
    def calcular_macros(calorias_diarias: float, objetivo: str = "manter_peso") -> dict:
        pct_carb, pct_prot, pct_gord = NutricaoService.MACROS_POR_OBJETIVO.get(
            objetivo.lower(), NutricaoService.MACROS_PADRAO
        )
        return {
            "calorias_diarias": round(calorias_diarias),
            "carboidrato_g": round(calorias_diarias * pct_carb / 4),
            "proteina_g": round(calorias_diarias * pct_prot / 4),
            "gordura_g": round(calorias_diarias * pct_gord / 9),
        }

    @staticmethod
    def calcular_macros_item(
        calorias_porcao: float, carb_porcao: float, prot_porcao: float,
        gord_porcao: float, porcao_padrao_g: float, quantidade_g: float,
    ) -> dict:
        fator = quantidade_g / porcao_padrao_g
        return {
            "calorias": round(calorias_porcao * fator, 2),
            "carboidratos": round(carb_porcao * fator, 2),
            "proteinas": round(prot_porcao * fator, 2),
            "gorduras": round(gord_porcao * fator, 2),
        }
