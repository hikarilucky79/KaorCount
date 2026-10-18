import sys

sys.path.insert(0, ".")

from fastapi.testclient import TestClient

import app.main as m
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.limite import consumir
from app.models.limite_requisicao import LimiteRequisicao
from app.models.usuario import Usuario

cliente = TestClient(m.app)
db = SessionLocal()

print("=== 1. contador de janela ===")
for tentativa in range(1, 5):
    qtd, restante = consumir(db, "teste:contador", 3, 60)
    print(f"  chamada {tentativa}: quantidade={qtd} restante={restante}")
qtd, restante = consumir(db, "teste:contador", 3, 0)
print(f"  janela vencida reinicia: quantidade={qtd} restante={restante}")

print("=== 2. limite de login por IP (teto 10/min) ===")
codigos = []
for tentativa in range(1, 13):
    resp = cliente.post(
        "/api/v1/auth/login",
        json={"email": "nao.existe@gmail.com", "senha": "senhaForte123"},
    )
    codigos.append(resp.status_code)
    if tentativa >= 9:
        print(
            f"  tentativa {tentativa}: HTTP {resp.status_code} "
            f"retry-after={resp.headers.get('retry-after')}"
        )
print(f"  sequencia: {codigos}")

print("=== 3. teto global de cadastros do dia ===")
antes = db.query(Usuario).count()
settings.LIMITE_CADASTROS_POR_DIA = 1
resp = cliente.post(
    "/api/v1/auth/registrar",
    json={"nome": "Teste Limite", "email": "limite.teto@gmail.com", "senha": "senhaForte123"},
)
depois = db.query(Usuario).count()
print(f"  HTTP {resp.status_code} detail={resp.json().get('detail')!r}")
print(f"  usuarios antes={antes} depois={depois}")

print("=== 4. fatsecret sem token nao gasta contador ===")
antes_f = db.query(LimiteRequisicao).filter(LimiteRequisicao.chave.like("usuario:%")).count()
resp = cliente.get("/api/v1/fatsecret/buscar?nome=arroz")
depois_f = db.query(LimiteRequisicao).filter(LimiteRequisicao.chave.like("usuario:%")).count()
print(f"  HTTP {resp.status_code} | contadores de usuario antes={antes_f} depois={depois_f}")

print("=== limpeza ===")
apagadas = (
    db.query(LimiteRequisicao)
    .filter(
        LimiteRequisicao.chave.like("teste:%")
        | LimiteRequisicao.chave.like("login:%")
        | LimiteRequisicao.chave.like("registro:%")
    )
    .delete()
)
db.commit()
print(f"  contadores apagados: {apagadas}")
print(f"  sobram no banco: {db.query(LimiteRequisicao).count()}")
if depois > antes:
    criados = db.query(Usuario).filter(Usuario.email == "limite.teto@gmail.com").all()
    for u in criados:
        db.delete(u)
    db.commit()
    print(f"  conta de teste removida: {len(criados)}")
db.close()
