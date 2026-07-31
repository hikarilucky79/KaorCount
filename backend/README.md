# KaorCount API

Backend REST do aplicativo mobile de nutrição **KaorCount**, desenvolvido pela equipe Keenko.

## Stack

- **Python 3.11+**
- **FastAPI** — Framework web assíncrono
- **SQLAlchemy 2.0** — ORM
- **MySQL** — Banco de dados relacional
- **Alembic** — Migrações de schema
- **Pydantic v2** — Validação de dados
- **python-jose + passlib** — Autenticação JWT + bcrypt

## Estrutura de Pastas

```
backend/
├── app/
│   ├── core/          # Configuração, banco de dados, segurança
│   ├── models/        # Modelos SQLAlchemy (entidades)
│   ├── schemas/       # Schemas Pydantic (DTOs request/response)
│   ├── repositories/  # Camada de acesso a dados (CRUD)
│   ├── services/      # Lógica de negócio
│   ├── api/           # Routers/endpoints da API
│   └── main.py        # Entry point da aplicação
├── requirements.txt
├── .env.example
└── .gitignore
```

## Configuração

### Pré-requisitos
- Python 3.11+
- MySQL 8.0+ rodando em `localhost:3306`
- Criar banco de dados `kaorcount` no MySQL

```sql
CREATE DATABASE kaorcount CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Instalação e execução

**Opção 1 — Script .bat (Windows):**
```bash
cd backend
run.bat
```

**Opção 2 — Manual:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Editar .env com suas credenciais do MySQL e FatSecret
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Acesse:
- Documentacao Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`
