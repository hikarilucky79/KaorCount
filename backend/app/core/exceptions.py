from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError, OperationalError, DataError


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "erro": True,
            "status": exc.status_code,
            "detail": exc.detail,
            "path": str(request.url.path),
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    erros = []
    for erro in exc.errors():
        campo = " -> ".join(str(loc) for loc in erro.get("loc", []))
        erros.append({
            "campo": campo,
            "mensagem": erro.get("msg", ""),
            "tipo": erro.get("type", ""),
        })
    return JSONResponse(
        status_code=422,
        content={
            "erro": True,
            "status": 422,
            "detail": "Erro de validação",
            "erros": erros,
            "path": str(request.url.path),
        },
    )


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "erro": True,
            "status": 409,
            "detail": "Violação de integridade de dados",
            "path": str(request.url.path),
        },
    )


async def data_error_handler(request: Request, exc: DataError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={
            "erro": True,
            "status": 400,
            "detail": "Dados inválidos para o banco de dados",
            "path": str(request.url.path),
        },
    )


async def operational_error_handler(request: Request, exc: OperationalError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={
            "erro": True,
            "status": 503,
            "detail": "Serviço indisponível: erro de conexão com o banco de dados",
            "path": str(request.url.path),
        },
    )
