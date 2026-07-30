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

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

pip install -r requirements.txt

cp .env.example .env
# Editar .env com suas credenciais do MySQL

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Acesse a documentação interativa em `http://localhost:8000/docs`
