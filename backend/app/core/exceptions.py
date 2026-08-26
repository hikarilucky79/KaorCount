from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError, OperationalError, DataError


def _error_response(request: Request, status_code: int, detail: str, **extra) -> JSONResponse:
    content = {"erro": True, "status": status_code, "detail": detail, "path": str(request.url.path)}
    content.update(extra)
    return JSONResponse(status_code=status_code, content=content)


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return _error_response(request, exc.status_code, exc.detail)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    erros = [
        {"campo": " -> ".join(str(loc) for loc in e.get("loc", [])), "mensagem": e.get("msg", ""), "tipo": e.get("type", "")}
        for e in exc.errors()
    ]
    return _error_response(request, 422, "Erro de validação", erros=erros)


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    return _error_response(request, 409, "Violação de integridade de dados")


async def data_error_handler(request: Request, exc: DataError) -> JSONResponse:
    return _error_response(request, 400, "Dados inválidos para o banco de dados")


async def operational_error_handler(request: Request, exc: OperationalError) -> JSONResponse:
    return _error_response(request, 503, "Serviço indisponível: erro de conexão com o banco de dados")
