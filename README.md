# nlw6_node_aplication_valoriza

## 🐳 Instalação e Execução (Docker) — recomendado

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose

### Rodar com Docker
```bash
docker compose up --build
```


### Sem Docker (local)
```bash
npm install
npm start
```
Servicos necessarios (local): sqlite


**Projeto de estudo** — API REST "Valoriza" (cadastro de usuários, tags e elogios) desenvolvida durante a Next Level Week 6 da Rocketseat, trilha Node.js, em junho de 2021.

![TypeScript](https://img.shields.io/badge/TypeScript-4-3178C6?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js&logoColor=white)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green)
![Status](https://img.shields.io/badge/status-projeto%20de%20estudo-blue)

## Sobre

Back-end de estudo que aplica autenticação JWT, criptografia de senha com bcrypt e persistência SQLite via TypeORM. Usuários autenticados e administradores podem criar tags; usuários autenticados podem enviar elogios uns aos outros. Projetado como exercício de arquitetura em camadas (controllers → services → repositories → entities).

## Funcionalidades

Comprovadas pelo código:

- `POST /users` — cria usuário com validação de e-mail único e senha hasheada com bcrypt (`src/services/CreateUserService.ts`);
- `POST /login` — autentica e devolve token JWT com validade de 1 dia (`src/services/AuthenticateUserService.ts`);
- `POST /tags` — protegida por `ensureAuthenticated` + `ensureAdmin`; valida nome obrigatório e único (`src/routes.ts`, `src/middlewares/`);
- `POST /compliments` — protegida por `ensureAuthenticated`; impede autoelogio e valida se o destinatário existe (`src/services/CreateComplimentService.ts`);
- Entidades e migrations para `users`, `tags` e `compliments` em SQLite (`src/entities/`, `src/database/migrations/`);
- Serialização com `class-transformer` ocultando a senha (`@Exclude`) e expondo um campo customizado (`src/entities/User.ts`);
- Tratamento centralizado de erros com `express-async-errors` (`src/server.ts`).

**Incompleto (honestidade do estudo):** os controllers/services de listagem (tags, usuários, elogios enviados/recebidos) existem, mas **não estão registrados em `src/routes.ts`**; `src/services/ListComplementByUser.ts` está vazio.

### Regras de negócio do evento (checklist original preservado)

- Cadastro de usuário
  - [x] Não é permitido cadastrar mais de um usuário com o mesmo e-mail
  - [x] Não é permitido cadastrar usuário sem e-mail
- Cadastro de tag
  - [x] Não é permitido cadastrar tag sem nome
  - [x] Não é permitido cadastrar mais de uma tag com o mesmo nome
  - [x] Não é permitido o cadastro por usuários que não sejam administradores
- Cadastro de elogios
  - [x] Não é permitido um usuário cadastrar um elogio para si
  - [x] Não é permitido cadastrar elogios para usuários inválidos
  - [x] O usuário precisa estar autenticado na aplicação

## Stack

- **Node.js + Express 4** com **TypeScript**
- **TypeORM 0.2** + **SQLite** (`sqlite3`)
- **jsonwebtoken** (autenticação) e **bcryptjs** (hash de senha)
- **class-transformer**, **express-async-errors**, **dotenv**
- **ts-node-dev** para desenvolvimento

## Como rodar

Requer configuração de ambiente: o projeto usa `dotenv`, e o middleware de autenticação lê `process.env.NODE_TOKEN_HASH` (`src/middlewares/ensureAuthenticated.ts`).

```bash
yarn install
```

1. Crie um arquivo `.env` na raiz com a variável usada na verificação do token:

```env
NODE_TOKEN_HASH=sua_chave_secreta
```

2. Rode as migrations e suba o servidor:

```bash
yarn typeorm migration:run
yarn dev
```

A API sobe em `http://localhost:3000` (porta definida em `src/server.ts`). O banco SQLite fica em `src/database/databse.sqlite` (arquivo versionado com dados de teste).

## Estrutura do projeto

```
.
├── ormconfig.json
├── Step-Step.md              # anotações com os comandos do evento
└── src/
    ├── @types/express/       # extensão de tipos (user_id no Request)
    ├── controllers/          # camada HTTP
    ├── database/             # conexão + migrations + arquivo SQLite
    ├── entities/             # User, Tag, Compliments
    ├── middlewares/          # ensureAuthenticated, ensureAdmin
    ├── repositories/         # repositórios TypeORM
    ├── services/             # regras de negócio
    ├── routes.ts
    └── server.ts
```

## Observações

- O segredo usado para **assinar** o token em `src/services/AuthenticateUserService.ts` está fixo no código; apenas a **verificação** usa `NODE_TOKEN_HASH`. Em um projeto real o segredo deveria vir só do ambiente — fica registrado como lição aprendida.
- O arquivo versionado `src/database/databse.sqlite` contém dados de teste (nome com erro de digitação mantido como no original).

## Licença

MIT — veja [LICENSE](LICENSE).
