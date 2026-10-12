# Melhorias — nlw6_node_aplication_valoriza

Atualizado em 2026-10-12. Stack: Express 5, TypeORM 0.3, SQLite, JWT e bcryptjs.

## Itens

| ID | Prioridade | Estado | Implementação |
| --- | --- | --- | --- |
| SEC-01 | P0 | Concluído | SQLite removido do índice, movido localmente para `database/app.sqlite`, ignorado por Git/Docker e protegido com permissão local `0600`. |
| BUG-01 | P0 | Concluído | JWT exige `JWT_SECRET` com 32 bytes no boot; assinatura e verificação usam HS256. |
| BUG-02 | P0 | Concluído | Cadastro ignora `admin`; administrador só é criado por comando operacional separado. |
| BUG-03 | P1 | Concluído | Middleware consulta a conta no banco antes de aceitar o JWT; conta removida recebe `401` e usuário sem privilégio recebe `403`. |
| DEVOPS-01 | P1 | Concluído | Build para `dist`, `npm start` executável, porta configurável e Compose persistente com contêiner não-root. |
| DEVOPS-02 | P2 | Concluído | SQLite fica fora de `src`; `DataSource` aplica migrations no boot e o build de Docker exclui dados locais. |
| DOC-01 | P2 | Concluído | README, `.env.example`, SECURITY e este guia descrevem a configuração real. |
| IMP-01 | P2 | Concluído | Rotas de listagem registradas, autenticadas e limitadas aos dados necessários do usuário. |
| SEC-02 | P1 | Concluído | Dependências diretas atualizadas; `npm audit` sem vulnerabilidades reportadas. |
| SEC-03 | P1 | Concluído | Login e cadastro público limitados por IP para reduzir brute force e abuso de criação de contas. |
| DEVOPS-03 | P1 | Concluído | CI estática `38197516916` passou em Node 22/24: `npm ci`, audit alto e compilação TypeScript. |
| TEST-01 | P2 | Pendente | Esta versão não inclui uma suíte automatizada de testes. |

## Verificações estáticas

```bash
npm run build
npm audit --audit-level=high
docker compose config --quiet
git diff --check
```

CI `38197516916` passou nos jobs Node 22 e 24 com `npm ci`, audit e build. Não há testes no workflow.

Os testes de endpoint, inicialização do navegador/contêiner e integração não foram executados neste ciclo.

## Histórico do SQLite

O arquivo de banco não é mais enviado em commits novos, mas ainda pode ser recuperado em um commit antigo. A reescrita desse histórico requer coordenação com clones existentes e está documentada em [SECURITY.md](SECURITY.md).
