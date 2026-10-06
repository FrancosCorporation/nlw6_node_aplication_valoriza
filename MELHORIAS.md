# MELHORIAS — nlw6_node_aplication_valoriza

> **Gerado por análise de código em 2026-10-05** · Stack: Express + TypeORM/SQLite + JWT/bcrypt (NLW6) · Branch: `master`

## 0. Como usar este documento

- Cada item é autocontido e traz **arquivo:linha conferidos por leitura direta** — nenhum `arquivo:linha` foi estimado.
- **Severidade:** `[P0]` quebra/expõe hoje (fazer já) · `[P1]` risco real ou operação quebrada · `[P2]` dívida de qualidade · `[P3]` cosmético (nenhum neste plano).
- **Prefixos:** `SEC` segurança · `BUG` defeito funcional · `IMP` melhoria de produto · `TEST` testes · `DEVOPS` infra · `DOC` documentação.
- Campos por item: **Arquivo**, **Evidência**, **Impacto**, **Mudança**, **Aceite**, **Verificação** (bloco `bash` reproduzível em clone limpo).
- A **Verificação** é o contrato de aceite automatizável: rode-a antes de marcar o item como concluído.
- Comportamento do `jsonwebtoken` citado na `BUG-01` foi **testado empiricamente** com a versão `8.5.1` (a travada em `package-lock.json:1201-1203`), não deduzida.

## 1. Diagnóstico executivo

**O que está bem (confirmado por leitura):**

- **Senhas nunca em plaintext:** `hash(password, 8)` é aplicado **antes** do `save` (`src/services/CreateUserService.ts:28-34`) e o login usa `compare` do bcryptjs (`src/services/AuthenticateUserService.ts:28`).
- **Autorização em camadas:** `ensureAuthenticated` e `ensureAdmin` são middlewares próprios (`src/middlewares/`) encadeados nas rotas protegidas (`src/routes.ts:16` e `:18`), seguindo arquitetura controllers → services → repositories.
- **Senha fora do payload:** `@Exclude()` em `src/entities/User.ts:21-23` impede a senha de ser serializada nas respostas.
- **Erros centralizados** com `express-async-errors` e handler único (`src/server.ts:14-23`).
- **Regras básicas de cadastro:** e-mail ausente/duplicado rejeitado no serviço (`src/services/CreateUserService.ts:16-26`).

**O que está quebrado (detalhe nas seções 3-7):**

| Severidade | Problema |
| --- | --- |
| P0 | Banco SQLite **versionado no git** com usuários, hashes bcrypt e elogios (`SEC-01`) |
| P0 | Segredo de assinar JWT **hardcoded no código** + verificação com `NODE_TOKEN_HASH \|\| ''` (sem env, toda rota protegida retorna 401) (`BUG-01`) |
| P0 | **Escalação de privilégio:** `POST /users` aceita `admin` do body (`BUG-02`) |
| P1 | `ensureAdmin` depende de campo mutável via API e não trata usuário inexistente (`BUG-03`) |
| P1 | Dockerfile/entrypoint incoerentes com a aplicação (porta, `npm start`, compose inexistente) (`DEVOPS-01`) |
| P2 | Zero testes (`TEST-01`), `ormconfig`/imagem embutem o banco (`DEVOPS-02`), README descreve ambiente inexistente e não há `.env.example` (`DOC-01`), rotas de listagem não registradas e service de 0 bytes (`IMP-01`) |

## 2. Tabela de prioridades

| ID | Sev | Área | Resumo | Esforço |
| --- | --- | --- | --- | --- |
| SEC-01 | P0 | Segurança | Remover `src/database/databse.sqlite` do git + gitignore | Baixo |
| BUG-01 | P0 | Auth/JWT | Secret único via env (falhar no boot sem ele); remover literal e `\|\| ''` | Baixo |
| BUG-02 | P0 | Autorização | Ignorar `admin` vindo do body de `POST /users` | Baixo |
| BUG-03 | P1 | Autorização | `ensureAdmin`: tratar usuário inexistente, 403, admin só via script | Baixo |
| DEVOPS-01 | P1 | Infra | Dockerfile: porta, `ts-node`, `npm start`, compose ausente | Médio |
| TEST-01 | P2 | Testes | Primeira suíte (serviços + middleware) e script `test` | Médio |
| DEVOPS-02 | P2 | Infra | `ormconfig` fora do fonte, typo `databse`, `.dockerignore` com `*.sqlite` | Baixo |
| DOC-01 | P2 | Docs | README coerente + `.env.example` versionado | Baixo |
| IMP-01 | P2 | Produto | Registrar rotas de listagem; remover/aprovar `ListComplementByUser.ts` | Médio |

## 3. Segurança

### SEC-01 · Banco SQLite com dados de teste versionado no git · [P0]

- **Arquivo:** `src/database/databse.sqlite` (referenciado em `ormconfig.json:3`; `.gitignore:1-16` não o cobre)
- **Evidência:** `git ls-files` lista `src/database/databse.sqlite`; o arquivo tem **36.864 bytes**. `strings` no binário mostra o schema completo (`users`, `tags`, `compliments` com FKs), **2 hashes bcrypt `$2a$08$`**, nomes de usuários (ex.: `Rodolfo`, `Lideran`) e elogios em texto puro (ex.: `OBRIGADO MEU AMIGO CANCEIRA =`). O nome do arquivo contém o typo `databse`, idêntico ao `ormconfig.json:3`. O `.gitignore` atual só ignora `/node_modules`, `variables.ts`, `.env`, `.env.local`, `dist/`, `build/`, `*.log` e arquivos de IDE — **nenhum padrão para `*.sqlite`**.
- **Impacto:** qualquer pessoa que clone o repositório obtém dados e estrutura do banco (dados de teste hoje; reais se o projeto evoluir). Os hashes bcrypt ficam expostos a força-bruta offline (custo 8 é baixo). Agravante: remover só o arquivo do índice atual **não apaga o histórico git** — o blob continua acessível em commits antigos.
- **Mudança:** `git rm --cached src/database/databse.sqlite` (remove do índice mantendo o arquivo local) e adicionar ao `.gitignore` os padrões `*.sqlite` e `src/database/*.sqlite`. Atualizar `README.md:90` e `README.md:113`, que ainda descrevem o arquivo como "versionado com dados de teste". Para dado já publicado, avaliar `git filter-repo` (reescreve histórico — decisão do dono, ver §9) e tratar os hashes expostos como comprometidos em cenário real.
- **Aceite:** `git ls-files | grep sqlite` volta vazio; um clone limpo não tem o `.sqlite`; `yarn typeorm migration:run` recria o banco do zero; `.gitignore` cobre `*.sqlite`.
- **Verificação:**
  ```bash
  git ls-files | grep -i sqlite            # esperado: vazio
  grep -E '\*\.sqlite' .gitignore          # esperado: padrão presente
  yarn typeorm migration:run && test -f src/database/*.sqlite || ls src/database/
  ```

## 4. Bugs e defeitos funcionais

### BUG-01 · Segredo JWT hardcoded + verificação com secret `|| ''` · [P0]

- **Arquivo:** `src/services/AuthenticateUserService.ts:35-44` (assinatura) e `src/middlewares/ensureAuthenticated.ts:16` (verificação)
- **Evidência:** o `sign` usa o literal `"4f93ac9d10cb751b8c9c646bc9dbccb9"` (`AuthenticateUserService.ts:39`), enquanto o `verify` usa `process.env.NODE_TOKEN_HASH || ''` (`ensureAuthenticated.ts:16`). **Comportamento testado empiricamente** com `jsonwebtoken@8.5.1` (versão travada em `package-lock.json:1201-1203`):
  - `sign(payload, '')` lança `Error: secretOrPrivateKey must have a value` — mas **o login não usa a env**, então `POST /login` **não quebra**: ele sempre emite token assinado pelo literal hardcoded;
  - `verify(token, '')` lança `JsonWebTokenError: secret or public key must be provided` → cai no `catch` (`ensureAuthenticated.ts:23-24`) → **401**;
  - portanto, **sem `NODE_TOKEN_HASH` exportada no ambiente, login funciona mas toda rota protegida (`POST /tags`, `POST /compliments`) retorna 401** — falha de autorização, não erro cru de login;
  - se `NODE_TOKEN_HASH` for definida com valor **diferente** do literal → `invalid signature` → 401. Só funciona quando env **igual** ao literal do código.
  - Nenhum arquivo importa `dotenv`/`custom-env` (grep em `src/`: só `ensureAuthenticated.ts:16` lê `process.env`) — logo `.env` **não é carregado automaticamente**, apesar de `README.md:71` afirmar "o projeto usa `dotenv`" e de `dotenv@^10.0.0` estar em `package.json:16` sem uso.
- **Impacto:** (a) o segredo de assinatura está **público no repositório** — qualquer clonador forja token com `subject` de qualquer `user_id` e se passa por qualquer usuário, incluindo admin; (b) ambiente sem a env exportada tem **autorização 100% inoperante** (401 generalizado); (c) env com valor divergente do literal também quebra — o segredo efetivo é o literal, não a env.
- **Mudança:** usar **um único** segredo vindo do ambiente (ex.: `JWT_SECRET`), carregado uma vez no boot (`import "dotenv/config"` em `src/server.ts`, já que `dotenv` é dependência) ou injetado pela plataforma; **falhar no boot** se a env ausente/vazia; remover o literal de `AuthenticateUserService.ts:39`; trocar `|| ''` por verificação explícita (sem env, não sobe); criar `.env.example` documentando a variável (ver `DOC-01`).
- **Aceite:** sem a env, o processo **não sobe** e loga erro claro; com a env, `POST /login` + `POST /compliments` funcionam de ponta a ponta; `grep -R "4f93ac9d" src/` sem ocorrências; nenhum `|| ''` em chamadas de `verify`.
- **Verificação:**
  ```bash
  grep -R "4f93ac9d\||| ''" src/                      # esperado: sem ocorrências
  unset NODE_TOKEN_HASH; node -e "require('ts-node/transpile-only');" 2>/dev/null
  # com servidor limpo e SEM a env: POST /login gera token, mas
  curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/compliments \
       -H "Authorization: Bearer $TOKEN"   # esperado após fix: 400/401 coerente, nunca 401 generalizado por env ausente no boot
  ```

### BUG-02 · Escalação de privilégio: `admin` aceito no body do cadastro · [P0]

- **Arquivo:** `src/routes.ts:15`, `src/controllers/CreateUserController.ts:7` e `:11`, `src/services/CreateUserService.ts:13` e `:33`
- **Evidência:** `router.post("/users", createUserController.handle)` **não tem middleware** (`routes.ts:15`); o controller faz `const { name, email, admin, password } = request.body` e repassa `admin` ao serviço (`CreateUserController.ts:7,11`); o serviço declara `admin = false` como default (`CreateUserService.ts:13`), mas **o valor enviado no body tem precedência sobre o default** e é gravado no registro (`CreateUserService.ts:33`). A migration define `default: false` na coluna (`1624336354783-CreateUsers.ts:26-28`), valor anulado quando o body envia `admin: true`.
- **Impacto:** qualquer anônimo cria uma conta administradora por `POST /users {"admin":true}` e, em seguida, passa pelo `ensureAdmin` de `POST /tags` (`routes.ts:16`) — viola a regra "cadastro de tag só por administradores" (`README.md:55`).
- **Mudança:** remover `admin` do destructuring do controller e do `execute` do serviço (ignorar o campo da API); criação de admin apenas por script/migração de bootstrap controlada; se um dia houver promoção, será endpoint autenticado + `ensureAdmin`.
- **Aceite:** `POST /users` com `"admin": true` grava `admin = false` no banco; o token dessa conta recebe 401/403 em `POST /tags`.
- **Verificação:**
  ```bash
  curl -s -X POST localhost:3000/users -H 'Content-Type: application/json' \
    -d '{"name":"x","email":"x@x.com","password":"secret1","admin":true}'
  TOKEN=$(curl -s -X POST localhost:3000/login -H 'Content-Type: application/json' \
    -d '{"email":"x@x.com","password":"secret1"}' | python3 -c 'import sys,json;print(json.load(sys.stdin).token)')
  curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/tags \
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"t1"}'
  # esperado após fix: 401/403 (não 200)
  ```

### BUG-03 · `ensureAdmin`: decide por campo mutável e não trata usuário inexistente · [P1]

- **Arquivo:** `src/middlewares/ensureAdmin.ts:8` e `:13`, migration `src/database/migrations/1624336354783-CreateUsers.ts:26-28`, handler `src/server.ts:16-18`
- **Evidência:** a autorização lê o campo `admin` **do banco a cada request**: `const {admin} = await usersRepositories.findOne(user_id)` (`ensureAdmin.ts:8`) — coluna criada com `default: false` na migration (`CreateUsers.ts:26-28`) e sem valor fixo na entidade (`src/entities/User.ts:25-26`). Três defeitos concretos: (1) esse campo é **gravável por anônimo** via `POST /users` (ver `BUG-02`), então a autorização depende de dado manipulável pela própria API; (2) se `findOne` retornar `undefined` (token de usuário removido do banco), o destructuring lança `TypeError: Cannot destructure property 'admin' of 'undefined'`, que o handler central devolve como **400 com `err.message` crua** (`server.ts:16-18`) — status e corpo errados para falha de autenticação; (3) não-admin recebe **401** (`ensureAdmin.ts:13`) em vez de `403 Forbidden` (401 = "não autenticado", o usuário está autenticado).
- **Impacto:** cadeia de autorização sustentada em valor editável via API e em estado do banco sem tratamento de ausência; mensagens de erro inconsistentes ajudam a esconder falhas em testes manuais.
- **Mudança:** `const user = await usersRepositories.findOne(user_id); if (!user) return response.status(401).json({ error: "Unauthorized" });` antes de ler `admin`; trocar 401 → **403** para usuário autenticado não-admin; fechar a gravação de `admin` pela API (depende de `BUG-02`) e definir admin exclusivamente por script/migração de bootstrap.
- **Aceite:** token de usuário deletado devolve 401 JSON padronizado (sem mensagem `TypeError` crua); usuário comum em `POST /tags` recebe 403; nenhuma rota pública altera `admin`.
- **Verificação:**
  ```bash
  # usuário autenticado comum -> POST /tags
  curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/tags \
    -H "Authorization: Bearer $TOKEN_USER" -H 'Content-Type: application/json' -d '{"name":"t"}'
  # esperado: 403 (não 401, não 400)
  grep -n 'findOne(user_id)' src/middlewares/ensureAdmin.ts   # deve passar a tratar undefined
  ```

### IMP-01 · Rotas de listagem não registradas e service de 0 bytes · [P2]

- **Arquivo:** `src/routes.ts:15-18`, `src/services/ListComplementByUser.ts` (vazio), `src/controllers/ListTagsController.ts`, `ListUsersController.ts`, `ListUserSendComplimentsController.ts`, `ListUserReceiveComplimentsController.ts`
- **Evidência:** `src/routes.ts` registra apenas **4 rotas** (`/users`, `/tags`, `/login`, `/compliments` — linhas 15-18); os 5 controllers `List*` e os 4 services `List*` existem mas **nenhum tem rota**; `wc -c src/services/ListComplementByUser.ts` = **0** (arquivo vazio versionado); o próprio `README.md:45` admite a lacuna.
- **Impacto:** a API não expõe **nenhuma leitura** (impossível consultar elogios/usuários/tags pela interface HTTP); código morto e um arquivo vazio confundem manutenção e onboarding.
- **Mudança:** registrar `GET /tags`, `GET /users`, `GET /compliments/send`, `GET /compliments/receive` com `ensureAuthenticated` (e `/users` protegido por `ensureAdmin`, se exposto); implementar `ListComplementByUser` (query por usuário) ou **removê-lo** do repositório; atualizar o `README.md:45`.
- **Aceite:** cada controller `List*` alcançável por HTTP **ou** inexistente no repo; nenhum arquivo `.ts` com 0 bytes; `README.md:45` não mais lista a lacuna como pendente (ou documenta a remoção).
- **Verificação:**
  ```bash
  find src -name '*.ts' -size 0                      # esperado: vazio
  grep -c 'router\.' src/routes.ts                  # esperado: >= 8 (4 atuais + 4 de listagem)
  curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/tags \
       -H "Authorization: Bearer $TOKEN"            # esperado: 200
  ```

## 5. Qualidade: testes

### TEST-01 · Nenhum teste automatizado e nenhum script `test` · [P2]

- **Arquivo:** `package.json:6-10` (bloco `scripts`), repositório inteiro
- **Evidência:** `npm test` responde `npm ERR! Missing script: "test"`; a busca `find . -name '*.test.*' -o -name '*.spec.*'` (fora `node_modules`) não retorna arquivos; `jest`, `mocha`, `vitest` e `supertest` **não aparecem** em `package.json` nem no `package-lock.json` — os únicos scripts são `start`, `dev` e `typeorm` (`package.json:7-9`).
- **Impacto:** as regras de negócio centrais (e-mail único, senha hasheada, bloqueio de autoelogio, cadeia `ensureAuthenticated`/`ensureAdmin`) estão sem rede de segurança — qualquer refatoração (ex.: os fixes de `BUG-01`/`BUG-02`) pode regressar silenciosamente. Hoje a única "validação" é manual via `README`.
- **Mudança:** adotar `vitest` **ou** `jest` + `supertest` (devDependencies), com testes de unidade para `CreateUserService` (e-mail duplicado/ausente, senha `bcrypt.compare` round-trip) e `AuthenticateUserService` (senha errada, token `sub`), testes de middleware para 401/403 e 1 teste de integração `POST /users` → `POST /login` → `POST /compliments`; script `"test"` no `package.json`.
- **Aceite:** `npm test` existe e passa em clone limpo; ao menos uma cobertura por regra crítica acima; o fix de `BUG-02` tem teste impedindo `admin: true` no body.
- **Verificação:**
  ```bash
  npm test                                   # esperado: sai com código 0 e roda a suíte
  grep -q '"test"' package.json && echo OK   # script presente
  find src -name '*.test.ts' -o -name '*.spec.ts' | head   # >= 1 arquivo
  ```

## 6. DevOps / Infra

### DEVOPS-01 · Dockerfile e scripts de execução incoerentes com a aplicação · [P1]

- **Arquivo:** `Dockerfile:6-8`, `src/server.ts:26`, `package.json:7`, `README.md:10` e `:17`
- **Evidência:** (a) `ENV PORT=3333` e `EXPOSE 3333` (`Dockerfile:6-7`), mas `src/server.ts:26` faz `app.listen(3000, ...)` com **porta fixa** — a env `PORT` é ignorada e o `EXPOSE` anuncia porta que a aplicação não atende; (b) `CMD ["npx","ts-node","--transpile-only","src/server.ts"]` (`Dockerfile:8`) depende de `ts-node`, que **não é dependência direta** do `package.json` (só chega transitivamente via `ts-node-dev@^1.1.6`, `devDependencies`, que requer `ts-node@^9.0.0` — `package-lock.json:2248-2263`); um `npm ci --omit=dev` ou a troca do `ts-node-dev` quebra a imagem; (c) `npm start` = `node src/server.ts` (`package.json:7`) e o `README.md:17` manda usá-lo — **testado em `node v22.22.1`**: falha com `ERR_UNKNOWN_FILE_EXTENSION`/`SyntaxError` (Node não executa TypeScript nativamente); (d) `README.md:10` manda `docker compose up --build`, mas **não existe `docker-compose.yml`/`compose.yaml`** no repo (ausente de `git ls-files` e do `ls` da raiz), apesar do commit `93f60b7` citar "docker-compose".
- **Impacto:** instruções oficiais de execução (local e Docker) falham; porta anunciada é inalcançável; build depende de acidente de resolução de dependências.
- **Mudança:** `const port = Number(process.env.PORT) || 3000; app.listen(port)` e `EXPOSE` coerente; declarar `ts-node` explicitamente em `devDependencies` (ou transpilar para `dist/` e rodar `node dist/server.js` na imagem); corrigir `"start"` para usar `ts-node`/`ts-node-dev` (ou build prévio); versionar `docker-compose.yml` **ou** corrigir o `README.md:10` para `docker build` + `docker run`.
- **Aceite:** `docker build -t valoriza . && docker run -p 3000:3000 valoriza` responde em `localhost:3000` (ou porta anunciada = atendida); `PORT=8080 npm start` sobe em 8080; `npm start` não lança erro de sintaxe/extensão.
- **Verificação:**
  ```bash
  grep -n 'app.listen' src/server.ts                  # deve ler process.env.PORT
  grep -n 'EXPOSE' Dockerfile                         # deve bater com a porta atendida
  npm start & sleep 5; curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/login \
    -H 'Content-Type: application/json' -d '{"email":"a@b.c","password":"x"}'; kill %1
  # esperado: 400/401 da API (não crash do Node)
  ```

### DEVOPS-02 · `ormconfig` aponta para arquivo dentro do fonte e a imagem embute o banco · [P2]

- **Arquivo:** `ormconfig.json:3`, `.dockerignore:1-7`, `Dockerfile:5`, `src/database/index.ts:1-3`
- **Evidência:** `ormconfig.json` define `"database":"src/database/databse.sqlite"` — caminho **dentro do código-fonte** e com o typo `databse` (propagado ao `README.md:90`); o `.dockerignore` cobre `node_modules`, `.git`, `dist`, `build`, `*.log`, `.env` — **não cobre `*.sqlite`** — e o `Dockerfile:5` faz `COPY . .`, embutindo o banco versionado dentro da imagem; `src/database/index.ts` apenas chama `createConnection()` sem rodar migrations nem garantir diretório fora do fonte; não há instrução de volume/persistência. (Resultado direto de `SEC-01`: enquanto o `.sqlite` estiver versionado, ele entra na imagem.)
- **Impacto:** imagem distribuída com dados; estado do schema gerenciado por arquivo commitado em vez de migrations; typo `databse` virou nomenclatura oficial do projeto.
- **Mudança:** mover o caminho para diretório fora do fonte com typo corrigido (ex.: `database/app.sqlite`, criado no boot), **ou** manter em `src/database/` mas com `*.sqlite` no `.gitignore` (feito em `SEC-01`) e no `.dockerignore`; rodar `typeorm migration:run` no boot (script `start` ou entrypoint do container); corrigir a menção no `README.md:90`.
- **Aceite:** nenhum `*.sqlite` presente na imagem; caminho do `ormconfig.json` sem typo `databse`; container sobe com schema criado por migrations.
- **Verificação:**
  ```bash
  grep -c 'databse' ormconfig.json README.md           # esperado: 0
  grep -E '\*\.sqlite' .dockerignore                   # esperado: padrão presente
  docker build -t valoriza . && docker run --rm valoriza sh -c 'find / -name "*.sqlite" 2>/dev/null'  # esperado: vazio
  ```

## 7. Documentação

### DOC-01 · README/Step-Step descrevem um ambiente que não existe · [P2]

- **Arquivo:** `README.md:10`, `:17`, `:66`, `:71`, `:77-81`, `:90`, `:113`; `Step-Step.md:53-55`; ausência de `.env.example` na raiz
- **Evidência:** (a) `README.md:71` afirma "o projeto usa `dotenv`" e `README.md:66` o lista na stack, mas **nenhum arquivo importa `dotenv` nem `custom-env`** (grep em `src/`: o único `process.env` é `ensureAuthenticated.ts:16`) — as libs estão só instaladas (`package.json:15-16`); (b) **`.env.example` não existe** e o `.gitignore:3` descarta `.env` — a única documentação de `NODE_TOKEN_HASH` é prosa livre em `README.md:77-81`; (c) `README.md:10` manda `docker compose up --build` sem `docker-compose.yml` no repo (ver `DEVOPS-01`); (d) `README.md:17` manda `npm start`, que falha (ver `DEVOPS-01`); (e) `README.md:90` e `:113` ainda descrevem `src/database/databse.sqlite` como "arquivo versionado com dados de teste" (ver `SEC-01`/`DEVOPS-02`); (f) `Step-Step.md` termina em `yarn add dotenv` (`:55`) sem nenhum passo de configuração de ambiente.
- **Impacto:** um desenvolvedor seguindo o README literalmente falha em 3 pontos (compose inexistente, `npm start` quebrado, env que não carrega); o "bom" do `bcrypt`/`dotenv` documentado não corresponde ao código; onboarding lento e confuso.
- **Mudança:** criar `.env.example` versionado com `NODE_TOKEN_HASH` (ou `JWT_SECRET` pós-`BUG-01`) e `PORT`; corrigir `README.md:66,71` (dotenv só passa a valer após o fix de `BUG-01`, então escrever o estado real), `README.md:10,17` conforme `DEVOPS-01` e `README.md:90,113` conforme `SEC-01`; acrescentar ao `Step-Step.md` a nota de que `.env` é obrigatório e que nenhum loader está configurado hoje.
- **Aceite:** `.env.example` existe e cobre **todas** as `process.env.*` usadas em `src/` (hoje: `NODE_TOKEN_HASH`); seguindo o README de um clone limpo, chega-se ao `POST /login` respondendo sem passos não documentados; nenhuma afirmação sobre `dotenv` sem o import correspondente.
- **Verificação:**
  ```bash
  test -f .env.example && grep -q NODE_TOKEN_HASH .env.example && echo OK
  comm -3 <(grep -rho 'process\.env\.[A-Z_]*' src/ | sort -u | sed 's/process\.env\.//') \
          <(grep -o '^[A-Z_]*' .env.example | sort -u)      # esperado: saída vazia
  grep -rn 'dotenv' src/ | head                             # após fix: import presente
  ```

## 8. Ordem de execução (waves)

- **Wave 1 — P0 (parar a sangria; esforço baixo, fazer imediatamente):**
  1. `SEC-01` — tirar `databse.sqlite` do índice + `*.sqlite` no `.gitignore` (5 min, bloqueia vazamento novo).
  2. `BUG-01` — secret único via env com falha no boot; remover literal e `|| ''` (fecha forja de token e o 401 fantasma).
  3. `BUG-02` — ignorar `admin` do body (fecha escalação de privilégio).
- **Wave 2 — P1 (autoria/infra confiável):**
  4. `BUG-03` — endurecer `ensureAdmin` (undefined → 401 JSON; não-admin → 403).
  5. `DEVOPS-01` — porta via `PORT`, `npm start` funcional, `ts-node` declarado, compose ou README corrigido.
- **Wave 3 — P2 (qualidade e manutenção):**
  6. `TEST-01` — suíte mínima cobrindo os fixes das Waves 1-2 (especialmente `BUG-02`).
  7. `DEVOPS-02` — caminho do SQLite fora do fonte (typo corrigido), `.dockerignore` com `*.sqlite`, migrations no boot.
  8. `DOC-01` — `.env.example` + README coerente com o código pós-fixes.
  9. `IMP-01` — registrar rotas de listagem e resolver `ListComplementByUser.ts`.
- **Regra de dependência:** `DEVOPS-02` e `DOC-01` só depois de `SEC-01` (senão a doc/gitignore se contradizem); `TEST-01` idealmente após `BUG-01`/`BUG-02` para travar os comportamentos novos; `IMP-01` por último (produto, não risco).

## 9. Fora de escopo / riscos

- **Reescrita do histórico git** (`git filter-repo` para apagar o blob do `.sqlite` de commits antigos): recomendada em `SEC-01`, mas **muda hashes de commit** e exige coordenação com quem já clonou — decisão consciente do dono. Risco de não fazer: dados continuam recuperáveis no histórico.
- **Rotação real dos segredos expostos:** o literal do `BUG-01` e os hashes do `SEC-01` já estão publicados; em produção real exigiria troca de segredo e reset de senhas — aqui é projeto de estudo, fica registrado como lição.
- **Unificar gerenciador de pacotes:** o repo versiona **`package-lock.json` e `yarn.lock` ao mesmo tempo** (`git ls-files`) e o README mistura `npm`/`yarn` — padronizar um só, mas mexe em fluxo de trabalho de quem usa o projeto.
- **Arquitetura/segurança avançada:** HTTPS/Helmet/rate-limit em `POST /login`, refresh tokens, container não-root e CI — fora do escopo deste plano (projeto de estudo NLW6), salvo se o projeto for a produção.
- **Banco de produção / migração de dados:** não há produção; o plano assume recriação por migrations (`typeorm migration:run`). Se houvesse dados reais, `SEC-01` ganharia plano de migração de dados fora do git.
- **Não verificar runtime completo:** as verificações de `curl` pressupõem `yarn install` + servidor no ar; as verificações estáticas (`grep`, `git ls-files`, `find`) rodam em qualquer clone.

## 10. Definição de pronto (DoD)

- [ ] `git ls-files | grep -i sqlite` vazio e `*.sqlite` no `.gitignore` e no `.dockerignore` (`SEC-01`, `DEVOPS-02`).
- [ ] Nenhum segredo em código: `grep -R "4f93ac9d" src/` sem hits; boot **falha** sem a env de JWT; login + rota protegida funcionam **com** a env (`BUG-01`).
- [ ] Nenhum `|| ''` em `verify`; `.env.example` cobre todas as `process.env.*` de `src/` (`BUG-01`, `DOC-01`).
- [ ] `POST /users` com `admin:true` resulta em `admin=false`; `POST /tags` com conta comum → 403 (`BUG-02`, `BUG-03`).
- [ ] `ensureAdmin` responde 401 JSON para usuário inexistente (sem `TypeError` crua) e 403 para não-admin (`BUG-03`).
- [ ] `npm test` existe e passa; há teste que regressa `BUG-02` (`TEST-01`).
- [ ] `PORT` respeitada por `app.listen`; `npm start` sobe; `docker build` + `docker run` responde na porta anunciada; compose existe ou o README não o cita (`DEVOPS-01`).
- [ ] README segue-se de clone limpo até `POST /login` responder; nenhuma afirmação divergente do código (`DOC-01`).
- [ ] `find src -name '*.ts' -size 0` vazio e rotas de listagem registradas ou código removido (`IMP-01`).
- [ ] Todos os itens desta tabela com `Verificação` executada com o resultado esperado.

*Fim do plano. Gerado por leitura direta do código em 2026-10-05 (10 arquivos lidos por completo), com o comportamento do `jsonwebtoken@8.5.1` verificado empiricamente em instalação isolada — nenhum `arquivo:linha` foi inferido.*






