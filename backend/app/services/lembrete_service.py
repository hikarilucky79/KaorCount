import json
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.lembrete_config import LembreteConfig
from fastapi import HTTPException, status


class LembreteService:
    def __init__(self, db: Session):
        self.db = db

    def _get_config(self, id_usuario: UUID | str) -> LembreteConfig:
        config = self.db.query(LembreteConfig).filter(
            LembreteConfig.id_usuario == str(id_usuario)
        ).first()
        if not config:
            config = LembreteConfig(
                id_usuario=str(id_usuario),
                agua_intervalo_min=120,
                agua_meta_diaria_ml=2000,
                refeicao_horarios=json.dumps(["08:00", "12:00", "15:00", "19:00"]),
                ativo=True,
            )
            self.db.add(config)
            self.db.commit()
            self.db.refresh(config)
        return config

    def buscar(self, id_usuario: UUID | str) -> dict:
        config = self._get_config(id_usuario)
        return {
            "id_lembrete": config.id_lembrete,
            "id_usuario": config.id_usuario,
            "agua_intervalo_min": config.agua_intervalo_min,
            "agua_meta_diaria_ml": config.agua_meta_diaria_ml,
            "refeicao_horarios": json.loads(config.refeicao_horarios) if config.refeicao_horarios else [],
            "ativo": config.ativo,
        }

    def atualizar_agua(self, id_usuario: UUID | str, intervalo_min: int, meta_diaria_ml: float) -> dict:
        config = self._get_config(id_usuario)
        config.agua_intervalo_min = intervalo_min
        config.agua_meta_diaria_ml = meta_diaria_ml
        self.db.commit()
        return self.buscar(id_usuario)

    def atualizar_refeicao(self, id_usuario: UUID | str, horarios: list[str]) -> dict:
        config = self._get_config(id_usuario)
        config.refeicao_horarios = json.dumps(horarios)
        self.db.commit()
        return self.buscar(id_usuario)

    def ativar(self, id_usuario: UUID | str) -> dict:
        config = self._get_config(id_usuario)
        config.ativo = True
        self.db.commit()
        return self.buscar(id_usuario)

    def desativar(self, id_usuario: UUID | str) -> dict:
        config = self._get_config(id_usuario)
        config.ativo = False
        self.db.commit()
        return self.buscar(id_usuario)