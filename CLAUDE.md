# CLAUDE.md — heintrelinhas

Guia do projeto para agentes de IA e desenvolvedores. Tudo em português do Brasil.

## 1. Visão geral

O **heintrelinhas** é uma plataforma fullstack de publicação colaborativa de posts/artigos (blog literário e de artigos) com fluxo editorial: **escritores** criam rascunhos e enviam para revisão, **editores** aprovam/rejeitam/publicam, e **administradores** têm controle total (incluindo taxonomias). O repositório é um **workspace NPM** com dois módulos: `backend/` (API REST) e `frontend/` (SPA React).

## 2. Stack e dependências principais

### Backend (`backend/`)
- **Fastify 4** — servidor HTTP.
- **TypeScript** (executado em dev via `tsx watch`).
- **Prisma ORM 5** + **PostgreSQL** (rodando via Docker Compose, imagem `postgres:15-alpine`).
- **Zod 3** — validação de corpo das requisições.
- **@fastify/jwt** — autenticação por token JWT (Bearer).
- **@fastify/cors** — CORS liberado (`origin: true`; em produção deve-se restringir).
- **bcryptjs** — hash de senhas (salt 8).
- **dotenv** — carrega `backend/.env`.

### Frontend (`frontend/`)
- **React 19** + **Vite** + **TypeScript**.
- **react-router-dom 7** — roteamento SPA (`BrowserRouter`).
- **axios** — cliente HTTP com interceptor de JWT.
- **lucide-react** — ícones.
- **CSS puro** (Vanilla CSS com variáveis HSL customizadas, tema claro/escuro, efeito "glass").
- **oxlint** — linter.
- Deploy pensado para **Vercel** (`vercel.json` reescreve todas as rotas para `/`, suportando SPA).

### Raiz
- **concurrently** — roda backend e frontend juntos no `npm run dev`.

## 3. Estrutura de pastas comentada

```
Heintrelinhas/
├── package.json              # Workspace NPM (workspaces: frontend, backend) + scripts agregados
├── README.md                 # Instruções de instalação/uso (inclui usuários de teste do seed)
├── backend/
│   ├── .env                  # Variáveis de ambiente (NÃO commitar segredos)
│   ├── docker-compose.yml    # Container PostgreSQL (porta 5432, db heintrelinhas_db)
│   ├── prisma/
│   │   ├── schema.prisma     # Modelos: User, Post, Category, Tag + enums Role e PostStatus
│   │   └── seed.ts           # Popula usuários de teste, categorias, tags e posts de exemplo
│   └── src/
│       ├── server.ts         # Ponto de entrada: carrega .env e sobe o servidor (porta 3333)
│       ├── app.ts            # Instância Fastify: CORS, JWT, registro de rotas, error handler global
│       ├── lib/prisma.ts     # Instância única (singleton) do PrismaClient
│       ├── routes/           # Definição das rotas por recurso (auth, posts, categories, tags)
│       ├── controllers/      # Lógica de negócio de cada rota
│       ├── schemas/          # Schemas Zod de validação dos bodies
│       ├── middlewares/
│       │   ├── jwt-auth.ts   # verifyJWT: exige token válido (401 se ausente/inválido)
│       │   └── rbac.ts       # verifyUserRole: restringe rota a papéis específicos (403)
│       └── utils/slugify.ts  # Normaliza texto para slug (remove acentos, espaços → hífens)
└── frontend/
    ├── vite.config.ts        # Config padrão Vite + plugin React
    ├── vercel.json           # Rewrite SPA para deploy na Vercel
    └── src/
        ├── main.tsx          # Bootstrap React (StrictMode + createRoot)
        ├── App.tsx           # Rotas da SPA + componente PrivateRoute (guarda por autenticação/papel)
        ├── index.css / App.css  # Estilos globais (variáveis de tema, classes utilitárias)
        ├── services/api.ts   # Instância axios + interceptor que injeta o JWT do localStorage
        ├── contexts/AuthContext.tsx  # Estado global de autenticação (user, token, signIn/signUp/signOut)
        ├── components/
        │   ├── Layout.tsx    # Shell da aplicação: sidebar de navegação, header, tema claro/escuro,
        │   │                 #   painel "Copilot" (chat de IA simulado com respostas mockadas)
        │   └── PostCard.tsx  # Card visual de post (capa em gradiente, badges de status)
        └── pages/
            ├── Home.tsx        # Listagem de posts com filtros (categoria, tag, status, busca, ordenação)
            ├── Login.tsx       # Formulário de login
            ├── Register.tsx    # Formulário de cadastro (permite escolher o papel)
            ├── PostDetails.tsx # Leitura do post + ações editoriais (aprovar/rejeitar/enviar p/ revisão)
            ├── PostEditor.tsx  # Criação/edição de post (mesmo componente para os dois modos)
            └── AdminPanel.tsx  # CRUD de categorias e tags (apenas ADMIN/EDITOR)
```

## 4. Como rodar

Pré-requisitos: Node 18+, NPM 9+, Docker (para o PostgreSQL).

```bash
# Na raiz do repositório:
npm install          # instala workspace inteiro (postinstall roda prisma generate)
npm run db:up        # sobe o container PostgreSQL
npm run db:migrate   # aplica migrações Prisma
npm run db:seed      # popula dados de exemplo (usuários, categorias, tags, posts)
# Atalho: npm run db:setup faz db:up + generate + migrate + seed

npm run dev          # sobe backend (http://localhost:3333) e frontend (http://localhost:5173)
```

Outros scripts úteis (raiz): `dev:frontend`, `dev:backend`, `build`, `build:frontend`, `build:backend`, `db:down`, `db:generate`.

### Variáveis de ambiente (apenas nomes — nunca commitar valores)

Backend (`backend/.env`):
- `DATABASE_URL` — string de conexão PostgreSQL usada pelo Prisma.
- `JWT_SECRET` — segredo de assinatura dos JWTs. **Obrigatória**: o app lança erro na inicialização se ausente.
- `PORT` — porta do servidor (padrão 3333 se ausente).
- `NODE_ENV` — controla logger do Fastify e nível de log do Prisma.

Frontend (build Vite):
- `VITE_API_URL` — URL base da API (padrão `http://localhost:3333` se ausente).

### Usuários de teste (criados pelo seed)
- `admin@heintrelinhas.com` / `admin123` (ADMIN)
- `editor@heintrelinhas.com` / `editor123` (EDITOR)
- `writer@heintrelinhas.com` / `writer123` (WRITER)

## 5. Funcionalidades

1. **Cadastro e login de usuários** — registro com nome/e-mail/senha/papel; login retorna JWT válido por 7 dias. A senha é armazenada como hash bcrypt. Observação: o formulário de registro permite escolher qualquer papel (inclusive ADMIN) — adequado para demo, inseguro para produção.
2. **Papéis (RBAC)** — `WRITER`, `EDITOR`, `ADMIN`:
   - WRITER: cria/edita/exclui apenas os próprios posts; só pode usar status `DRAFT` e `PENDING_REVIEW`; enxerga posts publicados + os seus próprios.
   - EDITOR/ADMIN: veem e editam todos os posts, podem `PUBLISHED`/`REJECTED`, e gerenciam categorias e tags.
3. **Fluxo editorial de posts** — ciclo de status: `DRAFT` → `PENDING_REVIEW` → `PUBLISHED` ou `REJECTED`. Ao publicar pela primeira vez, `publishedAt` é preenchido. Escritor envia rascunho para revisão; editor aprova/rejeita ou devolve para revisão.
4. **Posts** — CRUD completo com: slug único gerado automaticamente do título (com sufixo numérico em caso de colisão), tempo de leitura calculado automaticamente (~200 palavras/min) quando não informado, categoria obrigatória e tags opcionais (N:N).
5. **Categorias e Tags** — CRUD (ADMIN/EDITOR) com slug único; categoria com posts vinculados não pode ser excluída (`onDelete: Restrict`); leitura é pública.
6. **Listagem pública com filtros** — Home lista posts com filtros por categoria, tag e status (server-side via query params) e busca textual por título/resumo + ordenação (client-side).
7. **Visibilidade condicionada ao papel** — as rotas `GET /api/posts` e `GET /api/posts/:idOrSlug` são públicas, mas decodificam o JWT opcionalmente: anônimos veem só `PUBLISHED`; WRITER vê `PUBLISHED` + os próprios; EDITOR/ADMIN veem tudo.
8. **Painel administrativo** — página `/admin` (ADMIN/EDITOR) com CRUD inline de categorias e tags.
9. **Tema claro/escuro** — alternado no Layout, persistido em `localStorage` (`@heintrelinhas:theme`), aplicado via classe `dark-theme` no `<html>`.
10. **"Copilot" (chat mockado)** — painel lateral de chat no Layout que simula um assistente de IA com respostas fixas baseadas em palavras-chave. **Não há integração real com IA/LLM.**

## 6. Como os sistemas funcionam

### 6.1 Fluxo de dados (frontend ↔ backend)

```
React (páginas) → axios (services/api.ts, injeta "Authorization: Bearer <token>")
  → Fastify (rotas /api/*) → middlewares (verifyJWT, verifyUserRole)
  → controllers (validação Zod + regras de negócio) → Prisma → PostgreSQL
```

- O token e o perfil do usuário são persistidos no `localStorage` sob as chaves `@heintrelinhas:token` e `@heintrelinhas:user`; o `AuthContext` recarrega esse estado ao montar a aplicação.
- Não há refresh token: expirado o JWT (7 dias), o usuário precisa logar novamente. Também não há interceptor de resposta para 401 — chamadas falhas exibem erro nas páginas.

### 6.2 Rotas da API (prefixos registrados em `app.ts`)

**Auth — `/api/auth`** (públicas)
| Método | Caminho | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cria usuário (name, email, password, role). 409 se e-mail já existe. |
| POST | `/api/auth/login` | Valida credenciais e retorna `{ token, user }`. JWT: payload `{ role }`, `sub` = id do usuário, expira em 7d. |

**Posts — `/api/posts`**
| Método | Caminho | Auth | Descrição |
|---|---|---|---|
| GET | `/api/posts` | opcional | Lista posts com filtros `?authorId=&categoryId=&tagId=&status=`. Aplica regras de visibilidade por papel. |
| GET | `/api/posts/:idOrSlug` | opcional | Busca por UUID **ou** slug (detecta UUID por regex). 403 se não publicado e sem permissão. |
| POST | `/api/posts` | JWT | Cria post. WRITER não pode criar com status PUBLISHED/REJECTED. Gera slug único e readingTime automático. |
| PUT | `/api/posts/:id` | JWT | Atualização parcial. WRITER só edita os próprios. Título alterado ⇒ novo slug. Conteúdo alterado sem readingTime ⇒ recálculo. |
| PATCH | `/api/posts/:id/status` | JWT | Altera só o status (fluxo editorial). WRITER limitado a DRAFT/PENDING_REVIEW e apenas nos próprios posts. |
| DELETE | `/api/posts/:id` | JWT | Exclui post (WRITER só os próprios). Retorna 204. |

**Categorias — `/api/categories`** e **Tags — `/api/tags`** (estruturas idênticas)
| Método | Caminho | Auth | Descrição |
|---|---|---|---|
| GET | `/` | pública | Lista ordenada por nome. |
| GET | `/:id` | pública | Busca por id. |
| POST | `/` | JWT + ADMIN/EDITOR | Cria com slug único gerado do nome. |
| PUT | `/:id` | JWT + ADMIN/EDITOR | Atualiza nome (regenera slug apenas se o nome mudou). |
| DELETE | `/:id` | JWT + ADMIN/EDITOR | Exclui. Categoria com posts vinculados retorna 400. |

Erros seguem o padrão `{ message: string }`; validação Zod retorna 400 com `{ message, errors }`.

### 6.3 Modelos do banco (Prisma / PostgreSQL)

- **User** (`users`): id (uuid), name, email (único), passwordHash, role (`WRITER|EDITOR|ADMIN`, padrão WRITER), createdAt. 1:N com Post.
- **Post** (`posts`): id, title, slug (único), summary, content, status (`DRAFT|PENDING_REVIEW|PUBLISHED|REJECTED`, padrão DRAFT), readingTime (min), createdAt, updatedAt, publishedAt (nullable). FK `authorId` → User (`onDelete: Cascade` — excluir usuário apaga seus posts), FK `categoryId` → Category (`onDelete: Restrict`), N:N implícito com Tag.
- **Category** (`categories`): id, name, slug (único).
- **Tag** (`tags`): id, name, slug (único).

### 6.4 Autenticação e autorização

- **Autenticação**: `@fastify/jwt` com segredo `JWT_SECRET`. O middleware `verifyJWT` (`middlewares/jwt-auth.ts`) chama `request.jwtVerify()` e responde 401 em falha. Após verificação, `request.user` contém `{ sub, role }` (tipagem estendida em `rbac.ts` via declaration merging).
- **Autorização**: `verifyUserRole([...papeis])` (`middlewares/rbac.ts`) devolve 403 se o papel não estiver na lista. Regras mais finas (dono do post, restrições de status para WRITER) ficam nos controllers.
- **JWT opcional**: em `listPosts`/`getPost` o controller tenta `jwtVerify()` manualmente somente se houver header `Authorization`, ignorando token inválido (trata como anônimo) — é assim que rotas públicas aplicam visibilidade diferenciada.
- **Frontend**: `PrivateRoute` em `App.tsx` redireciona não autenticados para `/login` e usuários sem papel permitido para `/`. Isso é só UX — a segurança real é do backend.

### 6.5 Slug e tempo de leitura

- `utils/slugify.ts`: normaliza Unicode (NFD), remove acentos, minúsculas, remove caracteres especiais, troca espaços por hífens.
- Cada controller tem um `generateUnique*Slug` que testa `slug`, `slug-1`, `slug-2`... até achar um livre no banco.
- `calculateReadingTime` (post-controller): `max(1, ceil(palavras / 200))`.

## 7. Convenções e pontos de atenção

**Convenções**
- Arquivos backend nomeados por recurso e camada: `*-routes.ts`, `*-controller.ts`, `*-schemas.ts`.
- Imports internos do backend usam extensão `.js` (padrão ESM/TS com `moduleResolution` NodeNext).
- Mensagens de erro da API e textos da UI em português do Brasil.
- Chaves de `localStorage` prefixadas com `@heintrelinhas:`.
- Frontend usa muito estilo inline + classes utilitárias globais (`glass-card`, `btn`, `form-control`, `badge`, `flex-center` etc. definidas nos CSS globais).

**Pontos de atenção**
- **Registro aberto com escolha de papel**: qualquer visitante pode se cadastrar como ADMIN pela API/UI. Aceitável só para demonstração.
- **CORS `origin: true`**: liberado para qualquer origem; restringir em produção (comentário no próprio `app.ts`).
- **Sem paginação** em `GET /api/posts` — a listagem retorna tudo; busca textual e ordenação são feitas no cliente.
- **Slug muda ao renomear título** — links antigos para o post quebram (não há redirecionamento por slug antigo).
- **Copilot é mock** — não gastar esforço procurando integração de IA; as respostas são hardcoded no `Layout.tsx`.
- **Seed é destrutivo**: `prisma/seed.ts` apaga todas as tabelas antes de popular.
- **NUNCA tocar** em `node_modules/`, `package-lock.json` ou artefatos de build (`dist/`).
- O filtro de status para WRITER em `listPosts` tem lógica delicada (remove o `OR` e força `authorId`) — cuidado ao alterar.
- `updatePostStatus` preserva `publishedAt` original ao republicar (só define na primeira publicação).
