from uuid import UUID
from sqlalchemy.orm import Session

from app.models.meta_nutri import MetaNutri
from app.repositories.meta_nutri_repo import MetaNutriRepository
from app.services.base_service import BaseService
from app.schemas.meta_nutri import MetaNutriCreate
from fastapi import HTTPException, status


class MetaNutriService(BaseService):
    nao_encontrado_msg = "Meta nutricional não encontrada"

    def __init__(self, db: Session):
        super().__init__(MetaNutriRepository(db))

    def criar(self, dados: MetaNutriCreate) -> MetaNutri:
        # Upsert: para um mesmo usuário/dia não pode existir mais de uma meta.
        # Sem esse comportamento, cada edição de perfil criava uma nova linha com
        # data_inicio = hoje, e a consulta da "meta atual" retornava uma linha
        # antiga arbitrariamente — fazendo o valor (ex: kcal) não acompanhar o perfil.
        existente = self.repo.get_by_usuario_dia(dados.id_usuario, dados.data_inicio)
        if existente:
            return self.repo.update(existente, dados.model_dump(exclude={"id_usuario"}))
        return self.repo.create(dados.model_dump())

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
