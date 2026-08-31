from uuid import UUID
from sqlalchemy.orm import Session

from app.models.perfil_nutri import PerfilNutri
from app.repositories.perfil_nutri_repo import PerfilNutriRepository
from app.services.nutricao_service import NutricaoService
from app.schemas.perfil_nutri import PerfilNutriCreate, PerfilNutriUpdate
from fastapi import HTTPException, status


class PerfilNutriService:
    def __init__(self, db: Session):
        self.repo = PerfilNutriRepository(db)

    def buscar_por_usuario(self, id_usuario: UUID | str) -> PerfilNutri:
        perfil = self.repo.get_by_usuario(id_usuario)
        if not perfil:
            from datetime import date
            import uuid
            perfil = PerfilNutri(
                id_perfil=str(uuid.uuid4()),
                id_usuario=str(id_usuario),
                data_nascimento=date(1998, 8, 15),
                genero="masculino",
                objetivo_nutricional="manter_peso",
                nivel_atividade="moderado",
                tmb_calculo=1750.0,
            )
            self.repo.db.add(perfil)
            self.repo.db.commit()
            self.repo.db.refresh(perfil)
        return perfil

    def criar(self, dados: PerfilNutriCreate) -> PerfilNutri:
        if self.repo.get_by_usuario(dados.id_usuario):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Perfil nutricional já existe para este usuário")
        obj_data = dados.model_dump()
        obj_data["tmb_calculo"] = NutricaoService.calcular_tmb(dados.data_nascimento, dados.genero, peso_kg=70.0)
        return self.repo.create(obj_data)

    def atualizar(self, id_usuario: UUID | str, dados: PerfilNutriUpdate) -> PerfilNutri:
        perfil = self.repo.get_by_usuario(id_usuario)
        if not perfil:
            obj_data = dados.model_dump(exclude_unset=True)
            obj_data["id_usuario"] = id_usuario
            if "data_nascimento" not in obj_data:
                obj_data["data_nascimento"] = "2000-01-01"
            if "genero" not in obj_data:
                obj_data["genero"] = "masculino"
            if "peso_kg" not in obj_data:
                obj_data["peso_kg"] = 70.0
            if "altura_cm" not in obj_data:
                obj_data["altura_cm"] = 170.0
            if "nivel_atividade" not in obj_data:
                obj_data["nivel_atividade"] = "moderado"
            if "objetivo_nutricional" not in obj_data:
                obj_data["objetivo_nutricional"] = "manter_peso"
            obj_data["tmb_calculo"] = NutricaoService.calcular_tmb(obj_data["data_nascimento"], obj_data["genero"], peso_kg=obj_data.get("peso_kg", 70.0))
            return self.repo.create(obj_data)
        return self.repo.update(perfil, dados.model_dump(exclude_unset=True))

    def deletar(self, id_usuario: UUID | str) -> None:
        perfil = self.buscar_por_usuario(id_usuario)
        self.repo.delete(perfil)
