from typing import Generic, Type, TypeVar
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get(self, id_field: str, id_value: UUID | str) -> ModelType | None:
        return self.db.query(self.model).filter(getattr(self.model, id_field) == str(id_value)).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, obj_data: dict) -> ModelType:
        clean_data = {k: str(v) if isinstance(v, UUID) else v for k, v in obj_data.items()}
        db_obj = self.model(**clean_data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: ModelType, obj_data: dict) -> ModelType:
        for field, value in obj_data.items():
            if value is not None:
                val = str(value) if isinstance(value, UUID) else value
                setattr(db_obj, field, val)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: ModelType) -> None:
        self.db.delete(db_obj)
        self.db.commit()
