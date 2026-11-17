# ONG Frutos do Amanhã

**Site institucional e plataforma de apoio à gestão da organização**

## Apresentação

Este projeto reúne o site público da ONG Frutos do Amanhã e uma API com painel administrativo. A plataforma apresenta a atuação da organização, facilita o contato com a comunidade e concentra ferramentas para acompanhar solicitações, voluntariado, doações e conteúdo institucional.

## Finalidade

O sistema foi desenvolvido para aproximar a ONG das famílias, apoiadores e voluntários, oferecendo informações sobre projetos, ações, transparência e canais de participação. No painel administrativo, a equipe pode acompanhar registros e atualizar os dados que são publicados no site.

## Funcionalidades

### Site público

- Apresentação da ONG, sua história, projetos e notícias.
- Consulta de informações institucionais, como contatos, endereço, redes sociais e chave Pix.
- Página de transparência e páginas de privacidade e termos de uso.
- Formulário público para solicitação de vaga e formulário de candidatura a voluntariado.
- Doação por Pix, com chave e QR Code, e doação avulsa pelo Checkout Pro do Mercado Pago.
- Retorno para as páginas de sucesso, pendência ou falha do pagamento.

As atualizações de pagamento do Mercado Pago são recebidas pela API por meio de webhook. A opção de doação mensal na interface atual orienta o visitante a combinar a contribuição diretamente com a ONG.

### Painel administrativo

- Acesso da equipe por login protegido com token JWT.
- Visão geral de solicitações, voluntários, beneficiários e doações.
- Consulta e acompanhamento de solicitações de vaga e candidaturas de voluntariado.
- Gestão de projetos, notícias e informações institucionais.
- Consulta de doadores, doações, responsáveis, crianças/beneficiários e administradores.
- Filtros e indicadores para apoiar o acompanhamento das doações.

As solicitações de vaga e candidaturas públicas não exigem criação de conta. O acesso autenticado disponível na interface é destinado à equipe administrativa.

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript, sem etapa de compilação ou instalação de pacotes npm.
- **Backend:** Java 17, Spring Boot e API REST.
- **Banco de dados:** MongoDB.
- **Autenticação:** JWT Bearer para rotas protegidas.
- **Pagamentos:** Mercado Pago Checkout Pro e integração de notificações por webhook.
- **Publicação:** Docker e Render.

## Organização do repositório

```text
.
├── backend/          API Spring Boot, regras de negócio e acesso ao MongoDB
├── frontend/         páginas, estilos, imagens e integração com a API
├── Dockerfile        empacota frontend e backend para publicação
├── render.yaml       configuração do serviço no Render
└── DEPLOYMENT.md     instruções de publicação e configuração
```

## Executar localmente

### Requisitos

- Java 17 ou superior.
- MongoDB Atlas ou uma instância MongoDB acessível.
- OpenSSL para gerar a chave JWT (ou uma chave Base64 segura de pelo menos 32 bytes).
- Python 3 para servir o frontend localmente.

### 1. Iniciar a API

No Linux ou macOS, abra um terminal na pasta principal do repositório e configure as variáveis no mesmo terminal:

```bash
cd backend
export MONGODB_URI='mongodb+srv://USUARIO:SENHA@CLUSTER/ong_demo?retryWrites=true&w=majority'
export MONGODB_DATABASE='ong_demo'
export JWT_SECRET="$(openssl rand -base64 32)"
export ONG_ADMIN_EMAIL='admin@exemplo.org'
export ONG_ADMIN_NOME='Administrador local'
read -rsp 'Senha inicial do administrador: ' ONG_ADMIN_PASSWORD; echo
export ONG_ADMIN_PASSWORD
./mvnw spring-boot:run
```

Substitua `USUARIO`, `SENHA` e `CLUSTER` pelos dados do seu MongoDB Atlas. A senha do banco pode precisar de codificação URL caso contenha caracteres especiais. Libere o IP da sua rede em **Network Access** do Atlas e use, de preferência, um banco separado para desenvolvimento, como `ong_demo`.

O seed cria o primeiro administrador somente se o banco ainda não tiver um. `ONG_ADMIN_EMAIL` e `ONG_ADMIN_PASSWORD` são necessários nesse primeiro início e a senha deve ter ao menos 8 caracteres. Se já houver um administrador no banco, essas variáveis não criam outro.

Com a API em execução, ela fica disponível em `http://localhost:8080`.

### 2. Iniciar o site

Abra um segundo terminal na pasta principal do repositório e execute:

```bash
python3 -m http.server 5500 --directory frontend
```

Acesse `http://localhost:5500`. O frontend detecta o ambiente local e envia as chamadas para a API em `http://localhost:8080`.

No Windows, inicie a API com `cd backend` e `./mvnw.cmd spring-boot:run`, após configurar as mesmas variáveis de ambiente no PowerShell.

## Configurações e segurança

O arquivo `.env.example` documenta as variáveis utilizadas. A aplicação não deve receber credenciais reais em arquivos versionados: configure os valores no ambiente local ou na plataforma de hospedagem e mantenha `.env` fora do Git.

As variáveis mais importantes são:

| Variável | Uso |
| --- | --- |
| `MONGODB_URI` | Conexão com o MongoDB. |
| `MONGODB_DATABASE` | Nome do banco utilizado pela aplicação. |
| `JWT_SECRET` | Assinatura dos tokens de autenticação. |
| `ONG_ADMIN_EMAIL` e `ONG_ADMIN_PASSWORD` | Criação do primeiro administrador quando o banco ainda não possui um. |
| `MERCADOPAGO_ACCESS_TOKEN` | Credencial privada necessária para iniciar pagamentos pelo Mercado Pago. |
| `MERCADOPAGO_WEBHOOK_SECRET` | Validação das notificações de pagamento recebidas pelo webhook. |
| `APP_FRONTEND_BASE_URL` e `APP_BACKEND_PUBLIC_URL` | URLs públicas usadas nos redirecionamentos e na integração de pagamentos. |
| `APP_CORS_ALLOWED_ORIGINS` | Origens autorizadas a chamar a API pelo navegador. |

Para detalhes de publicação, Mercado Pago, recuperação de senha e endpoints, consulte [`DEPLOYMENT.md`](DEPLOYMENT.md) e [`backend/README.md`](backend/README.md).

## Equipe

- Carlos Eduardo Correia - Backend
- Gabriel Pegetti de Carvalho - Documentação
- Jorge Americo Cannalonga Junior - Scrum Master
- Rihan da Silva Amorim - Frontend

