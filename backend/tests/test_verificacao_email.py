import os
from datetime import datetime, timedelta
from tempfile import TemporaryDirectory
from pathlib import Path

import pytest

# A aplicação cria tabelas no import: nunca apontar a coleta de testes ao banco real.
_banco_importacao = TemporaryDirectory(prefix="kaorcount-test-email-")
os.environ["DATABASE_URL"] = "sqlite:///" + (Path(_banco_importacao.name) / "import.db").as_posix()
os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "chave-apenas-para-testes-kaorcount-123456"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.config import settings
from app.core.database import Base, get_db, engine as engine_importacao, SessionTransacional
from app.core.senha import validar_forca_senha
from app.models.verificacao_email import VerificacaoEmail

API = "/api/v1/auth"
SENHA_FORTE = "Xk#9vLm!2pQz"


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

    monkeypatch.setattr(settings, "EXIGIR_VERIFICACAO_EMAIL", True)
    monkeypatch.setattr(settings, "LIMITE_REGISTROS_POR_IP", 1000)
    monkeypatch.setattr(settings, "LIMITE_CADASTROS_POR_DIA", 1000)
    monkeypatch.setattr(settings, "LIMITE_CODIGOS_POR_IP", 1000)
    monkeypatch.setattr(settings, "LIMITE_CONFIRMACOES_POR_IP", 1000)
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
        "app.services.verificacao_email_service.enviar_codigo_verificacao",
        lambda destino, codigo: enviados.__setitem__(destino, codigo),
    )
    return enviados


def pedir_codigo(client, email):
    return client.post(f"{API}/email/enviar-codigo", json={"email": email})


def confirmar(client, email, codigo):
    return client.post(f"{API}/email/confirmar", json={"email": email, "codigo": codigo})


def verificar(client, emails, email):
    assert pedir_codigo(client, email).status_code == 204
    resposta = confirmar(client, email, emails[email])
    assert resposta.status_code == 200, resposta.text
    return resposta.json()["token_verificacao"]


def cadastro(email, **extra):
    return {"nome": "Maria Souza", "email": email, "senha": SENHA_FORTE, **extra}


# ── Senha ──────────────────────────────────────────────────────────────

@pytest.mark.parametrize("senha", [
    "Ab#1xyz",            # curta demais
    "semmaiuscula#1",     # sem maiúscula
    "SEMMINUSCULA#1",     # sem minúscula
    "SemNumero#abc",      # sem número
    "SemSimbolo12345",    # sem símbolo
])
def test_senha_fraca_e_recusada(senha):
    assert validar_forca_senha(senha) is not None


def test_senha_comum_ou_derivada_da_conta_e_recusada():
    assert validar_forca_senha("Senha@123") is not None
    assert validar_forca_senha("Maria.Souza#99", email="maria.souza@example.com") is not None
    assert validar_forca_senha("Souza#98765!", nome="Maria Souza") is not None
    assert validar_forca_senha(SENHA_FORTE, email="maria@example.com", nome="Maria Souza") is None


def test_cadastro_rejeita_senha_fraca(client, emails):
    token = verificar(client, emails, "fraca@example.com")
    resposta = client.post(f"{API}/registrar", json=cadastro("fraca@example.com", senha="abc12345", token_verificacao=token))
    assert resposta.status_code == 422


# ── Verificação de e-mail ──────────────────────────────────────────────

def test_cadastro_sem_verificar_o_email_e_recusado(client):
    resposta = client.post(f"{API}/registrar", json=cadastro("sem@example.com"))
    assert resposta.status_code == 403
    assert client.post(f"{API}/login", json={"email": "sem@example.com", "senha": SENHA_FORTE}).status_code == 401


def test_fluxo_completo_cria_a_conta(client, emails):
    token = verificar(client, emails, "maria@example.com")
    resposta = client.post(f"{API}/registrar", json=cadastro("maria@example.com", token_verificacao=token))
    assert resposta.status_code == 201, resposta.text
    assert client.post(f"{API}/login", json={"email": "maria@example.com", "senha": SENHA_FORTE}).status_code == 200


def test_cadastro_com_quiz_tambem_exige_a_verificacao(client, emails):
    quiz = dict(
        data_nascimento="1998-01-01", genero="masculino",
        objetivo_nutricional="manter_peso", nivel_atividade="moderado",
        tmb_calculo=1700, data_registro="2026-10-19", peso_atual=70, altura_atual=170,
        origem_app="Instagram", ja_contou_calorias=False, peso_objetivo_kg=70,
        calorias_diarias=2000, proteina_g=150, carboidrato_g=220, gordura_g=60,
    )
    cabecalho = {"Idempotency-Key": "cadastro-quiz-verificacao-01"}
    sem_token = client.post(f"{API}/registrar-com-quiz", headers=cabecalho, json={"cadastro": cadastro("quiz@example.com"), "quiz": quiz})
    assert sem_token.status_code == 403
    token = verificar(client, emails, "quiz@example.com")
    com_token = client.post(
        f"{API}/registrar-com-quiz", headers={"Idempotency-Key": "cadastro-quiz-verificacao-02"},
        json={"cadastro": cadastro("quiz@example.com", token_verificacao=token), "quiz": quiz},
    )
    assert com_token.status_code == 201, com_token.text


def test_token_de_outro_email_nao_vale(client, emails):
    token = verificar(client, emails, "dona@example.com")
    resposta = client.post(f"{API}/registrar", json=cadastro("intruso@example.com", token_verificacao=token))
    assert resposta.status_code == 403


def test_tokens_de_sessao_e_de_verificacao_nao_se_misturam(client, emails):
    from app.core.security import criar_token_acesso

    token_verificacao = verificar(client, emails, "mistura@example.com")
    assert client.get(f"{API}/me", headers={"Authorization": f"Bearer {token_verificacao}"}).status_code == 401
    token_sessao = criar_token_acesso("00000000-0000-0000-0000-000000000000")
    resposta = client.post(f"{API}/registrar", json=cadastro("mistura@example.com", token_verificacao=token_sessao))
    assert resposta.status_code == 403
    assert client.post(f"{API}/registrar", json=cadastro("mistura@example.com", token_verificacao="lixo")).status_code == 403


def test_codigo_errado_e_recusado_e_o_correto_ainda_funciona(client, emails):
    pedir_codigo(client, "erro@example.com")
    certo = emails["erro@example.com"]
    errado = "000000" if certo != "000000" else "111111"
    resposta = confirmar(client, "erro@example.com", errado)
    assert resposta.status_code == 400
    assert confirmar(client, "erro@example.com", certo).status_code == 200


def test_tentativas_esgotadas_travam_ate_pedir_novo_codigo(client, emails):
    pedir_codigo(client, "forca@example.com")
    certo = emails["forca@example.com"]
    errado = "000000" if certo != "000000" else "111111"
    for _ in range(settings.CODIGO_EMAIL_MAX_TENTATIVAS):
        assert confirmar(client, "forca@example.com", errado).status_code == 400
    travado = confirmar(client, "forca@example.com", certo)
    assert travado.status_code == 400
    assert "novo código" in travado.json()["detail"]
    pedir_codigo(client, "forca@example.com")
    assert confirmar(client, "forca@example.com", emails["forca@example.com"]).status_code == 200


def test_codigo_e_de_uso_unico(client, emails):
    pedir_codigo(client, "unico@example.com")
    codigo = emails["unico@example.com"]
    assert confirmar(client, "unico@example.com", codigo).status_code == 200
    assert confirmar(client, "unico@example.com", codigo).status_code == 400


def test_codigo_expirado_e_recusado(client, emails, sessao):
    pedir_codigo(client, "velho@example.com")
    with sessao() as db:
        linha = db.get(VerificacaoEmail, "velho@example.com")
        linha.expira_em = datetime.utcnow() - timedelta(minutes=1)
        db.commit()
    assert confirmar(client, "velho@example.com", emails["velho@example.com"]).status_code == 400


def test_codigo_nao_e_guardado_em_claro(client, emails, sessao):
    pedir_codigo(client, "hash@example.com")
    with sessao() as db:
        linha = db.get(VerificacaoEmail, "hash@example.com")
        assert emails["hash@example.com"] not in linha.codigo_hash
        assert len(linha.codigo_hash) == 64


def test_formato_do_codigo_e_validado(client, emails):
    pedir_codigo(client, "formato@example.com")
    assert confirmar(client, "formato@example.com", "12ab56").status_code == 422
    assert confirmar(client, "formato@example.com", "12345").status_code == 422


def test_reenvio_respeita_o_intervalo(client, emails, monkeypatch):
    monkeypatch.setattr(settings, "CODIGO_EMAIL_REENVIO_SEGUNDOS", 60)
    assert pedir_codigo(client, "reenvio@example.com").status_code == 204
    segundo = pedir_codigo(client, "reenvio@example.com")
    assert segundo.status_code == 429
    assert int(segundo.headers["retry-after"]) > 0


def test_limite_de_codigos_por_email(client, emails):
    for _ in range(5):
        assert pedir_codigo(client, "spam@example.com").status_code == 204
    assert pedir_codigo(client, "spam@example.com").status_code == 429


def test_email_ja_cadastrado_nao_recebe_codigo(client, emails, monkeypatch):
    monkeypatch.setattr(settings, "EXIGIR_VERIFICACAO_EMAIL", False)
    assert client.post(f"{API}/registrar", json=cadastro("existe@example.com")).status_code == 201
    resposta = pedir_codigo(client, "existe@example.com")
    assert resposta.status_code == 409
    assert "existe@example.com" not in emails


def test_falha_no_envio_nao_consome_o_intervalo(client, monkeypatch):
    from fastapi import HTTPException

    def falhar(destino, codigo):
        raise HTTPException(503, "SMTP fora do ar")

    monkeypatch.setattr("app.services.verificacao_email_service.enviar_codigo_verificacao", falhar)
    monkeypatch.setattr(settings, "CODIGO_EMAIL_REENVIO_SEGUNDOS", 60)
    assert pedir_codigo(client, "smtp@example.com").status_code == 503
    enviados = {}
    monkeypatch.setattr(
        "app.services.verificacao_email_service.enviar_codigo_verificacao",
        lambda destino, codigo: enviados.__setitem__(destino, codigo),
    )
    assert pedir_codigo(client, "smtp@example.com").status_code == 204
    assert "smtp@example.com" in enviados


def test_producao_sem_smtp_recusa_em_vez_de_logar_o_codigo(monkeypatch):
    from fastapi import HTTPException
    from app.services import email_service

    monkeypatch.setattr(settings, "SMTP_HOST", "")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    with pytest.raises(HTTPException) as erro:
        email_service.enviar_codigo_verificacao("alguem@example.com", "123456")
    assert erro.value.status_code == 503
