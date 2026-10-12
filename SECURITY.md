# Segurança

## Configuração e dados

- Não versione `.env`, chaves JWT, senhas administrativas ou o banco SQLite.
- Configure `JWT_SECRET` com pelo menos 32 bytes imprevisíveis; `openssl rand -hex 32` gera um valor adequado.
- O cadastro público não pode atribuir privilégios administrativos. Use `npm run admin:create` apenas para criar uma conta nova e remova as variáveis `ADMIN_*` depois.
- O SQLite é salvo em `database/app.sqlite`, ignorado pelo Git e pelo Docker build. Em Linux, a aplicação restringe permissões locais e o contêiner roda como usuário não-root.
- Rotacionar `JWT_SECRET` invalida os tokens já emitidos.
- `POST /login` limita tentativas malsucedidas a 10 por IP em 15 minutos; `POST /users` limita cadastros a 30 por IP por hora. O contador é local ao processo. Em proxy reverso ou múltiplas réplicas, configure o IP confiável e um store compartilhado de forma compatível com a infraestrutura.

## Histórico do repositório

Um banco SQLite foi publicado em um commit antigo. A versão atual deixa de rastreá-lo e de copiá-lo para a imagem, mas isso não remove o blob dos commits anteriores. Trate os dados antigos como expostos. Reescrever o histórico exige coordenação com quem já clonou o repositório e deve ser feito em uma operação separada.

## Reporte de vulnerabilidades

Reporte vulnerabilidades pelo recurso privado **Report a vulnerability** da aba Security do GitHub. Não publique detalhes ou dados pessoais em issues públicas.
