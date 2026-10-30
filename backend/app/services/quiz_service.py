from app.models.historico_progresso import HistoricoProgresso
from app.models.pesquisa_inicial import PesquisaInicial
from app.schemas.meta_nutri import MetaNutriCreate
from app.schemas.perfil_nutri import PerfilNutriUpdate
from app.services.meta_nutri_service import MetaNutriService
from app.services.perfil_nutri_service import PerfilNutriService


class QuizService:
    def __init__(self, db):
        self.db = db

    def salvar(self, id_usuario, dados):
        """A rota mantém todos os commits abaixo na mesma transação."""
        id_usuario = str(id_usuario)
        self.db.add(HistoricoProgresso(
            id_usuario=id_usuario, data_registro=dados.data_registro,
            peso_atual=dados.peso_atual, altura_atual=dados.altura_atual,
        ))
        self.db.flush()
        PerfilNutriService(self.db).atualizar(id_usuario, PerfilNutriUpdate(
            data_nascimento=dados.data_nascimento, genero=dados.genero,
            objetivo_nutricional=dados.objetivo_nutricional,
            nivel_atividade=dados.nivel_atividade, tmb_calculo=dados.tmb_calculo,
        ))
        pesquisa = self.db.query(PesquisaInicial).filter(PesquisaInicial.id_usuario == id_usuario).first()
        if pesquisa is None:
            pesquisa = PesquisaInicial(id_usuario=id_usuario)
            self.db.add(pesquisa)
        pesquisa.origem_app = dados.origem_app
        pesquisa.ja_contou_calorias = dados.ja_contou_calorias
        pesquisa.peso_objetivo_kg = dados.peso_objetivo_kg
        MetaNutriService(self.db).criar(MetaNutriCreate(
            id_usuario=id_usuario, data_inicio=dados.data_registro,
            calorias_diarias=dados.calorias_diarias, proteina_g=dados.proteina_g,
            carboidrato_g=dados.carboidrato_g, gordura_g=dados.gordura_g,
        ))
        self.db.commit()
