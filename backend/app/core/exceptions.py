from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError, OperationalError, DataError


# [F086] Padroniza o formato JSON das respostas de erro da API.
def _error_response(request: Request, status_code: int, detail: str, headers: dict | None = None, **extra) -> JSONResponse:
    content = {"erro": True, "status": status_code, "detail": detail, "path": str(request.url.path)}
    content.update(extra)
    return JSONResponse(status_code=status_code, content=content, headers=headers)


# [F087] Converte erros HTTP em respostas no formato padrão da API.
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    # Sem repassar exc.headers, um 429 com Retry-After chegava ao cliente sem a
    # informação de quando tentar de novo — justamente o que o cliente precisa.
    return _error_response(request, exc.status_code, exc.detail, headers=dict(exc.headers or {}))


# [F088] Converte erros de validação de entrada em respostas compreensíveis.
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    erros = [
        {"campo": " -> ".join(str(loc) for loc in e.get("loc", [])), "mensagem": e.get("msg", ""), "tipo": e.get("type", "")}
        for e in exc.errors()
    ]
    return _error_response(request, 422, "Erro de validação", erros=erros)


# [F089] Converte violações de integridade do banco em respostas de erro.
async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    return _error_response(request, 409, "Violação de integridade de dados")


# [F090] Converte erros de dados do banco em respostas de erro.
async def data_error_handler(request: Request, exc: DataError) -> JSONResponse:
    return _error_response(request, 400, "Dados inválidos para o banco de dados")


# [F091] Trata falhas operacionais na comunicação com o banco.
async def operational_error_handler(request: Request, exc: OperationalError) -> JSONResponse:
    return _error_response(request, 503, "Serviço indisponível: erro de conexão com o banco de dados")
