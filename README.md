# KaorCount

<p align="center">
  <img src="./assets/KaorCount.png" alt="Logo do KaorCount" width="180" />
</p>

**Aplicativo mobile de nutrição da Keenko** — controle de calorias, macronutrientes,
ingestão de água e evolução de peso em uma interface simples, sem jargão técnico.

Projeto Integrador do Curso Técnico em Desenvolvimento de Sistemas do
**Centro Estadual de Educação Profissional de Curitiba**.

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Stack tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Subindo com Docker (recomendado)](#subindo-com-docker-recomendado)
- [Publicando em produção](#publicando-em-produção)
- [Rodando localmente sem Docker](#rodando-localmente-sem-docker)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Documentação da API](#documentação-da-api)
- [Endpoints](#endpoints)
- [Banco de dados](#banco-de-dados)
- [CI/CD (GitHub Actions)](#cicd-github-actions)
- [Backend na Vercel (sem Docker)](#backend-na-vercel-sem-docker)
- [Mapeamento dos requisitos funcionais](#mapeamento-dos-requisitos-funcionais)
- [Equipe](#equipe)

---

## Sobre o projeto

Cuidar da alimentação não deveria exigir conhecimento técnico em nutrição. A maioria
dos aplicativos de dieta é complexa, cheia de termos técnicos e não incentiva a
manutenção da rotina.

O **KaorCount** nasce para mudar isso. O app centraliza em um só lugar:

- cadastro e perfil nutricional;
- registro de refeições com busca de alimentos;
- cálculo automático de calorias e macronutrientes;
- metas nutricionais ajustáveis por período;
- controle de ingestão de água;
- histórico de progresso e relatórios em PDF;
- sugestões de refeições e lembretes.

### Sobre a Keenko

Fundada em 27 de fevereiro de 2025, a Keenko é uma HealthTech brasileira focada em
transformar a relação das pessoas com o bem-estar através da tecnologia. A proposta é
democratizar o acesso a uma vida saudável, devolvendo às pessoas a autonomia sobre a
sua rotina nutricional ao transformar hábitos complexos em fluxos simples, práticos e
acessíveis.

- **Missão** — democratizar o acesso a uma vida saudável devolvendo autonomia sobre a
  rotina nutricional.
- **Visão** — tornar-se a principal referência nacional em alimentação e bem-estar
  mediados por tecnologia.
- **Valores** — autonomia do usuário, precisão científica, simplicidade,
  democratização da saúde e personalização real.

> O site institucional da Keenko também faz parte deste repositório e é servido pela
> própria API em `/` — veja [`backend/public/`](./backend/public/).

---

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Autenticação** | Cadastro, login e JWT (HS256) emitidos pelo próprio backend |
| **Perfil nutricional** | Data de nascimento, gênero, objetivo (perder/manter/ganhar) e nível de atividade |
| **Metas nutricionais** | Calorias e macros por período, com TMB calculada pela fórmula de Mifflin-St Jeor |
| **Refeições** | Registro por tipo (café, almoço, lanche, jantar) com itens e quantidades em gramas |
| **Base de alimentos** | Tabela local, busca integrada ao FatSecret e consulta à Tabela TACO (UNICAMP) |
| **Cálculo de macros** | Calorias e macros proporcionais à quantidade vs. a porção padrão do alimento |
| **Registro de água** | Meta diária, consumo por período e percentual de acompanhamento |
| **Dashboard** | Resumo do dia, série semanal e mensal de calorias, evolução de peso e streak de dias |
| **Histórico de progresso** | Peso e altura ao longo do tempo, com filtros por período |
| **Sugestões** | Refeições geradas a partir da meta, distribuídas em 25/35/10/30% entre as refeições |
| **Lembretes** | Configuração de intervalos de água e horários das refeições |
| **Relatórios** | Exportação do progresso em PDF ou JSON |

---

## Stack tecnológica

### Mobile / Web (frente)

| Tecnologia | Versão | Uso |
|---|---|---|
| Expo | `~54.0.37` | Plataforma e build do app |
| React Native | `0.81.5` | Runtime do app mobile |
| React | `19.1.0` | Biblioteca base |
| React Native Web | `^0.21.2` | Build web (usado no Docker) |
| React Navigation | `*` | Navegação stack + bottom tabs |
| React Native Paper | `4.9.2` | Componentes de UI |
| lucide-react-native | `*` | Ícones SVG |
| Axios | `^1.20.0` | Cliente HTTP com interceptors |
| AsyncStorage | `^2.2.0` | Persistência de sessão no dispositivo |

### Backend

| Tecnologia | Versão | Uso |
|---|---|---|
| Python | `3.11+` | Linguagem |
| FastAPI | `0.141.1` | Framework web assíncrono |
| Uvicorn | `0.52.0` | Servidor ASGI |
| SQLAlchemy | `2.0.51` | ORM |
| MySQL | `8.0+` | Banco de dados relacional |
| Pydantic | `2.13.4` | Validação de dados |
| pydantic-settings | `2.14.2` | Configuração por ambiente |
| python-jose | `3.5.0` | Geração e validação de JWT |
| passlib / bcrypt | `1.7.4` | Hash de senhas |
| httpx | `0.28.1` | Integração com APIs externas (FatSecret, TACO) |
| reportlab | `4.4.4` | Geração dos relatórios em PDF |

### Infraestrutura

| Tecnologia | Uso |
|---|---|
| Docker + Compose | Orquestração dos 3 serviços (MySQL, API, web) |
| Nginx | Servidor de assets estáticos e proxy reverso para a API |

---

## Arquitetura

O backend segue uma arquitetura em camadas, com separation of concerns clara:

```
Requisição HTTP
    │
    ▼
  Router (api/)               → define endpoints, valida com Depends(), delega ao service
    │
    ▼
  Service (services/)         → lógica de negócio, orquestra repositories, cálculos e regras
    │
    ▼
  Repository (repositories/) → acesso a dados via SQLAlchemy (CRUD genérico + específicos)
    │
    ▼
  Model (models/)             → entidades SQLAlchemy (tabelas do banco)
```

- **Schemas Pydantic** (`schemas/`) isolam os DTOs de request/response dos models de banco.
- **BaseService / BaseRepository** oferecem CRUD genérico, estendido pelas especializações.
- **Tratamento global de exceções** em `core/exceptions.py` — respostas de erro padronizadas.
- **Segurança** em `core/security.py` — hash bcrypt, JWT e `get_usuario_atual`.

### Diagrama do ambiente Docker

```
                    ┌─────────────────────────────┐
   Navegador ──────►│  web  (nginx + Expo build)  │
   :8080            │  serve o bundle estático    │
                    └──────────────┬──────────────┘
                                   │ proxy /api, /docs, /health
                                   ▼
                    ┌─────────────────────────────┐
                    │      api  (FastAPI)         │
   :8000 ──────────►│  uvicorn + SQLAlchemy      │
                    └──────────────┬──────────────┘
                                   │ mysql+pymysql
                                   ▼
                    ┌─────────────────────────────┐
                    │    db  (MySQL 8.0)          │
   :3306 ──────────►│  volume: db_data            │
                    └─────────────────────────────┘
```

O bundle web é compilado com `EXPO_PUBLIC_API_URL=/api/v1`, então o navegador fala
com o nginx na mesma origem e o nginx repassa para a API. Isso evita CORS e faz o app
funcionar em uma única porta.

---

## Estrutura de pastas

```
KaorCount/
├── App.js                     # Raiz do app: providers, stack e bottom tabs
├── index.js                   # Entry point registrado no app.json
├── app.json                   # Configuração do Expo
├── metro.config.js            # Config do Metro + shim de gesture-handler no web
├── src/
│   ├── api/                   # Clientes HTTP por domínio (auth, refeicao, metaNutri, ...)
│   ├── auth/                  # Leitura do token no AsyncStorage
│   ├── components/            # Componentes reutilizáveis
│   ├── constants/             # Paleta de cores
│   ├── contexts/              # AuthContext e ThemeContext
│   ├── hooks/                 # useAuth, useTheme, useResponsive
│   ├── screens/               # Auth, Home, DiarioAlimentar, Perfil, Configuracao
│   └── util/                  # Helpers de responsividade e validações
├── assets/                    # Ícones e imagens do app
├── backend/
│   ├── app/
│   │   ├── core/              # config, database, security, exceptions
│   │   ├── models/            # Entidades SQLAlchemy
│   │   ├── schemas/           # DTOs Pydantic
│   │   ├── repositories/      # Camada de acesso a dados
│   │   ├── services/          # Lógica de negócio
│   │   ├── api/               # Routers
│   │   └── main.py            # Entry point, CORS, routers e handlers
│   ├── banco_de_dados/        # Script SQL legado (ver observação em Banco de dados)
│   ├── public/                # Site institucional da Keenko (HTML/CSS/JS)
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── docker/
│   ├── nginx.conf             # Servidor estático + proxy reverso
│   └── Caddyfile              # HTTPS automático (produção)
├── Documentação/              # Documentos acadêmicos do projeto
├── docker-compose.yml         # Stack de desenvolvimento
├── docker-compose.prod.yml    # Stack de produção (Caddy + travas)
├── Dockerfile                 # Build do bundle web (multi-stage)
├── package.json
├── package-lock.json          # Versões travadas (versionado de propósito)
├── .dockerignore
├── run.sh                     # Launcher (Linux/macOS/WSL)
└── run.bat                    # Launcher (Windows)
```

### Arquivos de configuração

| Arquivo | Versionado? | Para quê |
|---|---|---|
| `.env.example` | ✅ sim | Template de **desenvolvimento** |
| `.env` | ❌ não | Suas configurações locais (crie com `cp .env.example .env`) |
| `.env.prod.example` | ✅ sim | Template de **produção** |
| `.env.prod` | ❌ não | Segredos reais de produção (crie com `cp .env.prod.example .env.prod`) |
| `backend/.env.example` | ✅ sim | Template da API rodando **fora** do Docker |
| `backend/.env` | ❌ não | Config local do pydantic |

**Por que `.env` e `.env.prod` são separados:**

1. **Segredos não convivem com público.** O Expo embute no bundle do navegador toda
   variável `EXPO_PUBLIC_*` — elas viram texto público no JavaScript. Misturar
   `SECRET_KEY` e `EXPO_PUBLIC_API_URL` no mesmo arquivo versionado deixa um
   `Ctrl+C` de distância de um acidente.
2. **Dev e produção não se misturam.** Um arquivo só faz `./run.sh up` (SQLite, porta
   8080) e `./run.sh prod` (HTTPS, banco real) compartilharem senha — e é fácil subir
   com a senha errada.
3. **Permissões diferentes.** O Compose de produção recebe `.env.prod` via
   `--env-file`, então nada do seu ambiente local encosta no servidor.

> Os `.gitignore` e `.dockerignore` usam exatamente as mesmas regras (verificado),
> para que nenhum `.env` vaze para o Git **ou** para dentro de uma imagem.

---

## Subindo com Docker (recomendado)

### Pré-requisitos

- [Docker Desktop](https://docs.docker.com/get-docker/) instalado e **rodando**
- Docker Compose v2 (incluso no Docker Desktop)

> No Windows é necessário o **WSL 2** habilitado. Se `docker info` reclamar de WSL,
> execute `wsl --install` em um PowerShell administrativo e reinicie o computador.

### Subindo tudo

```bash
# Linux / macOS / WSL
./run.sh

# Windows
run.bat
```

Ou, direto com o Compose:

```bash
docker compose up -d --build
```

O script detecta automaticamente se o Docker Compose v2 (`docker compose`) ou o v1
(`docker-compose`) está disponível.

### Acessos

| Serviço | URL |
|---|---|
| **App** | http://localhost:8080 |
| **API (Swagger UI)** | http://localhost:8000/docs |
| **API (ReDoc)** | http://localhost:8000/redoc |
| **Health check** | http://localhost:8000/health |
| **Site da Keenko** | http://localhost:8000/ |
| **MySQL** | `localhost:3306` (user `kaorcount` / senha `kaorcount`) |

### Comandos úteis

```bash
./run.sh status    # estado dos containers
./run.sh logs      # acompanha os logs
./run.sh down      # derruba (mantém os dados)
./run.sh reset     # derruba e APAGA o banco
./run.sh build     # apenas reconstrói as imagens
```

O mesmo vale para `run.bat` no Windows.

### Sobre o app mobile no Docker

O Docker serve a **versão web** do app — o mesmo bundle gerado por
`npx expo export --platform web`. Emuladores Android e dispositivos iOS **não rodam
dentro de containers**; para testar no celular, use o modo local com Expo Go:

```bash
npm ci
npm start
```

Escaneie o QR code com o app **Expo Go**. A URL da API é detectada automaticamente
pelo IP da rede local (veja [`src/api/client.js`](./src/api/client.js)).

---

## Rodando localmente sem Docker

### 1. Backend

**Pré-requisitos:** Python 3.11+ e MySQL 8.0+ rodando.

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env        # Windows
# cp .env.example .env        # Linux / macOS

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> No Windows há também o atalho `run.bat`, que ativa o venv e sobe o servidor.

As tabelas são criadas automaticamente por `Base.metadata.create_all()` na inicialização.
Se o MySQL estiver indisponível, o backend cai para um SQLite local
(`sqlite:///./kaorcount.db`) e imprime um aviso — útil para desenvolvimento rápido,
mas **não** use em produção.

### 2. App mobile / web

**Pré-requisitos:** Node.js 20+.

```bash
npm ci        # instala exatamente as versões do package-lock.json

npm start      # Metro / Expo Go (celular)
npm run web    # abre no navegador
npm run android
npm run ios
```

> Use **`npm ci`**, não `npm install`. O `package-lock.json` é versionado justamente
> para travar as versões: é ele que garante que você, os colegas e o servidor
> rodem o mesmo ambiente. O `Dockerfile` também usa `npm ci`.
>
> Se o app quebrar com erro de módulo faltando depois de mexer em dependências,
> reinstale do zero:
>
> ```bash
> rm -rf node_modules package-lock.json   # Windows: rmdir /s /q node_modules
> npm install                              # regenera o lock
> ```

A URL da API é resolvida automaticamente conforme a plataforma:

| Ambiente | URL da API |
|---|---|
| Navegador (web) | `http://localhost:8000/api/v1` |
| Expo Go (celular) | `http://<IP-da-rede>:8000/api/v1` (detectado via `hostUri`) |
| Emulador Android | `http://10.0.2.2:8000/api/v1` |
| Docker | `/api/v1` (proxy via nginx) |

Para sobrepor esse comportamento, defina `EXPO_PUBLIC_API_URL` no `.env`.

---

## Variáveis de ambiente

Copie `.env.example` para `.env` na raiz. **Todas têm valor padrão**, então o `.env` é
opcional — mas é recomendado para customizar portas e senhas.

> ⚠️ O `.env` **não** entra no Git nem nas imagens Docker. Para produção, use
> `.env.prod` (veja [Publicando em produção](#publicando-em-produção)) — é um arquivo
> separado justamente para não misturar segredo de produção com configuração local.

### Docker Compose

| Variável | Padrão | Descrição |
|---|---|---|
| `WEB_PORT` | `8080` | Porta do app web no host |
| `API_PORT` | `8000` | Porta da API no host |
| `DB_PORT` | `3306` | Porta do MySQL no host |
| `DB_NAME` | `kaorcount` | Nome do banco de dados |
| `DB_USER` | `kaorcount` | Usuário do banco |
| `DB_PASSWORD` | `kaorcount` | Senha do banco |
| `DB_ROOT_PASSWORD` | `kaorcount_root` | Senha do root do MySQL |
| `SECRET_KEY` | `trocar-esta-chave-em-producao` | Chave de assinatura do JWT |

> ⚠️ **Troque o `SECRET_KEY` antes de qualquer uso real.**
> Gere uma nova com: `python -c "import secrets; print(secrets.token_urlsafe(48))"`

### Produção (`.env.prod.example`)

Variáveis exigidas pelo `docker-compose.prod.yml`, que recebe esse arquivo via
`--env-file`. Se alguma faltar, o `docker compose` falha na hora com mensagem
explicativa.

| Variável | Descrição |
|---|---|
| `CADDY_DOMAIN` | Domínio que receberá o HTTPS. O DNS precisa apontar para o servidor |
| `ACME_EMAIL` | E-mail para avisos do Let's Encrypt sobre o certificado |
| `CORS_ORIGINS` | Domínios liberados no CORS, separados por vírgula |
| `SECRET_KEY` | **Obrigatória.** Chave de assinatura do JWT — a API recusa subir em produção se ela for a padrão do repositório ou tiver menos de 32 caracteres |
| `DB_PASSWORD` | **Obrigatória.** Senha do usuário do banco |
| `DB_ROOT_PASSWORD` | **Obrigatória.** Senha do root do MySQL |

### Backend

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `mysql+pymysql://root:senha@localhost:3306/kaorcount` | String de conexão |
| `SECRET_KEY` | `trocar-esta-chave-em-producao` | Chave de assinatura do JWT |
| `ALGORITHM` | `HS256` | Algoritmo do JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Validade do token |
| `API_V1_PREFIX` | `/api/v1` | Prefixo de todas as rotas |
| `FATSECRET_CLIENT_ID` | vazio | Credencial da API FatSecret |
| `FATSECRET_CLIENT_SECRET` | vazio | Credencial da API FatSecret |
| `ENVIRONMENT` | `development` | `production` ativa as travas de segurança |
| `CORS_ORIGINS` | vazio | Domínios permitidos no CORS (obrigatório em produção) |

### App (Expo)

| Variável | Padrão | Descrição |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | vazio | Sobrescreve a URL da API (ex.: `/api/v1` ou `https://api.exemplo.com/api/v1`) |

As variáveis `EXPO_PUBLIC_*` são **embutidas no bundle em tempo de build** — mudar uma
delas exige rebuild.

### Autenticação

A autenticação é **100% local**, sem provedor externo:

1. O app envia e-mail e senha para `POST /api/v1/auth/login`.
2. O backend confere a senha com **bcrypt** e devolve um **JWT HS256**.
3. O token fica salvo no `AsyncStorage` e é injetado automaticamente
   em toda requisição pelo interceptor do `src/api/client.js`.

Endpoints disponíveis:

| Endpoint | Uso |
|---|---|
| `POST /api/v1/auth/registrar` | Cria a conta (nome, e-mail e senha) |
| `POST /api/v1/auth/login` | Valida a senha e emite o token |
| `GET  /api/v1/auth/me` | Devolve o perfil do usuário logado |

As senhas nunca saem do banco: são armazenadas apenas como hash bcrypt,
e o `SECRET_KEY` que assina o token é uma variável de ambiente.

> ⚠️ **Migração obrigatória no banco.** O Auth0 foi removido do código, mas
> as colunas `auth0_sub` e `auth0_email_verified` podem continuar existindo
> em bancos já criados. Como `auth0_email_verified` é `NOT NULL` sem valor
> padrão, o `INSERT` de novos usuários passa a falhar e o cadastro passa a
> responder **409**. Rode **uma vez** o script
> [`backend/banco_de_dados/migracao_remover_auth0.sql`](backend/banco_de_dados/migracao_remover_auth0.sql)
> em todo banco que já tenha a tabela `usuario` (MySQL de produção e o
> SQLite local). Bancos novos, criados a partir do `banco.sql` já
> atualizado, não precisam do script.

> ⚠️ **Migração obrigatória (Auth0 removido).** Quem já tinha o banco criado
> precisa remover as colunas `auth0_sub` e `auth0_email_verified` da tabela
> `usuario`. Sem isso o cadastro falha com `409`, porque
> `auth0_email_verified` é `NOT NULL` e o código não a preenche mais.
>
> ```bash
> mysql -u USER -p NOME_DO_BANCO < backend/banco_de_dados/migracao_remover_auth0.sql
> ```
>
> Bases novas já nascem corretas a partir de `banco.sql`.

---

## Documentação da API

| Recurso | URL |
|---|---|
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| OpenAPI JSON | http://localhost:8000/openapi.json |
| Health check | http://localhost:8000/health |

Todos os endpoints ficam sob o prefixo `/api/v1`. Exceto `auth/registrar` e
`auth/login`, todos exigem o header:

```
Authorization: Bearer <token>
```

### Autenticação

A dependência `get_usuario_atual` decodifica o token, carrega o usuário e bloqueia
contas inativas (`status_conta != "ativo"` → `403`).

```bash
# 1. Cadastrar
curl -X POST http://localhost:8000/api/v1/auth/registrar \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria","email":"maria@email.com","senha":"senha123"}'

# 2. Login (retorna { "access_token": "...", "token_type": "bearer" })
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@email.com","senha":"senha123"}'

# 3. Usar o token
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## Endpoints

### Autenticação (`/auth`)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/registrar` | Cadastra um novo usuário |
| POST | `/auth/login` | Autentica e retorna o JWT |
| GET | `/auth/me` | Retorna o usuário autenticado |

### Usuários (`/usuarios`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/usuarios/` | Lista usuários (paginado) |
| GET | `/usuarios/{id_usuario}` | Busca usuário por id |
| PUT | `/usuarios/{id_usuario}` | Atualiza usuário |
| PATCH | `/usuarios/{id_usuario}/status` | Altera o status da conta |
| DELETE | `/usuarios/{id_usuario}` | Remove usuário |

### Perfil nutricional (`/perfil-nutri`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/perfil-nutri/{id_usuario}` | Busca perfil do usuário |
| POST | `/perfil-nutri/` | Cria perfil nutricional |
| PUT | `/perfil-nutri/{id_usuario}` | Atualiza perfil |
| DELETE | `/perfil-nutri/{id_usuario}` | Remove perfil |

### Metas nutricionais (`/metas-nutri`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/metas-nutri/usuario/{id_usuario}` | Lista metas do usuário |
| GET | `/metas-nutri/usuario/{id_usuario}/atual` | Meta vigente (mais recente) |
| GET | `/metas-nutri/{id_meta}` | Busca meta por id |
| POST | `/metas-nutri/` | Cria meta nutricional |
| PUT | `/metas-nutri/{id_meta}` | Atualiza meta |
| DELETE | `/metas-nutri/{id_meta}` | Remove meta |

### Alimentos (`/alimentos`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/alimentos/` | Lista alimentos (paginado) |
| GET | `/alimentos/buscar?nome=...` | Busca alimentos por nome |
| GET | `/alimentos/{id_alimento}` | Busca alimento por id |
| POST | `/alimentos/` | Cadastra alimento |

Sem `PUT` nem `DELETE`: o catálogo é compartilhado entre os usuários, então editar ou remover um alimento alteraria refeições já registradas por outras contas. A API aceita apenas inclusão.

### Bases externas (FatSecret e TACO)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/fatsecret/buscar?nome=...` | Busca alimentos na base externa |
| GET | `/fatsecret/alimento/{food_id}` | Detalhes de um alimento externo |
| POST | `/fatsecret/importar/{food_id}` | Importa alimento externo para a base local |

### Refeições (`/refeicoes`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/refeicoes/usuario/{id_usuario}` | Lista refeições do usuário |
| GET | `/refeicoes/usuario/{id_usuario}/dia/{data}` | Refeições de um dia |
| GET | `/refeicoes/usuario/{id_usuario}/dia/{data}/macros` | Resumo de macros do dia |
| GET | `/refeicoes/usuario/{id_usuario}/periodo` | Refeições por período |
| GET | `/refeicoes/{id_refeicao}` | Busca refeição por id |
| POST | `/refeicoes/` | Cria refeição |
| PUT | `/refeicoes/{id_refeicao}` | Atualiza refeição |
| DELETE | `/refeicoes/{id_refeicao}` | Remove refeição |
| GET | `/refeicoes/{id_refeicao}/itens` | Lista itens de uma refeição |
| POST | `/refeicoes/{id_refeicao}/itens` | Adiciona item (alimento + quantidade) |
| PUT | `/refeicoes/itens/{id_item}` | Atualiza item |
| DELETE | `/refeicoes/itens/{id_item}` | Remove item |

### Registro de água (`/registro-agua`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/registro-agua/usuario/{id_usuario}` | Lista registros (paginado) |
| GET | `/registro-agua/usuario/{id_usuario}/total/{data}` | Total de ml no dia |
| GET | `/registro-agua/usuario/{id_usuario}/periodo` | Registros por período |
| POST | `/registro-agua/` | Cria registro |
| PUT | `/registro-agua/{id_registro}` | Atualiza registro |
| DELETE | `/registro-agua/{id_registro}` | Remove registro |

### Histórico de progresso (`/historico-progresso`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/historico-progresso/usuario/{id_usuario}` | Lista histórico (paginado) |
| GET | `/historico-progresso/usuario/{id_usuario}/periodo` | Histórico por período |
| GET | `/historico-progresso/{id_progresso}` | Busca registro por id |
| POST | `/historico-progresso/` | Cria registro de peso/altura |
| PUT | `/historico-progresso/{id_progresso}` | Atualiza registro |
| DELETE | `/historico-progresso/{id_progresso}` | Remove registro |

### Sugestões (`/sugestoes`)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/sugestoes/gerar/{id_usuario}` | Gera sugestões do dia com base na meta |
| GET | `/sugestoes/{id_usuario}` | Lista sugestões (paginado) |
| POST | `/sugestoes/aceitar/{id_sugestao}` | Marca uma sugestão como aceita |

As sugestões distribuem as calorias da meta em 25% café, 35% almoço, 30% jantar e 10% lanche.

### Lembretes (`/lembretes`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/lembretes/config/{id_usuario}` | Configuração de lembretes |
| PUT | `/lembretes/config/{id_usuario}/agua` | Intervalo e meta diária de água |
| PUT | `/lembretes/config/{id_usuario}/refeicoes` | Horários das refeições |
| POST | `/lembretes/config/{id_usuario}/ativar` | Ativa lembretes |
| POST | `/lembretes/config/{id_usuario}/desativar` | Desativa lembretes |

### Dashboard (`/dashboard`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/dashboard/usuario/{id_usuario}` | Resumo diário: macros vs. meta, água, refeições, streak |
| GET | `/dashboard/usuario/{id_usuario}/semana` | Calorias dos últimos 7 dias + água |
| GET | `/dashboard/usuario/{id_usuario}/mes` | Calorias dos últimos 31 dias + água |
| GET | `/dashboard/usuario/{id_usuario}/evolucao-peso` | Histórico de peso em ordem cronológica |

### Relatórios (`/relatorios`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/relatorios/usuario/{id_usuario}/pdf` | Exporta relatório em PDF (requer `data_inicio` e `data_fim`) |
| GET | `/relatorios/usuario/{id_usuario}/dados` | Mesmos dados em JSON |

Exemplo de resposta do resumo diário:

```json
{
  "data": "2026-08-04",
  "meta_definida": true,
  "macros": {
    "consumido": { "calorias": 400.0, "carboidratos": 40.0, "proteinas": 20.0, "gorduras": 10.0 },
    "meta":      { "calorias": 2000, "carboidratos": 250, "proteinas": 150, "gorduras": 44 },
    "restante":  { "calorias": 1600.0, "carboidratos": 210.0, "proteinas": 130.0, "gorduras": 34.0 },
    "percentual": 20.0
  },
  "agua": { "consumido_ml": 1500.0, "meta_ml": 2500.0, "restante_ml": 1000.0, "percentual": 60.0 },
  "refeicoes_registradas": 1,
  "streak_dias": 3
}
```

---

## Banco de dados

O schema é criado automaticamente por `Base.metadata.create_all()` na inicialização da
aplicação. Principais entidades:

| Tabela | Descrição | Relação |
|---|---|---|
| `usuario` | Usuários (UUID, nome, e-mail único, hash da senha) | — |
| `perfil_nutri` | Perfil antropométrico e objetivo | 1:1 com usuário |
| `meta_nutri` | Metas calóricas e de macros por data | 1:N com usuário |
| `registro_agua` | Ingestão de água por dia | 1:N com usuário |
| `historico_progresso` | Peso e altura ao longo do tempo | 1:N com usuário |
| `refeicao` | Refeições por dia e tipo | 1:N com usuário |
| `alimento` | Base de alimentos (macros, porção padrão, origem) | — |
| `item_refeicao` | Itens de uma refeição (quantidade em gramas) | N:N refeição ↔ alimento |
| `sugestao_refeicao` | Sugestões geradas para o usuário | 1:N com usuário |
| `lembrete_config` | Configuração de lembretes | 1:1 com usuário |

Todas as chaves estrangeiras usam `ON DELETE CASCADE`.

> **Sobre `backend/banco_de_dados/banco.sql`:** este script descreve um schema **legado**
> (tabelas em maiúsculas como `USUARIOS` e `META_NUTRI`, com PK `INT AUTO_INCREMENT`)
> que diverge dos models SQLAlchemy atuais (tabelas minúsculas, PK `UUID CHAR(36)`).
> Ele é mantido apenas como registro histórico do projeto e **não é executado** pelo
> Docker — deixá-lo como script de inicialização criaria um segundo banco `KaorCount`
> (o nome é case-sensitive no MySQL do Linux) que a aplicação nunca usaria.

### Cálculos nutricionais

O `NutricaoService` centraliza a fisiologia nutricional:

- **TMB** — fórmula de Mifflin-St Jeor, diferenciada por gênero;
- **Calorias diárias** — TMB × fator de atividade × ajuste por objetivo (perder/manter/ganhar);
- **Macros por objetivo** — distribuição percentual de carboidrato/proteína/gordura;
- **Macros por item** — proporcionais à quantidade em gramas vs. a porção padrão.

---

## Publicando em produção

O `docker-compose.prod.yml` sobrepõe o compose de desenvolvimento e adiciona o que
falta para o projeto ficar no ar de verdade: **HTTPS automático, isolamento do banco e
travas de segurança**.

### O que muda em relação ao desenvolvimento

| | Desenvolvimento | Produção |
|---|---|---|
| HTTPS | ❌ | ✅ Caddy + Let's Encrypt (automático) |
| Porta do MySQL exposta | ✅ 3306 | ❌ só rede interna |
| Porta da API exposta | ✅ 8000 | ❌ só via proxy |
| Fallback para SQLite | ✅ silencioso | ❌ **API não sobe** sem o banco |
| CORS | `*` (liberado) | 🔒 só os domínios de `CORS_ORIGINS` |
| Limites de memória | ❌ | ✅ 768M / 512M / 128M |
| Rotação de logs | ❌ | ✅ 10 MB × 3 arquivos |

### Pré-requisitos

- Um servidor **VPS** com Linux (Oracle Cloud Free, Contabo, Locaweb, Hostinger…)
- **Docker** e **Docker Compose** instalados
- Um **domínio** com DNS apontando para o IP do servidor nas portas **80** e **443**

> O Caddy obtém o certificado sozinho, mas só consegue se o DNS já estiver apontando
> para o servidor. Sem domínio, veja [Testar sem domínio](#testar-produção-sem-domínio).

### Publicando

```bash
# 1. Copie e edite a configuração de PRODUÇÃO (arquivo separado do dev)
cp .env.prod.example .env.prod
```

Gere os segredos e preencha o `.env.prod`:

```bash
# Chave de assinatura do JWT (obrigatória)
python -c "import secrets; print(secrets.token_urlsafe(48))"

# Senhas do banco (obrigatórias)
python -c "import secrets; print(secrets.token_urlsafe(24))"
```

No mínimo, ajuste estas linhas:

```env
CADDY_DOMAIN=seudominio.com.br
ACME_EMAIL=seu.email@seudominio.com.br
CORS_ORIGINS=https://seudominio.com.br
SECRET_KEY=<a chave gerada acima>
DB_PASSWORD=<a senha gerada acima>
DB_ROOT_PASSWORD=<outra senha gerada>
```

Depois suba:

```bash
# Linux / macOS / WSL
./run.sh check    # valida a configuração antes de subir
./run.sh prod

# Windows
run.bat check
run.bat prod
```

O `check` impede subir com `SECRET_KEY` de exemplo, variáveis faltando, ou um segredo
com prefixo `EXPO_PUBLIC_` (que vazaria para o navegador) — falha na hora, em vez de
expor o app.

Acesse **https://seudominio.com.br**. O certificado é emitido na primeira subida
(leva ~15 segundos) e se renova sozinho.

> O `.env.prod` é passado ao Compose com `--env-file`, então o Compose **não** lê o
> `.env` de desenvolvimento nem as variáveis do seu shell. A configuração de produção
> é sempre exatamente a que está no arquivo.

### O que acontece ao subir

```
                     Internet (HTTPS)
                            │
                    ┌───────▼────────┐
                    │      caddy     │  certificado automático
                    └───────┬────────┘
              ┌─────────────┴─────────────┐
              ▼                           ▼
     ┌──────────────────┐        ┌──────────────────┐
     │  web (nginx)     │        │  api (FastAPI)   │
     │  bundle do app   │───────►│  /api/v1 /docs   │
     └──────────────────┘  /api  └────────┬─────────┘
                                           ▼
                                    ┌──────────────┐
                                    │  db (MySQL)  │  ← sem porta exposta
                                    └──────────────┘
```

### Travas de produção

Três proteções entram em vigor com `ENVIRONMENT=production`:

1. **A API não sobe sem o MySQL.** Em desenvolvimento, se o banco não responde, o
   backend cai para um SQLite local e imprime um aviso. Em produção isso seria
   catastrófico — o container pareceria saudável, mas os dados ficariam num arquivo
   destruído a cada deploy. Agora a API **recusa subir** e o orquestrador reinicia.

2. **CORS travado por domínio.** Com `allow_origins=["*"]`, qualquer site da internet
   poderia chamar a API usando o token de um usuário logado. Em produção, só os domínios
   em `CORS_ORIGINS` passam. A API também **recusa subir** se a lista estiver vazia.

3. **Valores obrigatórios.** `SECRET_KEY`, `DB_PASSWORD`, `DB_ROOT_PASSWORD` e
   `CORS_ORIGINS` usam `${VAR:?erro}` no compose — se estiverem vazios, o `docker compose`
   falha imediatamente com uma mensagem clara.

### Checklist de segurança

Antes de apresentar o projeto, confirme:

- [ ] `SECRET_KEY` gerada e diferente do exemplo
- [ ] Senhas do banco trocadas
- [ ] `CORS_ORIGINS` com o domínio real
- [ ] `DB_PORT` **não** aparece mais em `docker compose ps` (MySQL fechado)
- [ ] HTTPS funcionando (cadeado no navegador)
- [ ] `git status` **não** lista `.env`, `.env.prod` nem `backend/.env`
- [ ] Nenhum segredo começa com `EXPO_PUBLIC_` (o `./run.sh check` detecta)
- [ ] Backup do banco configurado

Para conferir o isolamento rapidamente:

```bash
# Não deve listar nenhum arquivo .env
git status --short | grep env

# Deve listar apenas os templates
git ls-files | grep env
```

### Backup do banco

Rode um `mysqldump` diário via cron:

```bash
crontab -e
```

```cron
0 3 * * * cd /caminho/para/KaorCount && \
  docker compose --env-file .env.prod \
    -f docker-compose.yml -f docker-compose.prod.yml \
    exec -T db mysqldump -u root -p"$DB_ROOT_PASSWORD" \
    --single-transaction kaorcount | gzip > backup-$(date +\%Y-\%m-\%d).sql.gz
```

> `--single-transaction` garante consistência sem travar o banco.
> Os arquivos `backup-*.sql.gz` já estão no `.gitignore`.

Para restaurar:

```bash
gunzip -c backup-2026-10-02.sql.gz | docker compose --env-file .env.prod \
  -f docker-compose.yml -f docker-compose.prod.yml \
  exec -T db mysql -u root -p"$DB_ROOT_PASSWORD" kaorcount
```

### Testar produção sem domínio

Se você ainda não tem domínio, há duas saídas:

**1. Sem HTTPS, publicando o web direto.** Comente o serviço `caddy` no
`docker-compose.prod.yml` e troque `ports: !reset []` por `ports: ["80:80"]` em `web`.

**2. Com certificado local.** Defina `CADDY_DOMAIN=localhost`. O Caddy usa um
certificado interno (o navegador avisa que a conexão não é confiável, mas o
HTTPS funciona para testes).

> ⚠️ **Não use nenhum dos dois para a apresentação final.** O Caddy **não** consegue
> emitir certificado real sem um domínio apontando para o servidor, e o aviso do
> navegador estraga a impressão. Compre um domínio barato (`.com.br` custa poucos
> reais por ano) e aponte o DNS.

### Sobre o app mobile em produção

O Docker publica o **bundle web**. Para ter o app instalável no celular, use o
**EAS Build** da Expo, que gera o `.apk`/`.ipa` na nuvem:

```bash
npx eas-cli login
npx eas-cli build --profile preview
```

O plano gratuito da Expo dá builds de prioridade baixa, suficientes para um projeto
de faculdade. Para o app apontar para a API publicada, defina antes:

```env
EXPO_PUBLIC_API_URL=https://seudominio.com.br/api/v1
```

### Comandos de produção

```bash
./run.sh check     # valida antes de subir
./run.sh prod      # sobe com Caddy + HTTPS
./run.sh status    # estado dos containers
./run.sh logs      # acompanha os logs
./run.sh down      # derruba (mantém banco e certificados)
./run.sh reset     # ⚠️ apaga o banco (pede confirmação)
```

---

## CI/CD (GitHub Actions)

Dois workflows em `.github/workflows/`.

### `ci.yml` — verificação

Roda em todo push e em toda PR para `main`, em três jobs independentes:

| Job | O que confere |
|---|---|
| **API (FastAPI)** | compila os módulos, **importa `app.main`** (um import quebrado passa pelo `compileall` e só apareceria no deploy), e confirma que a produção continua recusando `SECRET_KEY` padrão ou curta e que `/alimentos` continua sem `PUT`/`DELETE` |
| **Compose + Caddy** | `docker compose config` dos dois arquivos, `CADDY_DOMAIN` chegando de fato ao container, MySQL sem porta publicada no host, e `caddy validate` no Caddyfile |
| **App (Expo web)** | `npm ci` + `npx expo export --platform web` — o mesmo build do Dockerfile, e o único passo que faz o parse das telas (o `tsconfig.json` é um stub sem nenhum `.ts`) |

O repositório ainda não tem testes automatizados, então a CI é um gate
**estrutural**, não de comportamento. E ela nunca vê as senhas reais: a validação
do compose de produção usa o `.env.prod.example` versionado.

### `deploy.yml` — publicação

Disparado à mão (Actions → *Deploy* → **Run workflow**). Entra por SSH no
servidor, faz `git pull`, roda `./run.sh check` e `./run.sh prod`, e espera os
containers `kaorcount-caddy`, `kaorcount-web` e `kaorcount-db` ficarem
saudáveis. A concorrência é serializada de propósito: cancelar um deploy no
meio deixaria a stack pela metade.

Precisa existir no repositório (Settings → Secrets and variables → Actions):

| Tipo | Nome | Conteúdo |
|---|---|---|
| Secret | `DEPLOY_SSH_KEY` | chave **privada** cujo par público está no `authorized_keys` do servidor |
| Secret | `DEPLOY_HOST`, `DEPLOY_USER` | host e usuário do SSH — não é o domínio do site |
| Secret | `DEPLOY_KNOWN_HOSTS` | saída de `ssh-keyscan -t ed25519,rsa <host>` |
| Variable | `DEPLOY_PATH` | caminho do repositório no servidor (padrão `KaorCount`) |
| Variable | `DEPLOY_BRANCH` | branch publicada (padrão `main`) |

O `.env.prod` **não** passa pelo GitHub: ele fica no servidor, e é de lá que o
compose o lê. Se faltar qualquer item, o workflow falha no primeiro passo
dizendo qual.

---

## Backend na Vercel (sem Docker)

Sobe **só a API** e a página institucional da Keenko; o app Expo e o compose
ficam de fora.

1. Importe o repositório e defina **Root Directory = `backend`**
   (Settings → General). É o que limita o deploy à API + `public/`.
2. Copie `.env.vercel.example` para as **Environment Variables** do painel
   (Settings → Environment Variables). `DATABASE_URL`, `SECRET_KEY`,
   `CORS_ORIGINS` e `ENVIRONMENT=production` são obrigatórios — a API recusa
   subir sem eles.
3. `backend/vercel.json` já traz o resto: região `gru1` (São Paulo), 1024 MB /
   30 s de `maxDuration` (o PDF de relatório é o que mais demora) e os
   cabeçalhos de segurança que hoje só o Caddy aplica.

Não precisa criar `api/index.py` nem `asgi.py`: o Vercel detecta FastAPI e procura
a instância `app` em `app/main.py`, que é exatamente onde ela já está.

**O banco tem que ser alcançável pela internet.** O MySQL do `docker-compose` não
serve — ele escuta só na rede interna do host. Com `ENVIRONMENT=production` a API
recusa a cair para SQLite e falha no import; e mesmo em desenvolvimento o SQLite
não teria onde persistir, porque o disco da function é somente leitura fora de
`/tmp` e efêmero a cada invocação.

Dois efeitos colaterais, ambos bons: na Vercel o `backend/public/` é servido na
raiz, então `/img/logo_KaorCount.svg` passa a existir (conserta as imagens que hoje
quebram porque a API monta só `/css` e `/js`), e a landing page vira arquivo
estático de CDN — o `vercel.json` reescreve `/` e `/index.html` para
`/html/index.html` em vez de depender do `FileResponse` dentro da function.

---

## Tratamento de erros


Respostas de erro padronizadas:

```json
{ "erro": true, "status": 404, "detail": "Refeição não encontrada", "path": "/api/v1/refeicoes/..." }
```

| Status | Causa |
|---|---|
| 400 | Dados inválidos para o banco (`DataError`) |
| 401 | Credenciais inválidas / token ausente ou expirado |
| 403 | Conta inativa ou recurso de outro usuário |
| 404 | Recurso não encontrado |
| 409 | Violação de integridade (duplicidade, etc.) |
| 422 | Erro de validação de payload (com lista de erros por campo) |
| 503 | Erro de conexão com o banco de dados |

---

## Mapeamento dos requisitos funcionais

| RF | Descrição | Onde está |
|---|---|---|
| RF01 | Cadastro e autenticação com perfil | `/auth`, `/usuarios`, `/perfil-nutri` |
| RF02 | Registro de refeições com busca de alimentos | `/refeicoes`, `/alimentos`, `/fatsecret` |
| RF03 | Cálculo automático de macros e calorias | `NutricaoService`, `/refeicoes/.../macros` |
| RF04 | Definição de metas nutricionais | `/metas-nutri` |
| RF05 | Dashboard com visualização de progresso | `/dashboard` |
| RF06 | Histórico alimentar com filtros por período | `/refeicoes/.../periodo`, `/historico-progresso` |
| RF07 | Sugestões de refeições por perfil/meta | `/sugestoes`, `SugestaoService` |
| RF08 | Notificações e lembretes | `/lembretes`, `LembreteService` |

---

## Equipe

**Keenko — Projeto Integrador, Desenvolvimento de Sistemas, Curitiba — 2026**

- Eduardo Luiz Campos dos Santos
- João Vitor Ferreira da Silva
- Leonardo Rodrigues Karpinski
- Kauã de Oliveira Júlio

---

## Licença

Consulte o arquivo [LICENSE](./LICENSE).






