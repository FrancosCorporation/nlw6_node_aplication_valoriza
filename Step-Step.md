# Passo a passo de desenvolvimento

## Requisitos

- Node.js 22 ou superior
- npm
- Docker e Docker Compose para execução em contêiner

## Configuração local

1. Instale as dependências:

   ```bash
   npm ci
   ```

2. Copie `.env.example` para `.env` e defina `JWT_SECRET` com pelo menos 32 bytes aleatórios. Um valor pode ser gerado com:

   ```bash
   openssl rand -hex 32
   ```

3. Compile e inicie a aplicação:

   ```bash
   npm run build
   npm start
   ```

   Para desenvolver com reinicialização ao salvar arquivos, use `npm run dev`.

O TypeORM aplica migrations pendentes ao iniciar. O banco local é criado em `database/app.sqlite` e fica fora do Git.

## Primeiro administrador

Configure temporariamente `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env`; a senha deve ter no mínimo 12 caracteres. Depois do build, rode `npm run admin:create`. Esse comando cria uma conta administrativa nova e não promove contas existentes. Apague as variáveis `ADMIN_*` após o bootstrap.

## Docker Compose

Configure `JWT_SECRET` no `.env`, crie o administrador opcional com `docker compose --profile admin run --rm admin` e inicie a API com `docker compose up --build`. O volume `valoriza_database` persiste os dados entre reinicializações.

## Rotas

Consulte a tabela de métodos, rotas e autenticação no [README](README.md#recursos). A API fica disponível em `http://localhost:3000`; `GET /health` indica quando o banco foi inicializado.
