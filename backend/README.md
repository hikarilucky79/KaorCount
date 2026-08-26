# KaorCount API

Backend REST do aplicativo mobile de nutrição **KaorCount**, desenvolvido pela equipe Keenko como Projeto Integrador do Curso Técnico em Desenvolvimento de Sistemas.

A API centraliza o controle nutricional do usuário: cadastro e autenticação, perfil e metas nutricionais, registro de refeições com base de alimentos, cálculo automático de macronutrientes, controle de ingestão de água, histórico de progresso, sugestões de refeições, lembretes/notificações e dashboard de acompanhamento.

## Stack

- **Python 3.11+**
- **FastAPI** — Framework web assíncrono
- **SQLAlchemy 2.0** — ORM (camada repository)
- **MySQL 8.0+** — Banco de dados relacional
- **Alembic** — Migrações de schema (dependência disponível; criação via SQL no momento)
- **Pydantic v2 + pydantic-settings** — Validação de dados e configuração por ambiente
- **python-jose + passlib (bcrypt)** — Autenticação JWT
- **httpx** — Integração com a API externa FatSecret
- **uvicorn** — Servidor ASGI

## Arquitetura

O backend segue uma arquitetura em camadas, com separation of concerns clara:

```
Requisição HTTP
    │
    ▼
  Router (api/)        → define endpoints, valida com Depends(), delega ao service
    │
    ▼
  Service (services/)  → lógica de negócio, orquestra repositories, cálculos e regras
    │
    ▼
  Repository (repositories/) → acesso a dados via SQLAlchemy (CRUD genérico + específicos)
    │
    ▼
  Model (models/)      → entidades SQLAlchemy (tabelas do banco)
```

- **Schemas Pydantic** (`schemas/`) isolam os DTOs de request/response, separados dos models de banco.
- **BaseService / BaseRepository** oferecem CRUD genérico (buscar por id, criar, atualizar, deletar), estendidos pelas especializações.
- **Tratamento de exceções global** em `core/exceptions.py` para HTTPException, RequestValidationError, IntegrityError, DataError e OperationalError — respostas de erro padronizadas.
- **Segurança** em `core/security.py`: hash bcrypt, geração/validação de JWT e dependência `get_usuario_atual` que protege os endpoints autenticados.

## Estrutura de Pastas

```
backend/
├── app/
│   ├── core/              # Configuração, banco de dados, segurança, exceções
│   │   ├── config.py      # Settings (pydantic-settings, lê .env)
│   │   ├── database.py    # Engine + SessionLocal + get_db
│   │   ├── security.py    # JWT + bcrypt + get_usuario_atual
│   │   └── exceptions.py  # Handlers globais de exceção
│   ├── models/            # Modelos SQLAlchemy (entidades do banco)
│   ├── schemas/           # Schemas Pydantic (DTOs de request/response)
│   ├── repositories/      # Camada de acesso a dados (CRUD)
│   │   └── base.py        # BaseRepository genérico
│   ├── services/          # Lógica de negócio
│   │   ├── base_service.py
│   │   ├── nutricao_service.py   # Cálculo de TMB, calorias, macros
│   │   └── ...
│   ├── api/               # Routers/endpoints da API
│   └── main.py            # Entry point, CORS, registro de routers e handlers
├── banco_de_dados/        # Script SQL de criação das tabelas
│   └── banco.sql
├── requirements.txt
├── .env.example
├── .gitignore
└── run.bat                # Script de execução para Windows
```

## Configuração

### Pré-requisitos

- Python 3.11+
- MySQL 8.0+ rodando em `localhost:3306`
- (Opcional) Credenciais da API FatSecret para busca de alimentos externos

### Banco de dados

Crie o banco no MySQL e execute o script de criação das tabelas:

```sql
CREATE DATABASE kaorcount CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
mysql -u root -p kaorcount < banco_de_dados/banco.sql
```

### Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste os valores:

```
DATABASE_URL=mysql+pymysql://root:***@localhost:3306/kaorcount
SECRET_KEY=trocar-esta-chave-em-producao
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
API_V1_PREFIX=/api/v1
FATSECRET_CLIENT_ID=sua-client-id
FATSECRET_CLIENT_SECRET=seu-client-secret
```

### Instalação e execução

**Opção 1 — Script .bat (Windows):**

```bash
cd backend
run.bat
```

**Opção 2 — Manual (Linux/macOS):**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Opção 2 — Manual (Windows):**

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Acessos

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`
- Health check: `http://localhost:8000/health`
- Raiz: `http://localhost:8000/`

Todos os endpoints da API ficam sob o prefixo `/api/v1`.

## Autenticação

A autenticação usa JWT (Bearer token). O fluxo:

1. `POST /api/v1/auth/registrar` — cria o usuário e retorna os dados
2. `POST /api/v1/auth/login` — valida credenciais e retorna `{ access_token, token_type: "bearer" }`
3. Endpoints protegidos exigem o header `Authorization: Bearer <token>`

A dependência `get_usuario_atual` decodifica o token, carrega o usuário e bloqueia contas inativas (`status_conta != "ativo"` → 403).

## Endpoints

Todos os endpoints abaixo estão sob `/api/v1`. Exceto `auth/registrar` e `auth/login`, todos exigem autenticação via Bearer token.

### Autenticação (`/auth`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/registrar` | Cadastra um novo usuário (RF01) |
| POST | `/auth/login` | Autentica e retorna o JWT (RF01) |
| GET | `/auth/me` | Retorna o usuário autenticado pelo token |

### Usuários (`/usuarios`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/usuarios/` | Lista usuários (paginado) |
| GET | `/usuarios/{id_usuario}` | Busca usuário por id |
| PUT | `/usuarios/{id_usuario}` | Atualiza usuário |
| PATCH | `/usuarios/{id_usuario}/status` | Desativa conta |
| DELETE | `/usuarios/{id_usuario}` | Remove usuário |

### Perfil Nutricional (`/perfil-nutri`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/perfil-nutri/{id_usuario}` | Busca perfil do usuário |
| POST | `/perfil-nutri/` | Cria perfil nutricional (RF01) |
| PUT | `/perfil-nutri/{id_usuario}` | Atualiza perfil |
| DELETE | `/perfil-nutri/{id_usuario}` | Remove perfil |

### Metas Nutricionais (`/metas-nutri`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/metas-nutri/usuario/{id_usuario}` | Lista metas do usuário |
| GET | `/metas-nutri/usuario/{id_usuario}/atual` | Meta vigente (mais recente) (RF04) |
| GET | `/metas-nutri/{id_meta}` | Busca meta por id |
| POST | `/metas-nutri/` | Cria meta nutricional (RF04) |
| PUT | `/metas-nutri/{id_meta}` | Atualiza meta |
| DELETE | `/metas-nutri/{id_meta}` | Remove meta |

### Alimentos (`/alimentos`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/alimentos/` | Lista alimentos (paginado) |
| GET | `/alimentos/buscar?nome=...` | Busca alimentos por nome (RF02) |
| GET | `/alimentos/{id_alimento}` | Busca alimento por id |
| POST | `/alimentos/` | Cadastra alimento |
| PUT | `/alimentos/{id_alimento}` | Atualiza alimento |
| DELETE | `/alimentos/{id_alimento}` | Remove alimento |

### FatSecret — Base externa (`/fatsecret`)

Integração com a API FatSecret para enriquecer a base de alimentos:

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/fatsecret/buscar?nome=...` | Busca alimentos na base externa |
| GET | `/fatsecret/alimento/{food_id}` | Detalhes de um alimento externo |
| POST | `/fatsecret/importar/{food_id}` | Importa alimento externo para a base local |

### Refeições (`/refeicoes`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/refeicoes/usuario/{id_usuario}` | Lista refeições do usuário (paginado) |
| GET | `/refeicoes/usuario/{id_usuario}/periodo` | Refeições por período (data_inicio, data_fim) (RF06) |
| GET | `/refeicoes/usuario/{id_usuario}/dia/{data}` | Refeições de um dia específico |
| GET | `/refeicoes/usuario/{id_usuario}/dia/{data}/macros` | Resumo de macros consumidos no dia (RF03) |
| GET | `/refeicoes/{id_refeicao}` | Busca refeição por id |
| POST | `/refeicoes/` | Cria refeição (RF02) |
| PUT | `/refeicoes/{id_refeicao}` | Atualiza refeição |
| DELETE | `/refeicoes/{id_refeicao}` | Remove refeição |
| GET | `/refeicoes/{id_refeicao}/itens` | Lista itens de uma refeição |
| POST | `/refeicoes/{id_refeicao}/itens` | Adiciona item (alimento + quantidade) a uma refeição (RF02) |
| PUT | `/refeicoes/itens/{id_item}` | Atualiza item |
| DELETE | `/refeicoes/itens/{id_item}` | Remove item |

O cálculo de macros por item (`NutricaoService.calcular_macros_item`) ajusta calorias e macronutrientes proporcionalmente à quantidade em gramas vs. a porção padrão do alimento.

### Registro de Água (`/registro-agua`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/registro-agua/usuario/{id_usuario}` | Lista registros de água (paginado) |
| GET | `/registro-agua/usuario/{id_usuario}/total/{data}` | Total de ml ingerido em um dia |
| GET | `/registro-agua/usuario/{id_usuario}/periodo` | Registros por período (data_inicio, data_fim) |
| POST | `/registro-agua/` | Cria registro de água |
| PUT | `/registro-agua/{id_registro}` | Atualiza registro |
| DELETE | `/registro-agua/{id_registro}` | Remove registro |

### Histórico de Progresso (`/historico-progresso`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/historico-progresso/usuario/{id_usuario}` | Lista histórico (paginado) (RF06) |
| GET | `/historico-progresso/usuario/{id_usuario}/periodo` | Histórico por período |
| GET | `/historico-progresso/{id_progresso}` | Busca registro por id |
| POST | `/historico-progresso/` | Cria registro de progresso (peso/altura) |
| PUT | `/historico-progresso/{id_progresso}` | Atualiza registro |
| DELETE | `/historico-progresso/{id_progresso}` | Remove registro |

### Sugestões de Refeições (`/sugestoes`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/sugestoes/gerar/{id_usuario}` | Gera sugestões do dia com base na meta (RF07) |
| GET | `/sugestoes/{id_usuario}` | Lista sugestões do usuário (paginado) |
| POST | `/sugestoes/aceitar/{id_sugestao}` | Marca uma sugestão como aceita |

As sugestões distribuem as calorias e macros da meta entre as refeições do dia (25% café, 35% almoço, 30% jantar, 10% lanche).

### Lembretes e Notificações (`/lembretes`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/lembretes/config/{id_usuario}` | Busca configuração de lembretes do usuário (RF08) |
| PUT | `/lembretes/config/{id_usuario}/agua` | Configura intervalo e meta diária de água |
| PUT | `/lembretes/config/{id_usuario}/refeicoes` | Configura horários de lembrete das refeições |
| POST | `/lembretes/config/{id_usuario}/ativar` | Ativa lembretes |
| POST | `/lembretes/config/{id_usuario}/desativar` | Desativa lembretes |

### Dashboard (`/dashboard`)

Visão consolidada do acompanhamento nutricional do usuário (RF05):

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/dashboard/usuario/{id_usuario}` | Resumo diário: macros consumidos vs meta, percentual de água, refeições registradas e streak de dias consecutivos com registro |
| GET | `/dashboard/usuario/{id_usuario}/semana` | Calorias consumidas por dia nos últimos 7 dias + total de água |
| GET | `/dashboard/usuario/{id_usuario}/mes` | Calorias consumidas por dia nos últimos 31 dias + total de água |
| GET | `/dashboard/usuario/{id_usuario}/evolucao-peso` | Histórico de peso em ordem cronológica |

Exemplo de resposta do resumo diário:

```json
{
  "data": "2026-08-04",
  "meta_definida": true,
  "macros": {
    "consumido": { "calorias": 400.0, "carboidratos": 40.0, "proteinas": 20.0, "gorduras": 10.0 },
    "meta":      { "calorias": 2000, "carboidratos": 250, "proteinas": 150, "gorduras": 44 },
    "restante":  { "calorias": 1600.0, "carboidratos": 210.0, "proteinas": 130.0, "gorduras": 34.0 },
    "percentual": 20.0,
    "percentual_por_macronutriente": { "carboidratos": 16.0, "proteinas": 13.3, "gorduras": 22.7 }
  },
  "agua": {
    "consumido_ml": 1500.0,
    "meta_ml": 2500.0,
    "restante_ml": 1000.0,
    "percentual": 60.0
  },
  "refeicoes_registradas": 1,
  "streak_dias": 3
}
```

## Cálculos nutricionais

O `NutricaoService` centraliza a fisiologia nutricional:

- **TMB (Taxa Metabólica Basal)** — fórmula de Mifflin-St Jeor, diferenciada por sexo
- **Calorias diárias** — TMB × fator de atividade × ajuste por objetivo (perder/manter/ganhar)
- **Macros por objetivo** — distribuição percentual de carboidrato/proteína/gordura conforme objetivo
- **Macros por item** — proporcional à quantidade em gramas vs. porção padrão do alimento

## Modelo de dados

As tabelas são criadas via `banco_de_dados/banco.sql`. Principais entidades:

- `USUARIOS` — usuários (id, nome, email, senha, status da conta)
- `PERFIL_NUTRI` — perfil antropométrico e objetivo (1:1 com usuário)
- `META_NUTRI` — metas calóricas e de macros por data (1:N com usuário)
- `REGISTRO_AGUA` — ingestão de água por dia (1:N com usuário)
- `HISTORICO_PROGRESSO` — peso e altura ao longo do tempo (1:N com usuário)
- `REFEICOES` — refeições por dia/tipo (1:N com usuário)
- `ALIMENTOS` — base de alimentos (nome, macros, porção padrão, origem)
- `ITEM_REFEICAO` — itens de uma refeição (N:M entre REFEICOES e ALIMENTOS, com quantidade em gramas)
- `LEMBRETE_CONFIG` — configuração de lembretes por usuário (1:1)

Todas as chaves estrangeiras usam `ON DELETE CASCADE` para integridade referencial.

## Tratamento de erros

Respostas de erro padronizadas (formato JSON):

```json
{ "erro": true, "status": 404, "detail": "Refeição não encontrada", "path": "/api/v1/refeicoes/..." }
```

| Status | Causa |
|--------|-------|
| 400 | Dados inválidos para o banco (DataError) |
| 401 | Credenciais inválidas / token ausente ou expirado |
| 403 | Conta inativa |
| 404 | Recurso não encontrado |
| 409 | Violação de integridade (duplicidade, etc.) |
| 422 | Erro de validação de payload (com lista de erros por campo) |
| 503 | Erro de conexão com o banco de dados |

## Mapeamento para Requisitos Funcionais

| RF  | Descrição | Onde está |
|-----|-----------|-----------|
| RF01 | Cadastro e autenticação com perfil | `/auth`, `/usuarios`, `/perfil-nutri` |
| RF02 | Registro de refeições com busca de alimentos | `/refeicoes`, `/alimentos`, `/fatsecret` |
| RF03 | Cálculo automático de macros e calorias | `NutricaoService`, `/refeicoes/.../macros` |
| RF04 | Definição de metas nutricionais | `/metas-nutri` |
| RF05 | Dashboard com visualização de progresso | `/dashboard` |
| RF06 | Histórico alimentar com filtros por período | `/refeicoes/.../periodo`, `/historico-progresso` |
| RF07 | Sugestões de refeições por perfil/meta | `/sugestoes`, `SugestaoService` |
| RF08 | Notificações e lembretes | `/lembretes`, `LembreteService` |
