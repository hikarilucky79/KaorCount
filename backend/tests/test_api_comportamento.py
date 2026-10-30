import os
from datetime import date
from tempfile import TemporaryDirectory
from pathlib import Path

import pytest

# A aplicação cria tabelas no import: nunca apontar a coleta de testes ao banco real.
_banco_importacao = TemporaryDirectory(prefix="kaorcount-test-")
os.environ["DATABASE_URL"] = "sqlite:///" + (Path(_banco_importacao.name) / "import.db").as_posix()
os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "chave-apenas-para-testes-kaorcount-123456"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db, engine as engine_importacao
from app.services import nutricao_service
from app.services.nutricao_service import NutricaoService


@pytest.fixture(scope="module", autouse=True)
def limpar_banco_importacao():
    yield
    engine_importacao.dispose()
    _banco_importacao.cleanup()


@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessao = sessionmaker(bind=engine)
    def banco_teste():
        with sessao() as db:
            yield db
    anteriores = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = banco_teste
    try:
        with TestClient(app) as cliente:
            yield cliente
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(anteriores)
        engine.dispose()


def registrar(client, nome):
    dados = {"nome": "Usuario " + nome, "email": nome.lower() + "@example.com", "senha": "SenhaTeste123!"}
    resposta = client.post("/api/v1/auth/registrar", json=dados)
    assert resposta.status_code == 201, resposta.text
    login = client.post("/api/v1/auth/login", json={"email": dados["email"], "senha": dados["senha"]})
    assert login.status_code == 200, login.text
    return resposta.json()["id_usuario"], {"Authorization": "Bearer " + login.json()["access_token"]}


@pytest.mark.parametrize("genero,esperado", [("masculino", 1648.75), ("feminino", 1482.75)])
def test_tmb(monkeypatch, genero, esperado):
    class Hoje(date):
        @classmethod
        def today(cls):
            return cls(2026, 10, 26)
    monkeypatch.setattr(nutricao_service, "date", Hoje)
    assert NutricaoService.calcular_tmb(date(1996, 10, 26), genero, 70, 175) == esperado
    assert NutricaoService.calcular_tmb(date(1996, 10, 27), genero, 70, 175) == esperado + 5


@pytest.mark.parametrize("objetivo,calorias,macros", [
    ("perder_peso", 1920, (168, 192, 53)),
    ("manter_peso", 2400, (270, 180, 67)),
    ("ganhar_massa", 2880, (360, 216, 64)),
])
def test_calorias_e_macros(objetivo, calorias, macros):
    assert NutricaoService.calcular_calorias_diarias(2000, "sedentario", objetivo) == calorias
    resultado = NutricaoService.calcular_macros(calorias, objetivo)
    assert resultado == dict(calorias_diarias=calorias, carboidrato_g=macros[0], proteina_g=macros[1], gordura_g=macros[2])


def test_autenticacao_e_idor(client):
    a, token_a = registrar(client, "A")
    b, token_b = registrar(client, "B")
    rotas = ["/perfil-nutri/{id}", "/metas-nutri/usuario/{id}/atual", "/sugestoes/{id}", "/lembretes/config/{id}", "/relatorios/usuario/{id}/dados"]
    params = {"data_inicio": "2026-01-01", "data_fim": "2026-01-07"}
    for rota in rotas:
        url = "/api/v1" + rota
        assert client.get(url.format(id=b), params=params, headers=token_a).status_code == 403
        for id_usuario, token in [(a, token_a), (b, token_b)]:
            resposta = client.get(url.format(id=id_usuario), params=params, headers=token)
            assert resposta.status_code == 200, resposta.text
        assert client.get(url.format(id=a), params=params).status_code == 401


def test_alimento_refeicao_agua_lembretes_e_relatorio(client):
    usuario, token = registrar(client, "Rotina")
    alimento = {"nome_alimento": "Arroz caseiro", "porcao_padrao_g": 100, "calorias": 120, "proteinas": 3, "carboidratos": 25, "gorduras": 1, "origem_dados": "caseiro"}
    resposta = client.post("/api/v1/alimentos/", json=alimento, headers=token)
    assert resposta.status_code == 201, resposta.text
    id_alimento = resposta.json()["id_alimento"]
    assert client.post("/api/v1/alimentos/", json={**alimento, "porcao_padrao_g": 0}, headers=token).status_code == 422
    refeicao = client.post("/api/v1/refeicoes/", json={"id_usuario": usuario, "data_refeicao": "2026-01-02", "tipo_refeicao": "almoco"}, headers=token)
    assert refeicao.status_code == 201, refeicao.text
    id_refeicao = refeicao.json()["id_refeicao"]
    item = client.post(f"/api/v1/refeicoes/{id_refeicao}/itens", json={"id_alimento": id_alimento, "quantidade_alimento_g": 150}, headers=token)
    assert item.status_code == 201, item.text
    diario = client.get(f"/api/v1/refeicoes/usuario/{usuario}/dia/2026-01-02", headers=token).json()
    assert diario[0]["itens"][0]["quantidade_alimento_g"] == 150
    agua = client.post("/api/v1/registro-agua/", json={"id_usuario": usuario, "quantidade_ml": 250, "data_registro": "2026-01-02"}, headers=token)
    assert agua.status_code == 201, agua.text
    base = f"/api/v1/lembretes/config/{usuario}"
    assert client.get(base, headers=token).status_code == 200
    atualizado = client.put(base + "/agua", params={"intervalo_min": 90, "meta_diaria_ml": 2300}, headers=token)
    assert atualizado.status_code == 200, atualizado.text
    assert client.get(base, headers=token).json()["agua_meta_diaria_ml"] == 2300
    assert client.put(base + "/agua", params={"intervalo_min": 10, "meta_diaria_ml": 10}, headers=token).status_code == 422
    assert client.put(base + "/refeicoes", params={"horarios": "08:00,12:30,19:00"}, headers=token).json()["refeicao_horarios"] == ["08:00", "12:30", "19:00"]
    assert client.post(base + "/desativar", headers=token).json()["ativo"] is False
    assert client.post(base + "/ativar", headers=token).json()["ativo"] is True
    params = {"data_inicio": "2026-01-01", "data_fim": "2026-01-02"}
    relatorio = client.get(f"/api/v1/relatorios/usuario/{usuario}/dados", params=params, headers=token)
    assert relatorio.status_code == 200, relatorio.text
    assert relatorio.json()["resumo"]["total_calorias"] == 180
    assert relatorio.json()["resumo"]["media_calorias_dia"] == 90
    pdf = client.get(f"/api/v1/relatorios/usuario/{usuario}/pdf", params=params, headers=token)
    assert pdf.status_code == 200, pdf.text
    assert pdf.content.startswith(b"%PDF")
    assert client.patch(f"/api/v1/usuarios/{usuario}/status", headers=token).status_code == 200
    assert client.get("/api/v1/auth/me", headers=token).status_code in (401, 403)


def test_aceitar_sugestao_respeita_data_local(client):
    import json
    from app.models.sugestao_refeicao import SugestaoRefeicao
    usuario, token = registrar(client, "Sugestao")
    alimento = client.post("/api/v1/alimentos/", headers=token, json={
        "nome_alimento": "Alimento local", "porcao_padrao_g": 100,
        "calorias": 100, "proteinas": 5, "carboidratos": 15, "gorduras": 2,
    }).json()
    banco = app.dependency_overrides[get_db]()
    db = next(banco)
    try:
        sugestao = SugestaoRefeicao(id_usuario=usuario, nome="Jantar", tipo_refeicao="Jantar",
            calorias=100, proteinas=5, carboidratos=15, gorduras=2,
            data_geracao="2026-10-27", alimentos_sugeridos=json.dumps([{
                "id_alimento_local": alimento["id_alimento"], "nome": "Alimento local", "quantidade_g": 100,
                "calorias": 100, "proteinas": 5, "carboidratos": 15, "gorduras": 2,
            }]))
        db.add(sugestao)
        db.commit()
        id_sugestao = sugestao.id_sugestao
    finally:
        banco.close()
    resposta = client.post(f"/api/v1/sugestoes/aceitar/{id_sugestao}", params={"data": "2026-10-26"}, headers=token)
    assert resposta.status_code == 200, resposta.text
    assert resposta.json()["itens_criados"] == 1
    assert resposta.json()["sugestao"]["aceita"] is True
    refeicao = client.get("/api/v1/refeicoes/" + resposta.json()["id_refeicao"], headers=token).json()
    assert refeicao["data_refeicao"] == "2026-10-26"
    assert refeicao["tipo_refeicao"] == "Jantar"


def test_gerar_sugestoes_sem_busca_externa(client, monkeypatch):
    from app.services.sugestao_service import SugestaoService
    usuario, token = registrar(client, "Geracao")
    monkeypatch.setattr(SugestaoService, "_buscar_alimentos_fatsecret", lambda *args, **kwargs: [])
    resposta = client.post(f"/api/v1/sugestoes/gerar/{usuario}", headers=token)
    assert resposta.status_code == 200, resposta.text
    sugestoes = resposta.json()
    assert {s["tipo_refeicao"] for s in sugestoes} == {"Café da manhã", "Almoço", "Lanche", "Jantar"}
    assert all(s["alimentos_sugeridos"] == [] and s["aceita"] is False for s in sugestoes)
    assert len(client.get(f"/api/v1/sugestoes/{usuario}", headers=token).json()) == 4


def test_sugestoes_usam_catalogo_real_sem_rede(client, monkeypatch):
    from app.services.sugestao_service import SugestaoService
    from app.services.taco_service import TacoService
    monkeypatch.setattr(TacoService, "_obter_dados_taco", lambda: [])
    usuario, token = registrar(client, "Catalogo")
    payload = {"nome_alimento": "Feijão preparado", "porcao_padrao_g": 50, "calorias": 60,
               "proteinas": 4, "carboidratos": 10, "gorduras": 1, "origem_dados": "caseiro"}
    alimento = client.post("/api/v1/alimentos/", json=payload, headers=token).json()
    def nao_buscar(*args, **kwargs):
        raise AssertionError("Catálogo local não deve depender de rede")
    monkeypatch.setattr(SugestaoService, "_buscar_alimentos_fatsecret", nao_buscar)
    geradas = client.post(f"/api/v1/sugestoes/gerar/{usuario}", headers=token)
    assert geradas.status_code == 200, geradas.text
    sugestoes = geradas.json()
    assert len(sugestoes) == 4
    for sugestao in sugestoes:
        item = sugestao["alimentos_sugeridos"][0]
        assert item["id_alimento_local"] == alimento["id_alimento"]
        assert item["nome"] == "Feijão preparado"
        assert item["calorias"] == pytest.approx(item["quantidade_g"] * 60 / 50, abs=0.1)
    resposta = client.post(f"/api/v1/sugestoes/aceitar/{sugestoes[0]['id_sugestao']}", headers=token)
    assert resposta.status_code == 200
    assert resposta.json()["itens_criados"] == 1
    assert len(client.get("/api/v1/alimentos/", headers=token).json()) == 1


def test_sugestoes_locais_mantem_limite_separado(client, monkeypatch):
    from app.services.sugestao_service import SugestaoService
    usuario, token = registrar(client, "LimiteLocal")
    client.post("/api/v1/alimentos/", json={"nome_alimento":"Aveia", "porcao_padrao_g":100,
                "calorias":100, "proteinas":4, "carboidratos":20, "gorduras":1}, headers=token)
    monkeypatch.setattr(SugestaoService, "gerar_todas", lambda self, id_usuario: [])
    for _ in range(9):
        assert client.post(f"/api/v1/sugestoes/gerar/{usuario}", headers=token).status_code == 200
    ultima = client.post(f"/api/v1/sugestoes/gerar/{usuario}", headers=token)
    assert ultima.status_code == 429
    assert int(ultima.headers["retry-after"]) > 0


def test_sugestoes_importam_taco_com_origem_correta(client, monkeypatch):
    from app.services.sugestao_service import SugestaoService
    usuario, token = registrar(client, "Taco")
    item = {"food_id":"taco_123", "nome":"Arroz cozido TACO", "porcao_padrao_g":100,
            "calorias":120, "proteinas":3, "carboidratos":25, "gorduras":1, "origem_dados":"Tabela TACO"}
    monkeypatch.setattr(SugestaoService, "_buscar_alimentos_fatsecret", lambda *args, **kwargs: [item])
    resposta = client.post(f"/api/v1/sugestoes/gerar/{usuario}", headers=token)
    assert resposta.status_code == 200, resposta.text
    assert all(s["alimentos_sugeridos"][0]["nome"] == "Arroz cozido TACO" for s in resposta.json())
    alimentos = client.get("/api/v1/alimentos/", headers=token).json()
    assert len(alimentos) == 1
    assert alimentos[0]["origem_dados"] == "TACO:taco_123"


def test_catalogo_local_e_taco_contribuem_para_sugestoes(client, monkeypatch):
    from app.services.sugestao_service import SugestaoService
    from app.services.taco_service import TacoService
    usuario, token = registrar(client, "Combinado")
    client.post("/api/v1/alimentos/", json={"nome_alimento":"Feijão da casa", "porcao_padrao_g":100,
                "calorias":80, "proteinas":5, "carboidratos":12, "gorduras":1}, headers=token)
    externo = {"food_id":"taco_99", "nome":"Arroz TACO", "porcao_padrao_g":100,
               "calorias":120, "proteinas":3, "carboidratos":25, "gorduras":1}
    monkeypatch.setattr(TacoService, "_obter_dados_taco", lambda: [externo])
    monkeypatch.setattr(TacoService, "buscar_alimentos", lambda *args, **kwargs: [externo])
    original = SugestaoService._selecionar_combinacao_otima
    vistos = []
    def capturar(self, alimentos, *args, **kwargs):
        vistos.append({a["nome"] for a in alimentos})
        return original(self, alimentos, *args, **kwargs)
    monkeypatch.setattr(SugestaoService, "_selecionar_combinacao_otima", capturar)
    resposta = client.post(f"/api/v1/sugestoes/gerar/{usuario}", headers=token)
    assert resposta.status_code == 200, resposta.text
    assert all({"Feijão da casa", "Arroz TACO"} <= nomes for nomes in vistos)


def test_ofensiva_exige_alimento_e_conta_sequencia(client):
    usuario, token = registrar(client, "Ofensiva")
    alimento = client.post("/api/v1/alimentos/", json={"nome_alimento":"Arroz", "porcao_padrao_g":100,
                "calorias":100, "proteinas":3, "carboidratos":20, "gorduras":1}, headers=token).json()
    def refeicao(data):
        resposta = client.post("/api/v1/refeicoes/", json={"id_usuario":usuario,
                              "data_refeicao":data, "tipo_refeicao":"almoco"}, headers=token)
        assert resposta.status_code == 201
        return resposta.json()["id_refeicao"]
    def adicionar(id_refeicao):
        return client.post(f"/api/v1/refeicoes/{id_refeicao}/itens", headers=token,
                           json={"id_alimento":alimento["id_alimento"],"quantidade_alimento_g":100})
    anterior = refeicao("2026-10-26")
    assert adicionar(anterior).status_code == 201
    hoje = refeicao("2026-10-27")
    url = f"/api/v1/dashboard/usuario/{usuario}"
    assert client.get(url, params={"data":"2026-10-27"}, headers=token).json()["streak_dias"] == 0
    assert adicionar(hoje).status_code == 201
    assert client.get(url, params={"data":"2026-10-27"}, headers=token).json()["streak_dias"] == 2
    assert adicionar(hoje).status_code == 201
    assert client.get(url, params={"data":"2026-10-27"}, headers=token).json()["streak_dias"] == 2


def test_ofensiva_ultrapassa_200_dias_e_para_na_lacuna(client):
    from datetime import timedelta
    from uuid import uuid4
    from app.models.refeicao import Refeicao
    from app.models.item_refeicao import ItemRefeicao
    usuario, token = registrar(client, "SequenciaLonga")
    alimento = client.post("/api/v1/alimentos/", json={"nome_alimento":"Alimento", "porcao_padrao_g":100,
                "calorias":100, "proteinas":3, "carboidratos":20, "gorduras":1}, headers=token).json()
    banco = app.dependency_overrides[get_db]()
    db = next(banco)
    base = date(2026, 10, 27)
    ids = []
    try:
        for deslocamento in range(205):
            refeicao_id = str(uuid4())
            ids.append(refeicao_id)
            db.add(Refeicao(id_refeicao=refeicao_id, id_usuario=usuario,
                            data_refeicao=base - timedelta(days=deslocamento), tipo_refeicao="almoco"))
            db.add(ItemRefeicao(id_refeicao=refeicao_id, id_alimento=str(alimento["id_alimento"]),
                                quantidade_alimento_g=100))
        db.commit()
        url = f"/api/v1/dashboard/usuario/{usuario}"
        assert client.get(url, params={"data":base.isoformat()}, headers=token).json()["streak_dias"] == 205
        db.query(ItemRefeicao).filter(ItemRefeicao.id_refeicao == ids[50]).delete()
        db.commit()
        assert client.get(url, params={"data":base.isoformat()}, headers=token).json()["streak_dias"] == 50
    finally:
        banco.close()


def test_preferencias_persistem_por_conta(client):
    usuario, token = registrar(client, 'Preferencias')
    outro, token_outro = registrar(client, 'PreferenciasOutro')
    valores = {'tema': 'escuro', 'unidade_peso': 'lb', 'unidade_altura': 'in', 'unidade_agua': 'L', 'periodo_grafico': 30, 'notificacoes_push': False}
    salvo = client.put(f'/api/v1/usuarios/{usuario}', json={'preferencias': valores}, headers=token)
    assert salvo.status_code == 200, salvo.text
    assert salvo.json()['preferencias'] == valores
    assert client.get('/api/v1/auth/me', headers=token).json()['preferencias'] == valores
    outro_login = client.post('/api/v1/auth/login', json={'email': 'preferencias@example.com', 'senha': 'SenhaTeste123!'})
    assert outro_login.status_code == 200
    token_outro_dispositivo = {'Authorization': 'Bearer ' + outro_login.json()['access_token']}
    assert client.get('/api/v1/auth/me', headers=token_outro_dispositivo).json()['preferencias'] == valores
    alterado = client.put(f'/api/v1/usuarios/{usuario}', json={'preferencias': {'tema': 'claro'}}, headers=token)
    assert alterado.json()['preferencias'] == {**valores, 'tema': 'claro'}
    assert client.get('/api/v1/auth/me', headers=token_outro).json()['preferencias'] is None
    assert client.put(f'/api/v1/usuarios/{outro}', json={'preferencias': valores}, headers=token).status_code == 403
    assert client.put(f'/api/v1/usuarios/{usuario}', json={'preferencias': {'periodo_grafico': 12}}, headers=token).status_code == 422


def test_sugestao_regerada_nao_duplica_refeicao(client, monkeypatch):
    from app.services.taco_service import TacoService
    monkeypatch.setattr(TacoService, '_obter_dados_taco', lambda: [])
    usuario, token = registrar(client, 'SemDuplicacao')
    alimento = {'nome_alimento': 'Aveia teste', 'porcao_padrao_g': 100, 'calorias': 200, 'proteinas': 10, 'carboidratos': 30, 'gorduras': 5, 'origem_dados': 'caseiro'}
    assert client.post('/api/v1/alimentos/', json=alimento, headers=token).status_code == 201
    url = f'/api/v1/sugestoes/gerar/{usuario}'
    primeira = client.post(url, headers=token)
    assert primeira.status_code == 200, primeira.text
    jantar = next(s for s in primeira.json() if s['tipo_refeicao'] == 'Jantar')
    dia = date.today().isoformat()
    aceita = client.post(f"/api/v1/sugestoes/aceitar/{jantar['id_sugestao']}", params={'data': dia}, headers=token)
    assert aceita.status_code == 200, aceita.text
    assert aceita.json()['itens_criados'] > 0
    repetida = client.post(f"/api/v1/sugestoes/aceitar/{jantar['id_sugestao']}", params={'data': dia}, headers=token)
    assert repetida.status_code == 409
    nova = client.post(url, headers=token)
    assert nova.status_code == 200, nova.text
    jantar_novo = next(s for s in nova.json() if s['tipo_refeicao'] == 'Jantar')
    assert jantar_novo['id_sugestao'] != jantar['id_sugestao']
    assert jantar_novo['aceita'] is True
    assert client.post(f"/api/v1/sugestoes/aceitar/{jantar_novo['id_sugestao']}", params={'data': dia}, headers=token).status_code == 409
    lista = client.get(f'/api/v1/sugestoes/{usuario}', headers=token).json()
    assert next(s for s in lista if s['id_sugestao'] == jantar_novo['id_sugestao'])['aceita'] is True
    diario = client.get(f'/api/v1/refeicoes/usuario/{usuario}/dia/{dia}', headers=token).json()
    assert len([r for r in diario if r['tipo_refeicao'] == 'Jantar']) == 1
    import json
    from app.models.sugestao_refeicao import SugestaoRefeicao
    banco = app.dependency_overrides[get_db]()
    db = next(banco)
    try:
        novo_item = dict(jantar_novo['alimentos_sugeridos'][0])
        novo_item['quantidade_g'] += 10
        diferente = SugestaoRefeicao(id_usuario=usuario, nome='Jantar diferente', tipo_refeicao='Jantar',
            calorias=100, proteinas=5, carboidratos=15, gorduras=2, data_geracao=dia,
            alimentos_sugeridos=json.dumps([novo_item]))
        db.add(diferente)
        db.commit()
        diferente_id = diferente.id_sugestao
    finally:
        banco.close()
    assert client.post(f'/api/v1/sugestoes/aceitar/{diferente_id}', params={'data': dia}, headers=token).status_code == 200
    outro_tipo = next(s for s in nova.json() if s['tipo_refeicao'] == 'Almoço')
    assert outro_tipo['aceita'] is False
    assert client.post(f"/api/v1/sugestoes/aceitar/{outro_tipo['id_sugestao']}", params={'data': dia}, headers=token).status_code == 200


def test_desmarcar_sugestao_remove_apenas_refeicao_correspondente(client, monkeypatch):
    from app.services.taco_service import TacoService
    monkeypatch.setattr(TacoService, '_obter_dados_taco', lambda: [])
    usuario, token = registrar(client, 'Desmarcar')
    outro, token_outro = registrar(client, 'DesmarcarOutro')
    alimento = {'nome_alimento': 'Aveia para desmarcar', 'porcao_padrao_g': 100, 'calorias': 200, 'proteinas': 10, 'carboidratos': 30, 'gorduras': 5}
    alimento_id = client.post('/api/v1/alimentos/', json=alimento, headers=token).json()['id_alimento']
    geracao = f'/api/v1/sugestoes/gerar/{usuario}'
    sugestoes = client.post(geracao, headers=token).json()
    jantar = next(s for s in sugestoes if s['tipo_refeicao'] == 'Jantar')
    dia = date.today().isoformat()
    aceitar_url = f"/api/v1/sugestoes/aceitar/{jantar['id_sugestao']}"
    assert client.post(aceitar_url, params={'data': dia}, headers=token).status_code == 200
    outro_registro = client.post('/api/v1/refeicoes/', headers=token, json={'id_usuario': usuario, 'data_refeicao': dia, 'tipo_refeicao': 'Jantar'}).json()
    assert client.post(f"/api/v1/refeicoes/{outro_registro['id_refeicao']}/itens", headers=token, json={'id_alimento': alimento_id, 'quantidade_alimento_g': 3}).status_code == 201
    nova = client.post(geracao, headers=token).json()
    jantar_novo = next(s for s in nova if s['tipo_refeicao'] == 'Jantar')
    assert jantar_novo['aceita'] is True
    url = f"/api/v1/sugestoes/aceitar/{jantar_novo['id_sugestao']}"
    assert client.post(url, params={'data': dia, 'desfazer': True}, headers=token_outro).status_code == 403
    resultado = client.post(url, params={'data': dia, 'desfazer': True}, headers=token)
    assert resultado.status_code == 200, resultado.text
    assert resultado.json()['sugestao']['aceita'] is False
    diario = client.get(f'/api/v1/refeicoes/usuario/{usuario}/dia/{dia}', headers=token).json()
    assert len(diario) == 1 and diario[0]['id_refeicao'] == outro_registro['id_refeicao']
    assert client.post(url, params={'data': dia}, headers=token).status_code == 200


def test_desmarcar_ambigua_nao_remove_refeicoes(client, monkeypatch):
    from app.services.taco_service import TacoService
    monkeypatch.setattr(TacoService, '_obter_dados_taco', lambda: [])
    usuario, token = registrar(client, 'Ambigua')
    alimento = {'nome_alimento': 'Alimento ambíguo', 'porcao_padrao_g': 100, 'calorias': 150, 'proteinas': 10, 'carboidratos': 20, 'gorduras': 4}
    client.post('/api/v1/alimentos/', json=alimento, headers=token)
    dia = date.today().isoformat()
    sugestao = next(s for s in client.post(f'/api/v1/sugestoes/gerar/{usuario}', headers=token).json() if s['tipo_refeicao'] == 'Jantar')
    url = f"/api/v1/sugestoes/aceitar/{sugestao['id_sugestao']}"
    assert client.post(url, params={'data': dia}, headers=token).status_code == 200
    duplicada = client.post('/api/v1/refeicoes/', headers=token, json={'id_usuario': usuario, 'data_refeicao': dia, 'tipo_refeicao': 'Jantar'}).json()
    for item in sugestao['alimentos_sugeridos']:
        assert client.post(f"/api/v1/refeicoes/{duplicada['id_refeicao']}/itens", headers=token, json={'id_alimento': item['id_alimento_local'], 'quantidade_alimento_g': item['quantidade_g']}).status_code == 201
    assert client.post(url, params={'data': dia, 'desfazer': True}, headers=token).status_code == 409
    assert len(client.get(f'/api/v1/refeicoes/usuario/{usuario}/dia/{dia}', headers=token).json()) == 2
    assert client.delete(f"/api/v1/refeicoes/{duplicada['id_refeicao']}", headers=token).status_code == 204
    diario = client.get(f'/api/v1/refeicoes/usuario/{usuario}/dia/{dia}', headers=token).json()
    item = diario[0]['itens'][0]
    assert client.put(f"/api/v1/refeicoes/itens/{item['id_refeicao_item']}", headers=token, json={'quantidade_alimento_g': item['quantidade_alimento_g'] + 1}).status_code == 200
    assert client.post(url, params={'data': dia, 'desfazer': True}, headers=token).status_code == 409
    assert len(client.get(f'/api/v1/refeicoes/usuario/{usuario}/dia/{dia}', headers=token).json()) == 1
