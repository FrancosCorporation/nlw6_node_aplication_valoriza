# Valoriza API

API REST de estudo para cadastro de usuários, tags e envio de elogios, criada durante a Next Level Week 6 da Rocketseat.

## Recursos

- Cadastro com senha hasheada e e-mail normalizado.
- Login com token JWT assinado por segredo obrigatório do ambiente.
- Criação de tags restrita a administradores.
- Listagem de tags, usuários (somente nome e ID) e elogios do próprio usuário.
- Banco SQLite local, com migrations aplicadas na inicialização.
- Endpoint público de saúde em `GET /health`.

| Método e rota | Acesso | Descrição |
| --- | --- | --- |
| `POST /users` | Público | Cria conta comum; o campo `admin` do corpo é ignorado. |
| `POST /login` | Público | Retorna um token Bearer. |
| `GET /health` | Público | Informa se a API está pronta. |
| `GET /users` | Autenticado | Lista IDs e nomes para selecionar destinatários. |
| `GET /tags` | Autenticado | Lista tags disponíveis. |
| `POST /tags` | Administrador | Cria uma tag. |
| `POST /compliments` | Autenticado | Envia um elogio para outro usuário. |
| `GET /users/compliments/send` | Autenticado | Lista elogios enviados pela conta autenticada. |
| `GET /users/compliments/receive` | Autenticado | Lista elogios recebidos pela conta autenticada. |

As rotas autenticadas recebem `Authorization: Bearer <token>`. Usuários comuns recebem `403` ao tentar criar tags; token ausente, inválido ou associado a uma conta removida recebe `401`.

## Execução local

Requisitos: Node.js 22 ou superior e npm. O contêiner usa Node.js 24 LTS.

```bash
npm ci
cp .env.example .env
```

Gere um segredo JWT forte e preencha `JWT_SECRET` em `.env`:

```bash
openssl rand -hex 32
```

Compile e inicie a API:

```bash
npm run build
npm start
```

Durante o desenvolvimento, use `npm run dev`. A aplicação valida o segredo e a porta antes de iniciar. O banco local fica em `database/app.sqlite`; as migrations são aplicadas automaticamente. Esse arquivo é ignorado pelo Git e tem acesso restrito no ambiente Linux.

### Criar o primeiro administrador

Defina temporariamente `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env`. A senha precisa ter ao menos 12 caracteres. Depois do build, execute:

```bash
npm run admin:create
```

O comando cria uma nova conta administrativa e não promove contas existentes. Remova as três variáveis administrativas do `.env` depois do uso. O cadastro público sempre cria contas comuns.

## Docker Compose

```bash
cp .env.example .env
# Preencha JWT_SECRET e, para o bootstrap, ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD.
docker compose --profile admin run --rm admin
# Remova as variáveis ADMIN_* do .env e suba a API:
docker compose up --build -d
```

O Compose persiste o SQLite em um volume, publica a porta configurada em `PORT` e executa o contêiner sem root. Para verificar a API, acesse `http://localhost:3000/health` (ou a porta definida no `.env`).

## Segurança

Veja [SECURITY.md](SECURITY.md) para configuração de segredos, proteção do banco e reporte privado de vulnerabilidades. O arquivo SQLite foi retirado da versão atual do repositório; um commit antigo ainda o contém no histórico Git.

## Desenvolvimento

```bash
npm run build
```

Não há suíte automatizada de testes neste repositório.

## Licença

MIT — veja [LICENSE](LICENSE).
