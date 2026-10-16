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

As tabelas do banco são criadas automaticamente na primeira inicialização (é necessário um Postgres acessível — veja acima).

---

## Desenvolvimento local

Execute backend e frontend em paralelo:

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev   # Vite em :5173, proxy /api → :8000
```

Não é necessário configurar CORS para dev — o proxy do Vite cuida disso.

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
│       ├── pages/                     # LandingPage · Dashboard · ReadBible · CreateSermon …
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
| `POST` | `/authenticate` | api-key | Login → retorna JWT |
| `GET` | `/profile` | Bearer | Highlights e comentários do usuário |
| `POST` | `/logout` | Bearer | Encerra a sessão |

#### Estudos — `/api/v1`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/study` | Bearer | Cria estudo com seções e referências bíblicas |
| `GET` | `/studies` | Bearer | Lista estudos com paginação e ordenação |
| `PATCH` | `/study` | Bearer | Atualiza título, seções ou referências |
| `DELETE` | `/study/{id}` | Bearer | Soft-delete (marca como inativo) |

#### Bíblia — `/api/v1/bible`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/book` | — | Conteúdo de um livro (NVI ou ARA) |
| `POST` | `/highlight` | Bearer | Salva um versículo destacado |
| `POST` | `/comment` | Bearer | Salva um comentário sobre um trecho |

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
# Obrigatórias para funcionar
X_API_KEY=           # chave para os endpoints públicos
JWT_SECRET_KEY=      # segredo para assinar os tokens

# Banco de dados — aponte para um Postgres já em execução (não é subido pelo docker compose)
DATABASE_HOST=localhost
DATABASE_PORT=5432
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
