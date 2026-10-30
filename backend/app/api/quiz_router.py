from uuid import UUID
from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.idempotencia import RouterIdempotente
from app.core.security import get_usuario_atual, garantir_proprio_usuario
from app.models.usuario import Usuario
from app.schemas.quiz import QuizDados
from app.services.quiz_service import QuizService

router = RouterIdempotente(prefix="/quiz", tags=["Quiz"])


@router.put("/{id_usuario}", status_code=204)
def salvar_quiz(
    id_usuario: UUID,
    dados: QuizDados,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    garantir_proprio_usuario(usuario, id_usuario)
    QuizService(db).salvar(id_usuario, dados)
