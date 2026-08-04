from uuid import UUID
from sqlalchemy.orm import Session

from app.models.meta_nutri import MetaNutri
from app.repositories.meta_nutri_repo import MetaNutriRepository
from app.services.base_service import BaseService
from fastapi import HTTPException, status


class MetaNutriService(BaseService):
    nao_encontrado_msg = "Meta nutricional não encontrada"

    def __init__(self, db: Session):
        super().__init__(MetaNutriRepository(db))

    def listar_por_usuario(self, id_usuario: UUID | str) -> list[MetaNutri]:
        return self.repo.get_by_usuario(id_usuario)

    def meta_atual(self, id_usuario: UUID | str) -> MetaNutri:
        meta = self.repo.get_meta_atual(id_usuario)
        if not meta:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma meta nutricional encontrada")
        return meta
