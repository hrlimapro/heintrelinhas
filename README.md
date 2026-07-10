# 🚀 heintrelinhas — Plataforma de Publicação Literária e Artigos

O **heintrelinhas** é uma aplicação web completa (Full Stack) para publicação, gerenciamento e leitura de posts e artigos. A plataforma conta com diferentes níveis de acesso (Escritores, Editores e Administradores) e um design moderno com tema escuro e efeitos em neon.

Este repositório está configurado como um **Workspace NPM**, integrando o frontend e o backend em um único fluxo de desenvolvimento simplificado.

---

## 📂 Estrutura do Projeto

O repositório é composto por dois módulos principais:

*   **[`backend/`](file:///c:/Users/Henrique/Desktop/Heintrelinhas/backend)**: Servidor de API construído com **Fastify**, **TypeScript**, **Zod** para validação e **Prisma ORM** integrado com banco de dados **PostgreSQL**.
*   **[`frontend/`](file:///c:/Users/Henrique/Desktop/Heintrelinhas/frontend)**: Aplicativo do lado do cliente construído com **React**, **Vite**, **React Router**, **Axios** e estilizado com **Vanilla CSS** moderno (variáveis HSL customizadas).

---

## 🛠️ Pré-requisitos

Para executar este projeto localmente, você precisará ter instalado em sua máquina:

1.  **Node.js** (versão 18 ou superior recomendada).
2.  **NPM** (versão 9 ou superior).
3.  **Docker & Docker Compose** (para rodar o banco de dados PostgreSQL em container).

---

## 🚀 Como Iniciar

Siga o passo a passo abaixo para rodar toda a aplicação localmente:

### 1. Instalar as Dependências
Execute o comando abaixo na **raiz** do repositório para instalar as dependências de todo o workspace (frontend, backend e utilitários raiz):

```bash
npm install
```

### 2. Inicializar o Banco de Dados (PostgreSQL)
Se você tiver o **Docker** instalado, execute o comando abaixo para iniciar o container do PostgreSQL:

```bash
npm run db:up
```

*Se precisar parar o banco de dados posteriormente, use `npm run db:down`.*

#### 💡 Alternativa sem Docker:
Caso não use ou não tenha o Docker instalado:
1. Instale o **PostgreSQL** localmente em sua máquina.
2. Crie um banco de dados chamado `heintrelinhas_db`.
3. Abra o arquivo [`backend/.env`](file:///c:/Users/Henrique/Desktop/Heintrelinhas/backend/.env) e ajuste a variável `DATABASE_URL` com o seu usuário e senha local do PostgreSQL. Exemplo:
   ```env
   DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/heintrelinhas_db?schema=public"
   ```

### 3. Executar as Migrações e Alimentar o Banco (Seed)
Com o banco ativo (seja no Docker ou local), rode as migrações do Prisma para criar as tabelas e, em seguida, aplique o seed para cadastrar os usuários de teste, posts, categorias e tags de exemplo:

```bash
# Executa as migrações do banco
npm run db:migrate

# Cria os registros fictícios de demonstração
npm run db:seed
```

> **💡 Dica:** Se estiver usando o Docker, você pode rodar `npm run db:setup` na raiz para fazer o passo 2 e 3 em sequência automática!

### 4. Executar os Servidores em Desenvolvimento
Para rodar tanto o servidor backend quanto o app frontend simultaneamente e com hot reload ativo, execute:

```bash
npm run dev
```

O comando irá iniciar:
*   **Backend API** em: [http://localhost:3333](http://localhost:3333)
*   **Frontend Web** em: [http://localhost:5173](http://localhost:5173) (ou outra porta indicada no terminal)

---

## 👥 Usuários de Teste (Seed)

Após rodar o script de seed (`npm run db:seed`), você poderá acessar a plataforma usando os seguintes perfis:

| Função | E-mail | Senha | Permissões |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@heintrelinhas.com` | `admin123` | Acesso total, gerenciamento de posts, categorias e tags. |
| **EDITOR** | `editor@heintrelinhas.com` | `editor123` | Revisar posts pendentes e gerenciar tags/categorias. |
| **WRITER** | `writer@heintrelinhas.com` | `writer123` | Criar e editar seus próprios posts (salvar como rascunho ou enviar para revisão). |

---

## 💻 Comandos Úteis (Raiz)

Todos os comandos devem ser executados na raiz do projeto:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o backend e o frontend concorrentemente. |
| `npm run build` | Compila o frontend e o backend para produção. |
| `npm run db:up` | Sobe o container Docker do PostgreSQL. |
| `npm run db:down` | Derruba o container Docker do PostgreSQL. |
| `npm run db:migrate` | Executa as migrações do Prisma no banco de dados. |
| `npm run db:seed` | Alimenta o banco com dados de exemplo (Usuários, Categorias, Tags, Posts). |
| `npm run db:setup` | Cria o banco no Docker, aplica migrações e roda o seed. |
