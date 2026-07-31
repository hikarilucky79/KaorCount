from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.lembrete_service import LembreteService

router = APIRouter(prefix="/lembretes", tags=["Lembretes e Notificações"])


@router.get("/config/{id_usuario}")
def buscar_config(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = LembreteService(db)
    return service.buscar(id_usuario)


@router.put("/config/{id_usuario}/agua")
def configurar_agua(
    id_usuario: UUID,
    intervalo_min: int = Query(..., ge=30, le=480),
    meta_diaria_ml: float = Query(..., ge=500, le=10000),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = LembreteService(db)
    return service.atualizar_agua(id_usuario, intervalo_min, meta_diaria_ml)


@router.put("/config/{id_usuario}/refeicoes")
def configurar_refeicoes(
    id_usuario: UUID,
    horarios: str = Query(..., description="Horários separados por vírgula, ex: 08:00,12:00,15:00,19:00"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    lista_horarios = [h.strip() for h in horarios.split(",") if h.strip()]
    service = LembreteService(db)
    return service.atualizar_refeicao(id_usuario, lista_horarios)


@router.post("/config/{id_usuario}/ativar")
def ativar(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = LembreteService(db)
    return service.ativar(id_usuario)


@router.post("/config/{id_usuario}/desativar")
def desativar(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = LembreteService(db)
    return service.desativar(id_usuario)