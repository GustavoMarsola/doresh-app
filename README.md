<div align="center">
  <img src="./frontend/public/torah.png" alt="Doresh" width="160" />

  <h1>Doresh</h1>

  <p><em>דּוֹרֵשׁ — aquele que busca, que estuda, que interpreta</em></p>

  <p>Plataforma de estudos bíblicos — leia, anote, crie sermões e interaja com IA assistente.</p>

  <p>
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Python-3.11-3776ab?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Docker-compose-2496ed?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

---

## Sobre

**Doresh** é uma plataforma cristã de estudo bíblico. O nome vem do hebraico *דּוֹרֵשׁ* (doresh) — aquele que busca, que inquire, que interpreta a Palavra.

A aplicação permite:

- **Ler a Bíblia** nas versões NVI e ARA, capítulo a capítulo
- **Destacar versículos** com cores e adicionar comentários pessoais
- **Criar estudos bíblicos** estruturados com seções, referências e geração por IA
- **Assistente Ruach** — chat com IA para aprofundamento teológico (UI pronta; integração de backend em desenvolvimento)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI 0.115 · Python 3.11 · SQLAlchemy 2 (async) |
| Banco de dados | PostgreSQL 16 (não incluso no `docker-compose.yml` — aponte `DATABASE_HOST`/`DATABASE_PORT` para sua instância) |
| Cache / sessões | Redis 7 |
| Frontend | React 18 · Vite · TypeScript 5 · Tailwind CSS · shadcn/ui |
| Auth | JWT (PyJWT) · bcrypt (passlib) |
| IA | OpenAI GPT-4.1 mini |
| Deploy | Docker · docker compose |

> **Monolito intencional.** Uma imagem Docker, um `docker compose up --build`. O React é servido pelo próprio FastAPI como SPA estático. O código está estruturado para ser desacoplado quando necessário.

---

## Subindo com Docker

```bash
# 1. Clone e entre na pasta
git clone <repo>
cd doresh-app

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves (banco, JWT, OpenAI, e-mail)
# DATABASE_HOST/DATABASE_PORT devem apontar para um Postgres já em execução —
# o docker-compose deste projeto sobe apenas app + redis.

# 3. Suba app + redis
docker compose up --build
```

Após o build, a aplicação estará disponível em:

| Serviço | URL |
|---|---|
| App (React + API) | http://localhost:8000 |
| Swagger (API docs) | http://localhost:8000/api/docs |

O container aplica as migrações (`alembic upgrade head`) antes de subir a API (é necessário um Postgres acessível — veja acima).

> **Banco criado antes do Alembic** (quando as tabelas vinham do `create_all`): marque-o uma vez com o baseline antes do primeiro `upgrade`:
> `cd backend && alembic stamp 7766b2e0e190 && alembic upgrade head`

---

## Desenvolvimento local

Execute backend e frontend em paralelo:

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
alembic upgrade head          # aplica as migrações (rode de novo depois de cada pull)
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev   # Vite em :5173, proxy /api → :8000
```

Não é necessário configurar CORS para dev — o proxy do Vite cuida disso.

### Migrações (Alembic)

O schema é versionado com Alembic em `backend/src/infrastructure/database/migrations/` — a app não cria nem altera tabelas ao iniciar.

```bash
cd backend
alembic revision --autogenerate -m "add theme to users"   # depois de mudar um model; revise o arquivo gerado
alembic upgrade head                                      # aplica
alembic downgrade -1                                      # desfaz a última
alembic check                                             # models e migrações batem?
```

---

## Estrutura do projeto

```
doresh-app/
├── backend/
│   ├── main.py                        # Entrypoint: API + serve React build
│   ├── requirements.txt
│   └── src/
│       ├── app.py                     # create_app() + lifespan (cria tabelas)
│       ├── settings.py                # pydantic-settings (todas as env vars)
│       ├── exceptions.py
│       ├── application/
│       │   └── use_cases/             # bible · email · studies · users
│       ├── common/
│       │   ├── authentication.py      # JWT + bcrypt
│       │   ├── bible/                 # 66 livros × NVI + ARA (JSON)
│       │   ├── decorators.py          # api_key_required · session_token_required · rate_limiter
│       │   └── utilities.py
│       ├── infrastructure/
│       │   ├── database/              # SQLAlchemy engines + modelos
│       │   ├── redis/                 # Redis async engine
│       │   └── repositories/          # AppRepository · RedisRepository + contextos
│       ├── routes/api/v1/             # bible · studies · users
│       └── schemas/                   # DTOs Pydantic
│
├── frontend/
│   └── src/
│       ├── pages/                     # Dashboard · ReadBible · CreateSermon …
│       ├── components/                # ui/ (shadcn) · layout/ · auth/ · ai/
│       └── hooks/                     # ChatContext · use-mobile · use-toast
│
├── Dockerfile                         # Multi-stage: node build → python runner
├── docker-compose.yml                 # app · redis
└── .env.example
```

---

## API — Visão geral

Base: `/api/v1` · Docs interativas: `/api/docs`

### Autenticação

| Header | Quando usar |
|---|---|
| `x-api-key: <chave>` | Endpoints públicos (registro, login) |
| `Authorization: Bearer <jwt>` | Endpoints protegidos (pós-login) |

### Endpoints

#### Usuários — `/api/v1/user`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/register` | api-key | Cadastra usuário + envia e-mail de verificação |
| `GET` | `/verify-email/{id}` | — | Confirma e-mail pelo código recebido |
| `POST` | `/authenticate` | api-key | Login → retorna access token (JWT) e refresh token |
| `POST` | `/refresh` | api-key | Troca o refresh token por um novo par (rotação; reuso revoga a sessão) |
| `GET` | `/profile` | Bearer | Highlights e comentários do usuário |
| `POST` | `/logout` | Bearer | Encerra a sessão e revoga o refresh token |
| `POST` | `/password/forgot` | api-key | Envia por e-mail um link de redefinição de senha (mesma resposta para e-mail não cadastrado) |
| `POST` | `/password/reset` | api-key | Define a nova senha com o token do link (uso único) e encerra todas as sessões |
| `DELETE` | `/account` | Bearer | Exclui de vez a conta e todos os dados do usuário (incluindo planos de leitura); corpo `{"password": "..."}` |

Erros de autenticação (401, campo `detail`):

| Código | Quando |
|---|---|
| `auth.missing_token` | Sem header `Authorization: Bearer` |
| `auth.token_expired` | Access token expirado (use `/refresh`) |
| `auth.invalid_token` | Assinatura inválida, tipo diferente de `access` ou claims ausentes |
| `auth.session_revoked` | Sessão encerrada (logout ou reuso de refresh token) ou inexistente |
| `auth.invalid_refresh_token` | Refresh token inválido, expirado, já usado ou de sessão encerrada |

Outros erros de conta (campo `detail`):

| Status | Código | Quando |
|---|---|---|
| 400 | `auth.invalid_reset_token` | Link de redefinição inválido, expirado, já usado ou substituído por um pedido mais novo |
| 403 | `account.invalid_password` | Senha errada ao confirmar a exclusão da conta |

#### Estudos — `/api/v1`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/study` | Bearer | Cria estudo com seções e referências bíblicas |
| `GET` | `/studies` | Bearer | Lista estudos com paginação e ordenação |
| `PATCH` | `/study` | Bearer | Atualiza título, seções ou referências |
| `DELETE` | `/study/{id}` | Bearer | Soft-delete (marca como inativo) |

#### Planos de leitura — `/api/v1/reading-plans`

Os planos padrão vivem em `backend/src/common/reading_plans/catalog.json` (só referências). O ritmo (início, duração, dias da semana) define quantos dias de leitura há; cada trecho é dividido nesses dias equilibrando o número de versículos. O progresso guarda os **versículos lidos**, por isso mudar o ritmo nunca apaga o que foi lido.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/catalog` | Bearer | Planos padrão disponíveis |
| `GET` | `` | Bearer | Meus planos, com progresso e próxima leitura |
| `POST` | `` | Bearer | Começa um plano (`plan_slug`, e opcionalmente `book`, `start_date`, `total_days`, `weekdays` ISO 1–7) |
| `GET` | `/{id}` | Bearer | Plano com todos os dias e o estado de cada um (`read`, `partial`, `unread`) |
| `PATCH` | `/{id}` | Bearer | Muda o ritmo, mantendo o progresso |
| `PUT` / `DELETE` | `/{id}/days/{n}/read` | Bearer | Marca ou desmarca o dia `n` como lido |
| `POST` | `/{id}/realign` | Bearer | Põe a próxima leitura em `today` (data do cliente), sem mudar o número de dias |
| `DELETE` | `/{id}` | Bearer | Remove o plano e o progresso |

Erros (campo `detail`): 404 `reading_plan.not_found` / `reading_plan.day_not_found`; 422 `reading_plan.unknown_plan`, `invalid_book`, `invalid_duration`, `invalid_weekdays`, `too_many_days`.

#### Bíblia — `/api/v1/bible`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/book` | — | Conteúdo de um livro (NVI ou ARA) |
| `GET` | `/highlights?book=&chapter=` | Bearer | Grifos do usuário num capítulo |
| `PUT` | `/highlights` | Bearer | Grifa versículos (`book`, `chapter`, `verses`, `color`); troca a cor dos já grifados |
| `DELETE` | `/highlights?book=&chapter=&verses=` | Bearer | Remove grifos de versículos |
| `GET` | `/comments?book=&chapter=` | Bearer | Comentários do usuário num capítulo |
| `POST` | `/comments` | Bearer | Comenta um intervalo (`book`, `chapter`, `verse_start`, `verse_end`, `comment`) |
| `DELETE` | `/comments/{id}` | Bearer | Remove um comentário |

Grifos e comentários guardam só a referência: `book` é o slug do livro (`"1 Coríntios"` → `1_corintios`), sem cópia do texto bíblico. Referência inexistente → `422 bible.invalid_reference`.

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
# Obrigatórias para funcionar
X_API_KEY=           # chave para os endpoints públicos
JWT_SECRET_KEY=      # segredo para assinar os tokens

# Sessão (opcionais, com padrão)
ACCESS_TOKEN_EXPIRE_MINUTES=120   # validade do access token
REFRESH_TOKEN_EXPIRE_DAYS=30      # validade do refresh token (renovada a cada /refresh)
SESSION_CACHE_TTL_SECONDS=60      # cache no Redis do estado "sessão ativa"

# Banco de dados (sobrescrito automaticamente pelo docker compose)
DATABASE_NAME=doresh
DATABASE_USER=doresh
DATABASE_PWD=doresh

# E-mail (verificação de conta)
EMAIL_USER=seu@email.com
EMAIL_PASSWORD=app-password-do-gmail

# OpenAI (assistente Ruach)
OPENAI_API_KEY=
OPENAI_ASSISTANT_ID=
```

> No `docker compose`, apenas `REDIS_HOST`/`REDIS_PORT` são sobrescritos automaticamente para o serviço `redis`. `DATABASE_HOST`/`DATABASE_PORT` continuam vindo do seu `.env` — aponte para um Postgres local, em outro container ou gerenciado.
>
> Rodando o backend fora do Docker (`uvicorn main:app --reload`), as variáveis são lidas automaticamente do `.env` na raiz do projeto — não é necessário exportá-las manualmente no shell.

---

## Bíblias disponíveis

| Versão | Código | Livros |
|---|---|---|
| Nova Versão Internacional | `nvi` | 66 |
| Almeida Revista e Atualizada | `ara` | 66 |

```
GET /api/v1/bible/book?name=genesis&version=nvi
GET /api/v1/bible/book?name=joao&version=ara
```

---

<div align="center">
  <sub>Feito com fé e código · Doresh © 2025</sub>
</div>
