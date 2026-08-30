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
            from datetime import date
            import uuid
            meta = MetaNutri(
                id_meta=str(uuid.uuid4()),
                id_usuario=str(id_usuario),
                calorias_diarias=1800.0,
                proteina_g=140.0,
                carboidrato_g=180.0,
                gordura_g=55.0,
                data_inicio=date.today(),
            )
            self.repo.db.add(meta)
            self.repo.db.commit()
            self.repo.db.refresh(meta)
        return meta
