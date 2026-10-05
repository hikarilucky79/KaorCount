# ───────────────────────────────────────────────────────────────
# backend/audit_seguranca.py
# Auditoria de seguranca da API KaorCount:
#   1) Acesso SEM token — deve responder 401 (exceto /health,
#      /auth/registrar, /auth/login).
#   2) Autorizacao cruzada (IDOR) — usuario A com token nao deve
#      acessar dados do usuario B.
#
# Uso: uvicorn rodando e `python audit_seguranca.py`
#      base padrao: http://127.0.0.1:8010/api/v1
# ───────────────────────────────────────────────────────────────
import uuid

import httpx

BASE = "http://127.0.0.1:8010/api/v1"
ROOT = BASE.replace("/api/v1", "")

# Endpoints que precisam de auth (entrada representativa por rota).
PROTEGIDOS = [
    ("GET", "/alimentos/", None),
    ("GET", "/alimentos/buscar?nome=arroz", None),
    ("GET", "/usuarios/", None),  # usuario_router lista todos
    ("GET", "/perfil-nutri/00000000-0000-0000-0000-000000000001", None),
    ("GET", "/metas-nutri/usuario/00000000-0000-0000-0000-000000000001", None),
    ("GET", "/historico-progresso/usuario/00000000-0000-0000-0000-000000000001", None),
    ("GET", "/registro-agua/usuario/00000000-0000-0000-0000-000000000001", None),
    ("GET", "/refeicoes/usuario/00000000-0000-0000-0000-000000000001", None),
    ("GET", "/dashboard/usuario/00000000-0000-0000-0000-000000000001", None),
    ("GET", "/relatorios/usuario/00000000-0000-0000-0000-000000000001/dados"
            "?data_inicio=2024-01-01&data_fim=2024-01-02", None),
    ("GET", "/lembretes/config/00000000-0000-0000-0000-000000000001", None),
    ("GET", "/sugestoes/00000000-0000-0000-0000-000000000001", None),
    ("GET", "/fatsecret/buscar?nome=arroz", None),
]

# Endpoints publicos por design.
PUBLICOS = [
    ("GET", "/health", None),
    ("POST", "/auth/registrar", {"nome": "Auditor Teste", "email": f"audit-{uuid.uuid4().hex[:6]}@x.com", "senha": "audit123456"}),
    ("POST", "/auth/login", {"email": "ninguem@existe.com", "senha": "errada123"}),
]


def status_de(metodo, url, client, token=None, json=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        r = client.request(metodo, url, headers=headers, json=json, timeout=15)
        return r.status_code, r
    except Exception as e:
        return 0, None


def rotulo(metodo, path):
    return f"{metodo} {path}"


def main():
    client = httpx.Client()
    print("\n=== [1] Acesso SEM token (esperado 401 para protegidos) ===")
    falhas = 0
    for metodo, path, body in PROTEGIDOS:
        code, _ = status_de(metodo, BASE + path, client)
        aceito = code == 401
        if not aceito:
            falhas += 1
        print(f"  {rotulo(metodo, path):70s} -> {code}  {'OK' if aceito else 'VULNERAVEL'}")

    print("\n=== [1b] Publicos por design (esperado != 401) ===")
    for metodo, path, body in PUBLICOS:
        # ↓ /health fica na raiz; os endpoints de auth ficam em /api/v1
        url = (ROOT + path) if path == "/health" else (BASE + path)
        code, _ = status_de(metodo, url, client, json=body)
        print(f"  {rotulo(metodo, path):70s} -> {code}")

    print("\n=== [2] Autorizacao cruzada (IDOR): usuario A acessa dados do B ===")
    email_a = f"audit-a-{uuid.uuid4().hex[:6]}@x.com"
    email_b = f"audit-b-{uuid.uuid4().hex[:6]}@x.com"
    for e in (email_a, email_b):
        r = client.post(BASE + "/auth/registrar",
                        json={"nome": "Audit", "email": e, "senha": "audit123456"}, timeout=15)
        r.raise_for_status()
    token_a = client.post(BASE + "/auth/login",
                          json={"email": email_a, "senha": "audit123456"}, timeout=15).json()["access_token"]
    id_b = client.post(BASE + "/auth/login",
                       json={"email": email_b, "senha": "audit123456"}, timeout=15)
    # Pega o id do usuario B via /auth/me com o token dele mesmo
    token_b = id_b.json()["access_token"]
    me_b = client.get(BASE + "/auth/me", headers={"Authorization": f"Bearer {token_b}"}, timeout=15)
    id_b = me_b.json()["id_usuario"]

    alvo = BASE + f"/historico-progresso/usuario/{id_b}"
    code, resp = status_de("GET", alvo, client, token=token_a)
    if code == 200:
        print(f"  GET /historico-progresso/usuario/(id do B) -> 200  **IDOR** (vazou dados do B)")
        falhas += 1
    else:
        print(f"  GET /historico-progresso/usuario/(id do B) -> {code}  OK")

    alvo = BASE + f"/metas-nutri/usuario/{id_b}/atual"
    code, _ = status_de("GET", alvo, client, token=token_a)
    if code == 200:
        print(f"  GET /metas-nutri/usuario/(id do B)/atual -> 200  **IDOR**")
        falhas += 1
    else:
        print(f"  GET /metas-nutri/usuario/(id do B)/atual -> {code}  OK")

    alvo = BASE + f"/perfil-nutri/{id_b}"
    code, _ = status_de("GET", alvo, client, token=token_a)
    if code == 200:
        print(f"  GET /perfil-nutri/(id do B) -> 200  **IDOR**")
        falhas += 1
    else:
        print(f"  GET /perfil-nutri/(id do B) -> {code}  OK")

    alvo = BASE + f"/usuarios/{id_b}"
    code, _ = status_de("GET", alvo, client, token=token_a)
    if code == 200:
        print(f"  GET /usuarios/(id do B) -> 200  **IDOR**")
        falhas += 1
    else:
        print(f"  GET /usuarios/(id do B) -> {code}  OK")

    alvo = BASE + "/usuarios/"
    code, _ = status_de("GET", alvo, client, token=token_a)
    if code == 200:
        print(f"  GET /usuarios/ (lista TODOS) -> 200  **IDOR**")
        falhas += 1
    else:
        print(f"  GET /usuarios/ (lista TODOS) -> {code}  OK")

    print(f"\n=== RESULTADO: {falhas} vulnerabilidade(s) encontrada(s) ===\n")


if __name__ == "__main__":
    main()
