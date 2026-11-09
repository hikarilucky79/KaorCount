import os
from datetime import datetime, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory

import pytest

# A aplicação cria tabelas no import: nunca apontar a coleta de testes ao banco real.
_banco_importacao = TemporaryDirectory(prefix="kaorcount-test-senha-")
os.environ["DATABASE_URL"] = "sqlite:///" + (Path(_banco_importacao.name) / "import.db").as_posix()
os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "chave-apenas-para-testes-kaorcount-123456"

import httpx
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.config import settings
from app.core.database import Base, get_db, engine as engine_importacao, SessionTransacional
from app.models.recuperacao_senha import RecuperacaoSenha
from app.models.usuario import Usuario
from app.services import email_service

API = "/api/v1/auth"
SENHA_ANTIGA = "Xk#9vLm!2pQz"
SENHA_NOVA = "Tr0ub4dor&3xYz"
EMAIL = "maria@example.com"


@pytest.fixture(scope="module", autouse=True)
def limpar_banco_importacao():
    yield
    engine_importacao.dispose()
    _banco_importacao.cleanup()


@pytest.fixture
def sessao():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    fabrica = sessionmaker(bind=engine, class_=SessionTransacional)
    yield fabrica
    engine.dispose()


@pytest.fixture
def client(sessao, monkeypatch):
    def banco_teste():
        with sessao() as db:
            yield db

    monkeypatch.setattr(settings, "EXIGIR_VERIFICACAO_EMAIL", False)
    monkeypatch.setattr(settings, "LIMITE_REGISTROS_POR_IP", 1000)
    monkeypatch.setattr(settings, "LIMITE_CADASTROS_POR_DIA", 1000)
    monkeypatch.setattr(settings, "LIMITE_CODIGOS_POR_IP", 1000)
    monkeypatch.setattr(settings, "LIMITE_CONFIRMACOES_POR_IP", 1000)
    monkeypatch.setattr(settings, "LIMITE_LOGINS_POR_IP", 1000)
    monkeypatch.setattr(settings, "CODIGO_EMAIL_REENVIO_SEGUNDOS", 0)
    anteriores = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = banco_teste
    try:
        with TestClient(app) as cliente:
            yield cliente
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(anteriores)


@pytest.fixture
def emails(monkeypatch):
    """Intercepta o envio e guarda o último código gerado por endereço."""
    enviados = {}
    monkeypatch.setattr(
        "app.services.recuperacao_senha_service.enviar_codigo_recuperacao_senha",
        lambda destino, codigo: enviados.__setitem__(destino, codigo),
    )
    return enviados


@pytest.fixture
def conta(client):
    resposta = client.post(
        f"{API}/registrar", json={"nome": "Maria Souza", "email": EMAIL, "senha": SENHA_ANTIGA}
    )
    assert resposta.status_code == 201, resposta.text
    return EMAIL


def esqueci(client, email):
    return client.post(f"{API}/senha/esqueci", json={"email": email})


def redefinir(client, email, codigo, nova_senha=SENHA_NOVA):
    return client.post(f"{API}/senha/redefinir", json={"email": email, "codigo": codigo, "nova_senha": nova_senha})


def login(client, email, senha):
    return client.post(f"{API}/login", json={"email": email, "senha": senha})


def errado(certo):
    return "000000" if certo != "000000" else "111111"


# ── Fluxo ──────────────────────────────────────────────────────────────

def test_fluxo_completo_troca_a_senha(client, emails, conta):
    assert esqueci(client, conta).status_code == 204
    assert redefinir(client, conta, emails[conta]).status_code == 204
    assert login(client, conta, SENHA_NOVA).status_code == 200
    assert login(client, conta, SENHA_ANTIGA).status_code == 401


def test_email_e_tratado_sem_diferenca_de_maiusculas(client, emails, conta):
    assert esqueci(client, "  MARIA@Example.com ").status_code == 204
    assert conta in emails
    assert redefinir(client, "MARIA@example.com", emails[conta]).status_code == 204


def test_email_sem_conta_responde_igual_e_nao_envia_nada(client, emails, conta):
    existente = esqueci(client, conta)
    inexistente = esqueci(client, "ninguem@example.com")
    assert inexistente.status_code == existente.status_code == 204
    assert inexistente.content == existente.content
    assert "ninguem@example.com" not in emails


def test_redefinir_sem_ter_pedido_codigo_e_recusado(client, emails, conta):
    assert redefinir(client, conta, "123456").status_code == 400
    assert login(client, conta, SENHA_ANTIGA).status_code == 200


def test_conta_inativa_nao_recebe_codigo(client, emails, conta, sessao):
    with sessao() as db:
        db.query(Usuario).filter(Usuario.email == conta).update({Usuario.status_conta: "inativo"})
        db.commit()
    assert esqueci(client, conta).status_code == 204
    assert conta not in emails


# ── Código ─────────────────────────────────────────────────────────────

def test_codigo_errado_e_recusado_e_o_correto_ainda_funciona(client, emails, conta):
    esqueci(client, conta)
    certo = emails[conta]
    assert redefinir(client, conta, errado(certo)).status_code == 400
    assert login(client, conta, SENHA_ANTIGA).status_code == 200
    assert redefinir(client, conta, certo).status_code == 204


def test_tentativas_esgotadas_travam_ate_pedir_novo_codigo(client, emails, conta):
    esqueci(client, conta)
    certo = emails[conta]
    for _ in range(settings.CODIGO_EMAIL_MAX_TENTATIVAS):
        assert redefinir(client, conta, errado(certo)).status_code == 400
    travado = redefinir(client, conta, certo)
    assert travado.status_code == 400
    assert "novo código" in travado.json()["detail"]
    esqueci(client, conta)
    assert redefinir(client, conta, emails[conta]).status_code == 204


def test_codigo_e_de_uso_unico(client, emails, conta):
    esqueci(client, conta)
    codigo = emails[conta]
    assert redefinir(client, conta, codigo).status_code == 204
    assert redefinir(client, conta, codigo, "Outra#Senha77x").status_code == 400
    assert login(client, conta, SENHA_NOVA).status_code == 200


def test_codigo_expirado_e_recusado(client, emails, conta, sessao):
    esqueci(client, conta)
    with sessao() as db:
        db.get(RecuperacaoSenha, conta).expira_em = datetime.utcnow() - timedelta(minutes=1)
        db.commit()
    assert redefinir(client, conta, emails[conta]).status_code == 400
    assert login(client, conta, SENHA_ANTIGA).status_code == 200


def test_codigo_nao_e_guardado_em_claro(client, emails, conta, sessao):
    esqueci(client, conta)
    with sessao() as db:
        linha = db.get(RecuperacaoSenha, conta)
        assert emails[conta] not in linha.codigo_hash
        assert len(linha.codigo_hash) == 64


def test_formato_do_codigo_e_validado(client, emails, conta):
    esqueci(client, conta)
    assert redefinir(client, conta, "12ab56").status_code == 422
    assert redefinir(client, conta, "12345").status_code == 422



# ── Senha nova ─────────────────────────────────────────────────────────

def test_senha_fraca_e_recusada_antes_de_gastar_o_codigo(client, emails, conta, sessao):
    esqueci(client, conta)
    assert redefinir(client, conta, emails[conta], "abc12345").status_code == 422
    with sessao() as db:
        assert db.get(RecuperacaoSenha, conta).tentativas == 0


def test_senha_com_o_nome_da_conta_e_recusada_e_o_codigo_continua_valendo(client, emails, conta):
    esqueci(client, conta)
    codigo = emails[conta]
    assert redefinir(client, conta, codigo, "Souza#98765!").status_code == 422
    assert login(client, conta, SENHA_ANTIGA).status_code == 200
    assert redefinir(client, conta, codigo).status_code == 204


def test_nome_da_conta_nao_vaza_a_quem_nao_tem_o_codigo(client, emails, conta):
    esqueci(client, conta)
    resposta = redefinir(client, conta, errado(emails[conta]), "Souza#98765!")
    assert resposta.status_code == 400


# ── Limites ────────────────────────────────────────────────────────────

def test_reenvio_respeita_o_intervalo(client, emails, conta, monkeypatch):
    monkeypatch.setattr(settings, "CODIGO_EMAIL_REENVIO_SEGUNDOS", 60)
    assert esqueci(client, conta).status_code == 204
    segundo = esqueci(client, conta)
    assert segundo.status_code == 429
    assert int(segundo.headers["retry-after"]) > 0


def test_intervalo_de_reenvio_vale_tambem_para_email_sem_conta(client, emails, monkeypatch):
    # Se só e-mails reais fossem barrados, o 429 denunciaria quem tem cadastro.
    monkeypatch.setattr(settings, "CODIGO_EMAIL_REENVIO_SEGUNDOS", 60)
    assert esqueci(client, "ninguem@example.com").status_code == 204
    assert esqueci(client, "ninguem@example.com").status_code == 429


def test_limite_de_codigos_por_email(client, emails, conta):
    for _ in range(5):
        assert esqueci(client, conta).status_code == 204
    assert esqueci(client, conta).status_code == 429


# ── Falhas de envio ────────────────────────────────────────────────────

def test_falha_no_envio_nao_vaza_a_existencia_da_conta_e_descarta_o_codigo(client, conta, sessao, monkeypatch):
    def falhar(destino, codigo):
        raise HTTPException(503, "Resend fora do ar")

    monkeypatch.setattr("app.services.recuperacao_senha_service.enviar_codigo_recuperacao_senha", falhar)
    assert esqueci(client, conta).status_code == 204
    with sessao() as db:
        assert db.get(RecuperacaoSenha, conta) is None


def test_producao_sem_provedor_recusa_para_qualquer_email(client, conta, monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "RESEND_API_KEY", "")
    monkeypatch.setattr(settings, "SMTP_HOST", "")
    assert esqueci(client, conta).status_code == 503
    assert esqueci(client, "ninguem@example.com").status_code == 503


# ── Resend ─────────────────────────────────────────────────────────────

class RespostaFalsa:
    def __init__(self, status_code=200, texto='{"id":"abc"}'):
        self.status_code = status_code
        self.text = texto

    @property
    def is_error(self):
        return self.status_code >= 400

    def raise_for_status(self):
        raise httpx.HTTPStatusError("erro", request=httpx.Request("POST", email_service.RESEND_URL), response=self)


@pytest.fixture
def resend(monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_chave_de_teste")
    monkeypatch.setattr(settings, "RESEND_FROM", "KaorCount <nao-responda@kaorcount.com.br>")
    monkeypatch.setattr(settings, "SMTP_HOST", "")
    chamadas = []

    def post(url, **kwargs):
        chamadas.append((url, kwargs))
        return RespostaFalsa()

    monkeypatch.setattr(email_service.httpx, "post", post)
    return chamadas


def test_resend_recebe_o_payload_esperado(resend):
    email_service.enviar_codigo_recuperacao_senha("alguem@example.com", "123456")
    (url, kwargs), = resend
    assert url == "https://api.resend.com/emails"
    assert kwargs["headers"]["Authorization"] == "Bearer re_chave_de_teste"
    assert kwargs["timeout"] > 0
    corpo = kwargs["json"]
    assert corpo["from"] == "KaorCount <nao-responda@kaorcount.com.br>"
    assert corpo["to"] == ["alguem@example.com"]
    assert "123456" in corpo["subject"]
    assert "123456" in corpo["text"] and "123456" in corpo["html"]


def test_resend_tambem_envia_o_codigo_de_verificacao_de_cadastro(resend):
    email_service.enviar_codigo_verificacao("novo@example.com", "654321")
    (_, kwargs), = resend
    assert kwargs["json"]["to"] == ["novo@example.com"]
    assert "654321" in kwargs["json"]["html"]


def test_resend_tem_prioridade_sobre_o_smtp(resend, monkeypatch):
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(settings, "SMTP_FROM", "x@example.com")

    def smtp_nao_deve_ser_usado(*args, **kwargs):
        raise AssertionError("SMTP usado com o Resend configurado")

    monkeypatch.setattr(email_service, "_enviar_smtp", smtp_nao_deve_ser_usado)
    email_service.enviar_codigo_recuperacao_senha("alguem@example.com", "123456")
    assert len(resend) == 1


def test_erro_do_resend_vira_503_sem_expor_a_chave(monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_chave_de_teste")
    monkeypatch.setattr(settings, "RESEND_FROM", "KaorCount <nao-responda@kaorcount.com.br>")
    monkeypatch.setattr(
        email_service.httpx, "post", lambda *a, **k: RespostaFalsa(403, '{"message":"domain not verified"}')
    )
    with pytest.raises(HTTPException) as erro:
        email_service.enviar_codigo_recuperacao_senha("alguem@example.com", "123456")
    assert erro.value.status_code == 503
    assert "re_chave_de_teste" not in str(erro.value.detail)


def test_falha_de_rede_no_resend_vira_503(monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_chave_de_teste")
    monkeypatch.setattr(settings, "RESEND_FROM", "KaorCount <nao-responda@kaorcount.com.br>")

    def sem_rede(*args, **kwargs):
        raise httpx.ConnectTimeout("sem rede")

    monkeypatch.setattr(email_service.httpx, "post", sem_rede)
    with pytest.raises(HTTPException) as erro:
        email_service.enviar_codigo_verificacao("alguem@example.com", "123456")
    assert erro.value.status_code == 503


def test_resend_sem_remetente_conta_como_nao_configurado(monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_chave_de_teste")
    monkeypatch.setattr(settings, "RESEND_FROM", "")
    monkeypatch.setattr(settings, "SMTP_HOST", "")
    assert not email_service.email_configurado()
