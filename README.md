<div align="center">
  <img src="./frontend/public/torah.png" alt="Doresh" width="160" />

  <h1>Doresh</h1>

  <p><em>דּוֹרֵשׁ — aquele que busca, que estuda, que interpreta</em></p>

  <p>Plataforma de estudos bíblicos — leia, anote, crie sermões e interaja com IA assistente.</p>

  <p>
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black" alt="React" />
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
- **Assistente Ruach** — chat com IA para aprofundamento teológico
- **Gerenciar assinaturas** via gateway Asaas (PIX, boleto, cartão)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI 0.115 · Python 3.11 · SQLAlchemy 2 (async) |
| Banco de dados | PostgreSQL 16 |
| Cache / sessões | Redis 7 |
| Frontend | React 19 · Vite · TypeScript 5 · Tailwind CSS · shadcn/ui |
| Auth | JWT (PyJWT) · bcrypt (passlib) |
| Pagamentos | Asaas (sandbox/prod) |
| IA | OpenAI GPT-4.1 mini |
| Automações | n8n |
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
# Edite .env com suas chaves (banco, JWT, OpenAI, Asaas, e-mail)

# 3. Suba tudo
docker compose up --build
```

Após o build, a aplicação estará disponível em:

| Serviço | URL |
|---|---|
| App (React + API) | http://localhost:8000 |
| Swagger (API docs) | http://localhost:8000/api/docs |
| n8n | http://localhost:5678 |

As tabelas do banco são criadas automaticamente na primeira inicialização.

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
│       │   └── use_cases/             # bible · email · studies · subscriptions · users
│       ├── common/
│       │   ├── authentication.py      # JWT + bcrypt
│       │   ├── bible/                 # 66 livros × NVI + ARA (JSON)
│       │   ├── decorators.py          # api_key_required · session_token_required
│       │   └── utilities.py
│       ├── infrastructure/
│       │   ├── apis/asaas_api.py      # Gateway de pagamento
│       │   ├── database/              # SQLAlchemy engines + modelos
│       │   ├── redis/                 # Redis async engine
│       │   └── repositories/          # AppRepository · RedisRepository + contextos
│       ├── routes/api/v1/             # bible · studies · users · subscriptions
│       └── schemas/                   # DTOs Pydantic
│
├── frontend/
│   └── src/
│       ├── pages/                     # LandingPage · Dashboard · ReadBible · CreateSermon …
│       ├── components/                # ui/ (shadcn) · layout/ · auth/ · ai/
│       ├── hooks/                     # ChatContext · use-mobile · use-toast
│       └── services/                  # Clientes HTTP → /api/v1
│
├── Dockerfile                         # Multi-stage: node build → python runner
├── docker-compose.yml                 # app · db · redis · n8n
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

#### Assinaturas — `/api/v1/subscription`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/plans` | — | Lista planos disponíveis |
| `POST` | `/customer` | Bearer | Cria cliente no Asaas |
| `POST` | `/` | Bearer | Cria assinatura |
| `GET` | `/` | Bearer | Consulta assinatura ativa |
| `DELETE` | `/cancel` | Bearer | Cancela assinatura |
| `POST` | `/event` | api-key | Webhook de eventos Asaas |

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
# Obrigatórias para funcionar
X_API_KEY=           # chave para os endpoints públicos
JWT_SECRET_KEY=      # segredo para assinar os tokens

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

# Asaas (pagamentos)
ASAAS_HOST=https://api-sandbox.asaas.com/v3
ASAAS_ACCESS_TOKEN=
```

> No `docker compose`, `DATABASE_HOST` e `REDIS_HOST` são sobrescritos automaticamente para os nomes dos serviços (`db` e `redis`). Você não precisa alterar esses campos no `.env`.

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
