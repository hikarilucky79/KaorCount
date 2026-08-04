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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil nutricional não encontrado")
        return perfil

    def criar(self, dados: PerfilNutriCreate) -> PerfilNutri:
        if self.repo.get_by_usuario(dados.id_usuario):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Perfil nutricional já existe para este usuário")
        obj_data = dados.model_dump()
        obj_data["tmb_calculo"] = NutricaoService.calcular_tmb(dados.data_nascimento, dados.genero, peso_kg=70.0)
        return self.repo.create(obj_data)

    def atualizar(self, id_usuario: UUID | str, dados: PerfilNutriUpdate) -> PerfilNutri:
        perfil = self.buscar_por_usuario(id_usuario)
        return self.repo.update(perfil, dados.model_dump(exclude_unset=True))

    def deletar(self, id_usuario: UUID | str) -> None:
        perfil = self.buscar_por_usuario(id_usuario)
        self.repo.delete(perfil)
