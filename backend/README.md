# ONG API

API REST em Java 17, Spring Boot e MongoDB Atlas. O site fica separado em `../frontend`.

## Configuração

A URI do MongoDB e a chave de assinatura JWT vêm do ambiente. Quando ainda não houver ADMIN, os dados do primeiro administrador também são lidos do ambiente. Gere uma chave Base64 de 32 bytes (ou mais) para `JWT_SECRET`.

PowerShell:

```powershell
$env:MONGODB_URI="mongodb+srv://..."
$env:JWT_SECRET="<chave-base64-com-pelo-menos-32-bytes>"
$env:ONG_ADMIN_EMAIL="admin@ong.org"
$env:ONG_ADMIN_PASSWORD="<senha-com-pelo-menos-8-caracteres>"
$env:ONG_ADMIN_NOME="Administrador"
$env:ONG_ADMIN_TELEFONE="11999999999"
.\mvnw.cmd spring-boot:run
```

Linux/macOS:

```bash
export MONGODB_URI='mongodb+srv://...'
export JWT_SECRET='<chave-base64-com-pelo-menos-32-bytes>'
export ONG_ADMIN_EMAIL='admin@ong.org'
export ONG_ADMIN_PASSWORD='<senha-com-pelo-menos-8-caracteres>'
export ONG_ADMIN_NOME='Administrador'
export ONG_ADMIN_TELEFONE='11999999999'
./mvnw spring-boot:run
```

A chave pode ser gerada com `openssl rand -base64 32`. O seed cria o primeiro ADMIN se não existir nenhum. Se ainda não houver administrador, `ONG_ADMIN_EMAIL` e `ONG_ADMIN_PASSWORD` são obrigatórios para o seed inicial. A aplicação encerra a inicialização com uma mensagem clara quando os valores não estão configurados. O cadastro público sempre cria `COMUM`.

CORS permite `http://localhost:5500` e `http://127.0.0.1:5500` por padrão. Configure `APP_CORS_ALLOWED_ORIGINS` (origens separadas por vírgula) para alterar a lista.

## Mercado Pago

Doações únicas criam uma preferência Checkout Pro em `POST /doacoes`; planos mensais criam uma assinatura em `POST /planos`. Ambos persistem primeiro o registro no MongoDB e retornam `checkoutUrl`. O navegador redireciona para esse endereço. O estado pago só é atualizado após consulta autenticada ao Mercado Pago a partir de um webhook com assinatura `x-signature` válida.

Configure as credenciais no ambiente do backend. Use as credenciais de teste enquanto desenvolve e nunca grave o token ou o segredo do webhook no repositório ou no site: 

```bash
export MERCADOPAGO_ACCESS_TOKEN='TEST-... ou APP_USR-...'
export MERCADOPAGO_WEBHOOK_SECRET='segredo informado pelo Mercado Pago'
export APP_FRONTEND_BASE_URL='https://seu-site-publico.example'
export APP_BACKEND_PUBLIC_URL='https://sua-api-publica.example'
```

Em localhost, o checkout único pode ser criado, mas para receber atualizações automáticas de pagamento é preciso disponibilizar a API em HTTPS e cadastrá-la no Mercado Pago como `APP_BACKEND_PUBLIC_URL` (a URL base, sem caminho adicional). Configure o webhook para `POST /webhooks/mercadopago` e habilite notificações de pagamento, assinatura (`subscription_preapproval`) e cobranças autorizadas (`subscription_authorized_payment`). A assinatura mensal exige também um site público HTTPS em `APP_FRONTEND_BASE_URL`, pois o Mercado Pago precisa redirecionar o pagador para uma URL pública.

Os dados de projetos são administrados em Projetos; os contatos, redes sociais, endereço, horários e chave PIX ficam em Dados da ONG no mesmo painel.

## Recuperação de senha por e-mail

A recuperação usa tokens aleatórios de uso único, armazenados no MongoDB apenas como hash e com expiração de 60 minutos. O link é enviado pelo SMTP configurado abaixo; os endpoints nunca confirmam se um e-mail existe. Sem SMTP configurado, o endpoint responde `503` e não cria tokens.

Linux/macOS (use as credenciais SMTP do seu provedor; não as grave nos arquivos do projeto):

```bash
export APP_MAIL_ENABLED=true
export SMTP_HOST='smtp.seu-provedor.com'
export SMTP_PORT='587'
export SMTP_USERNAME='sua-conta'
export SMTP_PASSWORD='senha-ou-token-smtp'
export APP_MAIL_FROM='endereco-remetente-verificado'
export APP_FRONTEND_BASE_URL='http://localhost:5500'
export PASSWORD_RESET_EXPIRATION_MINUTES='60'
```

O provedor precisa autorizar o remetente. Para usar Gmail, configure uma senha de app, não a senha normal da conta. No ambiente publicado, defina `APP_FRONTEND_BASE_URL` para a origem HTTPS do site.

## Segurança e API

O login e o cadastro retornam um JWT Bearer. Envie `Authorization: Bearer <token>` nas rotas protegidas. Tokens expiram em 30 minutos por padrão (`APP_JWT_EXPIRATION_MINUTES`). A camada do cliente está em `../frontend/assets/js/api.js` e a URL é configurada em `../frontend/assets/js/api-config.js`.

- Público: `POST /auth/cadastro`, `POST /auth/login`, `POST /auth/esqueci-senha`, `POST /auth/redefinir-senha`, `POST /solicitacoes`, `GET /projetos`, `GET /projetos/{slug}`, `GET /publico/ong`
- Usuário comum: `GET/PUT /me`, `POST /doacoes`, `GET /doacoes/minhas`, `POST /planos`, `GET /planos/meus`, `PUT /planos/{id}/pausar|retomar|cancelar`, `POST /voluntarios`, `GET /voluntarios/minhas`, `PUT /voluntarios/{id}/encerrar`
- Administrador: `/adm/solicitacoes`, `/adm/beneficiarios`, `/adm/projetos`, `/adm/ong`, `/adm/voluntarios`, `/adm/doacoes`, `/adm/planos` e `/adm/usuarios`, conforme os métodos descritos em [docs/ong_db.md](docs/ong_db.md) e nos controllers.

As assinaturas recorrentes são cobradas pelo Mercado Pago; o agendador local de cobranças está desativado. `scripts/init-db.js` contém validações e índices para execução manual via `mongosh`; a aplicação também configura índices automaticamente.

## Verificação

```bash
./mvnw clean verify
```
