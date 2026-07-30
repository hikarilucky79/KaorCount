from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.meta_nutri_repo import MetaNutriRepository
from app.schemas.meta_nutri import MetaNutriCreate, MetaNutriUpdate
from app.models.meta_nutri import MetaNutri

from fastapi import HTTPException, status


class MetaNutriService:
    def __init__(self, db: Session):
        self.repo = MetaNutriRepository(db)

    def buscar_por_id(self, id_meta: UUID | str) -> MetaNutri:
        meta = self.repo.get_by_id(id_meta)
        if not meta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meta nutricional não encontrada",
            )
        return meta

    def listar_por_usuario(self, id_usuario: UUID | str) -> list[MetaNutri]:
        return self.repo.get_by_usuario(id_usuario)

    def meta_atual(self, id_usuario: UUID | str) -> MetaNutri:
        meta = self.repo.get_meta_atual(id_usuario)
        if not meta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nenhuma meta nutricional encontrada",
            )
        return meta

    def criar(self, dados: MetaNutriCreate) -> MetaNutri:
        return self.repo.create(dados.model_dump())

    def atualizar(self, id_meta: UUID | str, dados: MetaNutriUpdate) -> MetaNutri:
        meta = self.buscar_por_id(id_meta)
        return self.repo.update(meta, dados.model_dump(exclude_unset=True))

    def deletar(self, id_meta: UUID | str) -> None:
        meta = self.buscar_por_id(id_meta)
        self.repo.delete(meta)
