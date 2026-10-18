from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.perfil_nutri import PerfilNutri
from app.repositories.historico_progresso_repo import HistoricoProgressoRepository
from app.repositories.perfil_nutri_repo import PerfilNutriRepository
from app.schemas.perfil_nutri import PerfilNutriCreate, PerfilNutriUpdate
from app.services.nutricao_service import NutricaoService

# Valores semânticos do cadastro incompleto. Ficar nomeado importa aqui porque o
# cálculo da TMB precisa de date, não de string: o fallback anterior era
# "2000-01-01" e quebrava no primeiro .year.
NASCIMENTO_DO_SEED = date(1998, 8, 15)
NASCIMENTO_SEM_DATA_INFORMADA = date(2000, 1, 1)
GENERO_SEM_QUIZ = "masculino"


class PerfilNutriService:
    def __init__(self, db: Session):
        self.repo = PerfilNutriRepository(db)

    def medidas_recentes(self, id_usuario: UUID | str) -> tuple[float, float]:
        """
        Peso e altura do último registro de progresso. Sem isso a TMB sairia do
        padrão de 70 kg / 170 cm da assinatura, que não é a pessoa cadastrada.
        """
        ultimo = HistoricoProgressoRepository(self.repo.db).get_by_usuario(id_usuario, 0, 1)
        if ultimo and ultimo[0].peso_atual and ultimo[0].altura_atual:
            return float(ultimo[0].peso_atual), float(ultimo[0].altura_atual)
        return NutricaoService.PESO_PADRAO_KG, NutricaoService.ALTURA_PADRAO_CM

    def calcular_tmb(self, id_usuario: UUID | str, data_nascimento: date, genero: str) -> float:
        peso, altura = self.medidas_recentes(id_usuario)
        return NutricaoService.calcular_tmb(data_nascimento, genero, peso_kg=peso, altura_cm=altura)

    def buscar_por_usuario(self, id_usuario: UUID | str) -> PerfilNutri:
        perfil = self.repo.get_by_usuario(id_usuario)
        if not perfil:
            import uuid
            perfil = PerfilNutri(
                id_perfil=str(uuid.uuid4()),
                id_usuario=str(id_usuario),
                data_nascimento=NASCIMENTO_DO_SEED,
                genero=GENERO_SEM_QUIZ,
                objetivo_nutricional="manter_peso",
                nivel_atividade="moderado",
                tmb_calculo=self.calcular_tmb(id_usuario, NASCIMENTO_DO_SEED, GENERO_SEM_QUIZ),
            )
            self.repo.db.add(perfil)
            self.repo.db.commit()
            self.repo.db.refresh(perfil)
        return perfil

    def criar(self, dados: PerfilNutriCreate) -> PerfilNutri:
        if self.repo.get_by_usuario(dados.id_usuario):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Perfil nutricional já existe para este usuário")
        obj_data = dados.model_dump()
        # O quiz já calcula a TMB com o peso informado e manda no corpo. Só
        # calcula aqui quando ele não mandou: antes isto era sobrescrito.
        obj_data["tmb_calculo"] = obj_data.get("tmb_calculo") or self.calcular_tmb(
            dados.id_usuario, dados.data_nascimento, dados.genero
        )
        return self.repo.create(obj_data)

    def atualizar(self, id_usuario: UUID | str, dados: PerfilNutriUpdate) -> PerfilNutri:
        perfil = self.repo.get_by_usuario(id_usuario)
        if not perfil:
            obj_data = dados.model_dump(exclude_unset=True)
            obj_data["id_usuario"] = id_usuario
            obj_data.setdefault("data_nascimento", NASCIMENTO_SEM_DATA_INFORMADA)
            obj_data.setdefault("genero", GENERO_SEM_QUIZ)
            obj_data.setdefault("nivel_atividade", "moderado")
            obj_data.setdefault("objetivo_nutricional", "manter_peso")
            if not obj_data.get("tmb_calculo"):
                obj_data["tmb_calculo"] = self.calcular_tmb(
                    id_usuario, obj_data["data_nascimento"], obj_data["genero"]
                )
            return self.repo.create(obj_data)

        alteracoes = dados.model_dump(exclude_unset=True)
        # TMB é derivada de nascimento, gênero e medidas. Se alguma entrada mudou
        # e o cliente não mandou valor explícito, recalcula: sem isso o número do
        # seed ficava gravado para sempre, mesmo depois de corrigir o perfil.
        if {"data_nascimento", "genero"} & set(alteracoes) and not alteracoes.get("tmb_calculo"):
            nascimento = alteracoes.get("data_nascimento", perfil.data_nascimento)
            genero = alteracoes.get("genero", perfil.genero)
            alteracoes["tmb_calculo"] = self.calcular_tmb(id_usuario, nascimento, genero)
        return self.repo.update(perfil, alteracoes)

    def deletar(self, id_usuario: UUID | str) -> None:
        perfil = self.buscar_por_usuario(id_usuario)
        self.repo.delete(perfil)
