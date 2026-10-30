"""Idempotência de escrita, com a resposta e os efeitos na mesma transação.

As dependências (autenticação e limites) executam antes de consultar o recibo.
Uma inserção pela chave primária serializa tentativas simultâneas no banco.
Clientes antigos continuam aceitos sem chave; as escritas ainda são atômicas.
"""
import base64
from functools import wraps
import hashlib
import hmac
import inspect
import json
import re

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.routing import APIRoute, serialize_response
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.models.operacao_idempotente import OperacaoIdempotente


def _hash(valor):
    return hmac.new(settings.SECRET_KEY.encode(), valor.encode(), hashlib.sha256).hexdigest()


def _reservar(db, identificador, assinatura):
    registro = OperacaoIdempotente(id_operacao=identificador, assinatura=assinatura)
    db.add(registro)
    try:
        db.flush()
        return registro, False
    except IntegrityError:
        db.rollback()
        registro = db.get(OperacaoIdempotente, identificador)
        if registro is None:
            raise
        if not hmac.compare_digest(registro.assinatura, assinatura):
            raise HTTPException(409, "Idempotency-Key já utilizada com outros dados.")
        if registro.status_http is None:
            raise HTTPException(409, "Operação em andamento. Repita com a mesma chave.", headers={"Retry-After": "1"})
        return registro, True


class RotaIdempotente(APIRoute):
    def __init__(self, path, endpoint, **kwargs):
        # Login sempre autentica novamente e emite um token novo.
        escrita = set(kwargs.get("methods") or []) & {"POST", "PUT", "PATCH", "DELETE"}
        if not escrita or path.rstrip("/").endswith("/auth/login") or getattr(endpoint, "_idempotente", False):
            super().__init__(path, endpoint, **kwargs)
            return

        assinatura_endpoint = inspect.signature(endpoint)
        nome_request = next((p.name for p in assinatura_endpoint.parameters.values() if p.annotation is Request), None)

        @wraps(endpoint)
        async def executar(**valores):
            request = valores.pop("request_idempotencia") if nome_request is None else valores[nome_request]
            db = valores["db"]
            chave = request.headers.get("Idempotency-Key")
            if chave and not re.fullmatch(r"[A-Za-z0-9._:-]{8,128}", chave):
                raise HTTPException(400, "Idempotency-Key deve ter entre 8 e 128 caracteres: letras, números, ponto, hífen, dois-pontos ou sublinhado.")
            registro = None
            try:
                if chave:
                    usuario = valores.get("usuario")
                    corpo = await request.body()
                    try:
                        conteudo = json.loads(corpo) if corpo else None
                    except ValueError:
                        conteudo = corpo.decode("utf-8")
                    if usuario is not None:
                        escopo = str(usuario.id_usuario)
                    else:
                        # Somente cadastro público possui escrita sem usuário.
                        dados = conteudo.get("cadastro", conteudo) if isinstance(conteudo, dict) else {}
                        escopo = "cadastro:" + str(dados.get("email", "")).strip().casefold()
                    identidade = json.dumps([escopo, request.method, request.url.path, chave])
                    assinatura = _hash(json.dumps([request.method, request.url.path, sorted(request.query_params.multi_items()), conteudo], sort_keys=True, ensure_ascii=False))
                    registro, repetida = await run_in_threadpool(_reservar, db, _hash(identidade), assinatura)
                    if repetida:
                        return Response(
                            base64.b64decode(registro.resposta), status_code=registro.status_http,
                            headers={**json.loads(registro.cabecalhos), "Idempotency-Replayed": "true"},
                        )
                db.info["idempotencia"] = True
                transacao = db.get_transaction() or db.begin()
                resultado = await endpoint(**valores) if inspect.iscoroutinefunction(endpoint) else await run_in_threadpool(endpoint, **valores)
                if isinstance(resultado, Response):
                    resposta = resultado
                else:
                    conteudo = await serialize_response(
                        field=self.response_field, response_content=resultado,
                        include=self.response_model_include, exclude=self.response_model_exclude,
                        by_alias=self.response_model_by_alias, exclude_unset=self.response_model_exclude_unset,
                        exclude_defaults=self.response_model_exclude_defaults, exclude_none=self.response_model_exclude_none,
                        is_coroutine=True,
                    )
                    status_http = self.status_code or 200
                    resposta = Response(status_code=status_http) if status_http == 204 else JSONResponse(conteudo, status_code=status_http)
                if not 200 <= resposta.status_code < 300:
                    await run_in_threadpool(db.rollback)
                    return resposta
                if db.get_transaction() is not transacao:
                    raise HTTPException(503, "A transação foi interrompida. Repita com a mesma Idempotency-Key.")
                if registro is not None:
                    registro.status_http = resposta.status_code
                    registro.resposta = base64.b64encode(resposta.body).decode("ascii")
                    registro.cabecalhos = json.dumps({k: v for k, v in resposta.headers.items() if k.lower() in {"content-type", "location"}})
                # Ignora apenas o override commit->flush da SessionTransacional.
                await run_in_threadpool(Session.commit, db)
                if chave:
                    resposta.headers["Idempotency-Replayed"] = "false"
                return resposta
            except BaseException:
                await run_in_threadpool(db.rollback)
                raise
            finally:
                db.info.pop("idempotencia", None)

        if nome_request is None:
            executar.__signature__ = assinatura_endpoint.replace(parameters=[
                *assinatura_endpoint.parameters.values(),
                inspect.Parameter("request_idempotencia", inspect.Parameter.KEYWORD_ONLY, annotation=Request),
            ])
        executar._idempotente = True
        super().__init__(path, executar, **kwargs)


class RouterIdempotente(APIRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, route_class=RotaIdempotente, **kwargs)
