"""Testes HTTP com SQLite temporário; nunca usam o banco configurado do projeto."""
import atexit
from concurrent.futures import ThreadPoolExecutor
from datetime import date
import os
import subprocess
import sys
from pathlib import Path
import tempfile
from threading import Barrier
import unittest
from unittest.mock import patch
import uuid

_temporario = tempfile.TemporaryDirectory(prefix="kaorcount-idempotencia-")
atexit.register(_temporario.cleanup)
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(_temporario.name) / "teste.db")
os.environ["ENVIRONMENT"] = "development"

from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
from app.main import app
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import criar_token_acesso
from app.models import (Usuario, RegistroAgua, OperacaoIdempotente, MetaNutri,
                        HistoricoProgresso, PerfilNutri, PesquisaInicial, Refeicao, ItemRefeicao)
from app.services.registro_agua_service import RegistroAguaService
from app.services.quiz_service import QuizService
from app.migrations.idempotencia import aplicar

settings.LIMITE_REGISTROS_POR_IP = 1000
settings.LIMITE_CADASTROS_POR_DIA = 1000

QUIZ = dict(
    data_nascimento="1998-01-01", genero="masculino",
    objetivo_nutricional="manter_peso", nivel_atividade="moderado",
    tmb_calculo=1700, data_registro="2026-10-19", peso_atual=70, altura_atual=170,
    origem_app="Instagram", ja_contou_calorias=False, peso_objetivo_kg=70,
    calorias_diarias=2000, proteina_g=150, carboidrato_g=220, gordura_g=60,
)


class IdempotenciaHTTPTest(unittest.TestCase):
    def setUp(self):
        with engine.begin() as conn:
            for tabela in reversed(Base.metadata.sorted_tables):
                conn.execute(tabela.delete())
        self.cliente = TestClient(app)
        self.addCleanup(self.cliente.close)
        self.usuario = self.criar_usuario()
        self.token = criar_token_acesso(self.usuario)
        self.agua = dict(id_usuario=self.usuario, data_registro="2026-10-19", quantidade_ml=250)

    def criar_usuario(self):
        identificador = str(uuid.uuid4())
        with SessionLocal() as db:
            db.add(Usuario(id_usuario=identificador, nome="Teste", email=identificador+"@example.com", senha_hash=b"hash"))
            db.commit()
        return identificador

    def headers(self, chave="operacao-teste-01", token=None):
        return {"Authorization": "Bearer " + (token or self.token), "Idempotency-Key": chave}

    def contar(self, modelo):
        with SessionLocal() as db:
            return db.query(modelo).count()

    def post_agua(self, chave="operacao-teste-01", **alteracoes):
        return self.cliente.post("/api/v1/registro-agua/", headers=self.headers(chave), json={**self.agua, **alteracoes})

    def test_repete_criacao_sem_duplicar_e_preserva_resposta(self):
        primeira = self.post_agua()
        repetida = self.post_agua()
        self.assertEqual(primeira.status_code, 201, primeira.text)
        self.assertEqual(repetida.content, primeira.content)
        self.assertEqual(repetida.headers["Idempotency-Replayed"], "true")
        self.assertEqual(self.contar(RegistroAgua), 1)
        self.assertEqual(self.post_agua("outra-operacao").status_code, 201)
        self.assertEqual(self.contar(RegistroAgua), 2)

    def test_rejeita_chave_reutilizada_com_outro_corpo_ou_query(self):
        self.assertEqual(self.post_agua().status_code, 201)
        self.assertEqual(self.post_agua(quantidade_ml=500).status_code, 409)
        resposta = self.cliente.post("/api/v1/registro-agua/?alterado=1", headers=self.headers(), json=self.agua)
        self.assertEqual(resposta.status_code, 409)
        self.assertEqual(self.contar(RegistroAgua), 1)

    def test_autentica_tambem_no_replay_e_isola_usuarios(self):
        self.post_agua()
        anonima = self.cliente.post("/api/v1/registro-agua/", headers={"Idempotency-Key":"operacao-teste-01"}, json=self.agua)
        self.assertEqual(anonima.status_code, 401)
        outro = self.criar_usuario()
        headers = self.headers(token=criar_token_acesso(outro))
        proibida = self.cliente.post("/api/v1/registro-agua/", headers=headers, json=self.agua)
        self.assertEqual(proibida.status_code, 403)
        permitida = self.cliente.post("/api/v1/registro-agua/", headers=headers, json={**self.agua,"id_usuario":outro})
        self.assertEqual(permitida.status_code, 201)
        with SessionLocal() as db:
            db.get(Usuario,self.usuario).status_conta="inativo"
            db.commit()
        self.assertEqual(self.post_agua().status_code, 403)

    def test_put_e_delete_repetidos(self):
        registro = self.post_agua().json()["id_registro_agua"]
        url = f"/api/v1/registro-agua/{registro}"
        primeira = self.cliente.put(url, headers=self.headers("atualizacao-01"), json={"quantidade_ml":300})
        segunda = self.cliente.put(url, headers=self.headers("atualizacao-01"), json={"quantidade_ml":300})
        self.assertEqual(primeira.status_code, 200, primeira.text)
        self.assertEqual(primeira.content, segunda.content)
        for _ in range(2):
            resposta = self.cliente.delete(url,headers=self.headers("remocao-teste-01"))
            self.assertEqual(resposta.status_code, 204, resposta.text)
            self.assertEqual(resposta.content,b"")
        self.assertEqual(self.contar(RegistroAgua), 0)

    def test_falha_depois_da_escrita_reverte_efeitos_e_permite_retry(self):
        original = RegistroAguaService.criar
        def falhar(service, dados):
            original(service,dados)
            raise HTTPException(503,"Falha simulada depois da escrita")
        with patch.object(RegistroAguaService,"criar",falhar):
            self.assertEqual(self.post_agua().status_code,503)
        self.assertEqual(self.contar(RegistroAgua),0)
        self.assertEqual(self.contar(OperacaoIdempotente),0)
        self.assertEqual(self.post_agua().status_code,201)
        self.assertEqual(self.contar(RegistroAgua),1)

    def test_chamadas_simultaneas_executam_uma_vez(self):
        barreira = Barrier(2)
        def enviar(_):
            with TestClient(app) as cliente:
                barreira.wait(timeout=10)
                return cliente.post("/api/v1/registro-agua/",headers=self.headers(),json=self.agua)
        with ThreadPoolExecutor(max_workers=2) as pool:
            primeira, segunda = list(pool.map(enviar,range(2)))
        self.assertEqual([primeira.status_code,segunda.status_code],[201,201])
        self.assertEqual(primeira.content,segunda.content)
        self.assertEqual(self.contar(RegistroAgua),1)

    def test_validacao_da_resposta_tambem_reverte_a_escrita(self):
        original=RegistroAguaService.criar
        def resposta_invalida(service,dados):
            original(service,dados)
            return {"invalida":True}
        with TestClient(app, raise_server_exceptions=False) as cliente, patch.object(RegistroAguaService,"criar",resposta_invalida):
            resposta=cliente.post("/api/v1/registro-agua/",headers=self.headers(),json=self.agua)
            self.assertEqual(resposta.status_code,500)
        self.assertEqual(self.contar(RegistroAgua),0)
        self.assertEqual(self.post_agua().status_code,201)

    def test_rollback_interno_nao_confirma_efeitos_sem_recibo(self):
        original=RegistroAguaService.criar
        def rollback_silencioso(service,dados):
            original(service,dados)
            service.repo.db.rollback()
            return original(service,dados)
        with patch.object(RegistroAguaService,"criar",rollback_silencioso):
            self.assertEqual(self.post_agua().status_code,503)
        self.assertEqual(self.contar(RegistroAgua),0)
        self.assertEqual(self.contar(OperacaoIdempotente),0)

    def test_refeicoes_itens_e_progresso_nao_duplicam(self):
        alimento=self.cliente.post("/api/v1/alimentos/",headers=self.headers("alimento-teste-01"),json=dict(nome_alimento="Arroz",porcao_padrao_g=100,calorias=100,proteinas=5,carboidratos=20,gorduras=1)).json()
        refeicao=dict(id_usuario=self.usuario,data_refeicao="2026-10-19",tipo_refeicao="almoco")
        primeira=self.cliente.post("/api/v1/refeicoes/",headers=self.headers(),json=refeicao)
        segunda=self.cliente.post("/api/v1/refeicoes/",headers=self.headers(),json=refeicao)
        self.assertEqual(primeira.status_code,201,primeira.text)
        self.assertEqual(primeira.content,segunda.content)
        url=f"/api/v1/refeicoes/{primeira.json()['id_refeicao']}/itens"
        for _ in range(2):
            resposta=self.cliente.post(url,headers=self.headers(),json=dict(id_alimento=alimento["id_alimento"],quantidade_alimento_g=100))
            self.assertEqual(resposta.status_code,201,resposta.text)
            resposta=self.cliente.post("/api/v1/historico-progresso/",headers=self.headers(),json=dict(id_usuario=self.usuario,data_registro="2026-10-19",peso_atual=70,altura_atual=170))
            self.assertEqual(resposta.status_code,201,resposta.text)
        for modelo in [Refeicao,ItemRefeicao,HistoricoProgresso]:
            self.assertEqual(self.contar(modelo),1)

    def test_chave_invalida_e_validacao_nao_gravam_recibo(self):
        self.assertEqual(self.post_agua("x").status_code,400)
        self.assertEqual(self.post_agua(quantidade_ml=-1).status_code,422)
        self.assertEqual(self.contar(OperacaoIdempotente),0)
        self.assertEqual(self.post_agua().status_code,201)

    def test_criacao_sem_chave_continua_compativel(self):
        r=self.cliente.post("/api/v1/registro-agua/",headers={"Authorization":"Bearer "+self.token},json=self.agua)
        self.assertEqual(r.status_code,201,r.text)

    def test_cadastro_com_quiz_atomico_e_repetivel(self):
        dados=dict(cadastro=dict(nome="Nova Conta",email="cadastro@example.com",senha="senhaTeste123"),quiz=QUIZ)
        headers={"Idempotency-Key":"cadastro-com-quiz-01"}
        primeira=self.cliente.post("/api/v1/auth/registrar-com-quiz",headers=headers,json=dados)
        segunda=self.cliente.post("/api/v1/auth/registrar-com-quiz",headers=headers,json=dados)
        self.assertEqual(primeira.status_code,201,primeira.text)
        self.assertEqual(primeira.content,segunda.content)
        for modelo in [MetaNutri,HistoricoProgresso,PerfilNutri,PesquisaInicial]:
            self.assertEqual(self.contar(modelo),1,modelo.__name__)
        with SessionLocal() as db:
            recibo=db.query(OperacaoIdempotente).one()
            self.assertNotIn("senhaTeste123",recibo.assinatura+recibo.resposta+recibo.cabecalhos)

    def test_quiz_com_falha_nao_cria_conta_nem_dados_parciais(self):
        dados=dict(cadastro=dict(nome="Nova Conta",email="cadastro@example.com",senha="senhaTeste123"),quiz=QUIZ)
        original=QuizService.salvar
        def falhar(service, *args):
            original(service,*args)
            raise HTTPException(503,"Falha simulada")
        with patch.object(QuizService,"salvar",falhar):
            r=self.cliente.post("/api/v1/auth/registrar-com-quiz",headers={"Idempotency-Key":"cadastro-atomico-01"},json=dados)
            self.assertEqual(r.status_code,503,r.text)
        self.assertEqual(self.contar(Usuario),1)  # só o usuário criado pelo setUp
        for modelo in [MetaNutri,HistoricoProgresso,PerfilNutri,PesquisaInicial,OperacaoIdempotente]:
            self.assertEqual(self.contar(modelo),0,modelo.__name__)
        r=self.cliente.post("/api/v1/auth/registrar-com-quiz",headers={"Idempotency-Key":"cadastro-atomico-01"},json=dados)
        self.assertEqual(r.status_code,201,r.text)

    def test_quiz_autenticado_repetido_nao_duplica_progresso(self):
        url=f"/api/v1/quiz/{self.usuario}"
        for _ in range(2):
            r=self.cliente.put(url,headers=self.headers(),json=QUIZ)
            self.assertEqual(r.status_code,204,r.text)
        self.assertEqual(self.contar(HistoricoProgresso),1)

    def test_meta_por_dia_tem_unicidade_no_banco(self):
        with SessionLocal() as db:
            valores=dict(id_usuario=self.usuario,data_inicio=date.today(),calorias_diarias=2000,proteina_g=100,carboidrato_g=200,gordura_g=50)
            db.add(MetaNutri(**valores));db.commit()
            db.add(MetaNutri(**valores))
            with self.assertRaises(IntegrityError):
                db.commit()
            db.rollback()

    def test_migracao_repetivel_recusa_duplicatas_sem_apagar(self):
        outro=create_engine("sqlite://")
        with outro.begin() as conn:
            conn.execute(text("CREATE TABLE meta_nutri (id_usuario TEXT, data_inicio TEXT)"))
            conn.execute(text("INSERT INTO meta_nutri VALUES ('u','2026-01-01'),('u','2026-01-01')"))
        with self.assertRaises(RuntimeError):
            aplicar(outro)
        with outro.begin() as conn:
            self.assertEqual(conn.execute(text("SELECT COUNT(*) FROM meta_nutri")).scalar(),2)
            conn.execute(text("DELETE FROM meta_nutri"))
        aplicar(outro)
        aplicar(outro)
        outro.dispose()

    def test_comando_de_migracao_recusa_fallback_sqlite(self):
        resultado=subprocess.run(
            [sys.executable,"-m","app.migrations.idempotencia"],
            capture_output=True,text=True,timeout=30,
        )
        self.assertNotEqual(resultado.returncode,0)
        self.assertIn("Migração cancelada",resultado.stderr)


if __name__=="__main__":
    unittest.main()
