from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.security import verificar_senha
from app.models.usuario import Usuario
from app.repositories.usuario_repo import UsuarioRepository
from app.repositories.perfil_nutri_repo import PerfilNutriRepository
from app.repositories.meta_nutri_repo import MetaNutriRepository
from app.services.nutricao_service import NutricaoService
from app.schemas.perfil_nutri import PerfilNutriCreate, PerfilNutriUpdate
from app.schemas.meta_nutri import MetaNutriCreate, MetaNutriUpdate
from app.models.perfil_nutri import PerfilNutri
from app.models.meta_nutri import MetaNutri

from fastapi import HTTPException, status


class PerfilNutriService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PerfilNutriRepository(db)
        self.usuario_repo = UsuarioRepository(db)
        self.meta_repo = MetaNutriRepository(db)

    def buscar_por_usuario(self, id_usuario: UUID | str) -> PerfilNutri:
        perfil = self.repo.get_by_usuario(id_usuario)
        if not perfil:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil nutricional não encontrado",
            )
        return perfil

    def criar(self, dados: PerfilNutriCreate) -> PerfilNutri:
        if self.repo.get_by_usuario(dados.id_usuario):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Perfil nutricional já existe para este usuário",
            )
        tmb = NutricaoService.calcular_tmb(dados.data_nascimento, dados.genero, peso_kg=70.0)
        obj_data = dados.model_dump()
        obj_data["tmb_calculo"] = tmb
        return self.repo.create(obj_data)

    def atualizar(self, id_usuario: UUID | str, dados: PerfilNutriUpdate) -> PerfilNutri:
        perfil = self.buscar_por_usuario(id_usuario)
        return self.repo.update(perfil, dados.model_dump(exclude_unset=True))

    def deletar(self, id_usuario: UUID | str) -> None:
        perfil = self.buscar_por_usuario(id_usuario)
        self.repo.delete(perfil)
