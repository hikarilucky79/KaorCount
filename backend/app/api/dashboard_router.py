from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/usuario/{id_usuario}",
    summary="Resumo diário do dashboard",
    description=(
        "Retorna o panorama nutricional do dia: macros consumidos vs meta, "
        "percentual de água consumida, total de refeições registradas e "
        "sequência de dias (streak) com registro de refeição."
    ),
)
def resumo_dia(
    id_usuario: UUID,
    data: date | None = Query(None, description="Data do resumo (padrão: hoje)"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = DashboardService(db)
    return service.resumo_dia(id_usuario, data)


@router.get(
    "/usuario/{id_usuario}/semana",
    summary="Resumo semanal do dashboard",
    description="Calorias consumidas por dia nos últimos 7 dias e total de água ingerido.",
)
def resumo_semana(
    id_usuario: UUID,
    data_fim: date | None = Query(None, description="Data final do intervalo (padrão: hoje)"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = DashboardService(db)
    return service.resumo_semana(id_usuario, data_fim)


@router.get(
    "/usuario/{id_usuario}/mes",
    summary="Resumo mensal do dashboard",
    description="Calorias consumidas por dia nos últimos 31 dias e total de água ingerido.",
)
def resumo_mes(
    id_usuario: UUID,
    data_fim: date | None = Query(None, description="Data final do intervalo (padrão: hoje)"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = DashboardService(db)
    return service.resumo_mes(id_usuario, data_fim)


@router.get(
    "/usuario/{id_usuario}/evolucao-peso",
    summary="Evolução de peso do usuário",
    description="Histórico de peso do usuário em ordem cronológica (padrão: últimos 30 registros).",
)
def evolucao_peso(
    id_usuario: UUID,
    limit: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = DashboardService(db)
    return service.evolucao_peso(id_usuario, limit)
