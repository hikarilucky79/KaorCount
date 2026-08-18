from datetime import date
from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.relatorio_service import RelatorioService

router = APIRouter(prefix="/relatorios", tags=["Relatórios de Progresso"])


@router.get(
    "/usuario/{id_usuario}/pdf",
    summary="Exporta relatório de progresso em PDF",
    description=(
        "Gera um relatório consolidado do período informado contendo: "
        "meta nutricional atual, resumo agregado (total e média de calorias/água), "
        "consumo diário de calorias e macronutrientes, ingestão de água por dia "
        "e evolução de peso. Retorna um arquivo PDF para download."
    ),
)
def exportar_pdf(
    id_usuario: UUID,
    data_inicio: date = Query(..., description="Data inicial do relatório"),
    data_fim: date = Query(..., description="Data final do relatório"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    if str(usuario.id_usuario) != str(id_usuario):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: você só pode acessar seus próprios relatórios",
        )
    service = RelatorioService(db)
    pdf_bytes = service.gerar_relatorio_pdf(
        id_usuario=id_usuario,
        nome_usuario=usuario.nome,
        data_inicio=data_inicio,
        data_fim=data_fim,
    )
    nome_arquivo = f"relatorio_kaorcount_{data_inicio.isoformat()}_{data_fim.isoformat()}.pdf"
    headers = {"Content-Disposition": f'attachment; filename="{nome_arquivo}"'}
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers=headers,
    )


@router.get(
    "/usuario/{id_usuario}/dados",
    summary="Dados do relatório em JSON",
    description=(
        "Retorna os mesmos dados do relatório de progresso em formato JSON, "
        "sem gerar o PDF. Útil para o frontend montar visualizações próprias."
    ),
)
def dados_relatorio(
    id_usuario: UUID,
    data_inicio: date = Query(..., description="Data inicial"),
    data_fim: date = Query(..., description="Data final"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    if str(usuario.id_usuario) != str(id_usuario):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: você só pode acessar seus próprios relatórios",
        )
    service = RelatorioService(db)
    return service.gerar_dados_relatorio(id_usuario, data_inicio, data_fim)
