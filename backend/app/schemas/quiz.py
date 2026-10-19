from datetime import date

from pydantic import BaseModel, Field
from app.schemas.pesquisa_inicial import PesquisaInicialUpsert
from app.schemas.usuario import UsuarioCreate


class QuizDados(PesquisaInicialUpsert):
    data_nascimento: date
    genero: str = Field(..., min_length=1, max_length=20)
    objetivo_nutricional: str = Field(..., min_length=1, max_length=50)
    nivel_atividade: str = Field(..., min_length=1, max_length=50)
    tmb_calculo: float = Field(..., gt=0, allow_inf_nan=False)
    data_registro: date
    peso_atual: float = Field(..., gt=0, allow_inf_nan=False)
    altura_atual: float = Field(..., gt=0, allow_inf_nan=False)
    calorias_diarias: float = Field(..., gt=0, allow_inf_nan=False)
    proteina_g: float = Field(..., gt=0, allow_inf_nan=False)
    carboidrato_g: float = Field(..., gt=0, allow_inf_nan=False)
    gordura_g: float = Field(..., gt=0, allow_inf_nan=False)


class CadastroComQuiz(BaseModel):
    cadastro: UsuarioCreate
    quiz: QuizDados
