# ONG Frutos do Amanhã

Site e API da ONG Frutos do Amanhã, de São Vicente/SP, num repositório só. O backend
Spring Boot serve as páginas e a API no mesmo endereço, como já acontecia no projeto
original; o que mudou é que o site servido agora é o visual novo.

- **frontend/** — 45 páginas, todas no visual novo: 24 públicas, 10 do painel da
  equipe, o login, a recuperação de senha e as telas de retorno.
- **backend/** — API REST em Java 17 com Spring Boot e MongoDB, trazida do repositório
  `Kdu13/ong-frutos-do-amanha`.

## Como rodar

Precisa de Java 17 ou mais novo, Maven (o `mvnw` do próprio projeto serve) e um MongoDB
acessível. Sem banco o backend **não sobe**: ele cria os índices na partida.

```bash
# 1. um MongoDB local
docker run -d --name ong-mongo -p 27017:27017 mongo:7

# 2. a API, servindo o site da pasta frontend/
cd backend
MONGODB_URI="mongodb://localhost:27017/ong" JWT_SECRET="troque-por-um-segredo-longo-de-verdade" ONG_ADMIN_EMAIL="voce@example.com" ONG_ADMIN_PASSWORD="umaSenhaForte" ./mvnw spring-boot:run -Dspring-boot.run.arguments=--spring.web.resources.static-locations=file:../frontend/
```

O site fica em <http://localhost:8080> e o painel da equipe em
<http://localhost:8080/gestao>. As variáveis estão todas em `.env.example`.

Para mexer só no visual, sem subir a API, basta servir a pasta `frontend/`
(`npx serve frontend`): as páginas abrem normalmente e o que depende da API mostra o
conteúdo de exemplo que está no HTML.

A publicação no Render usa o `Dockerfile`, que copia `frontend/` para dentro de
`backend/src/main/resources/static/` e sobe um serviço só. Veja
[`DEPLOYMENT.md`](DEPLOYMENT.md).

## O que fala com a API

| Tela | Endpoint | O que faz |
| --- | --- | --- |
| `doar.html` | `POST /doacoes/publico` | cria a doação e leva ao Mercado Pago |
| `voluntariado.html` | `POST /voluntarios/publico` | registra a candidatura |
| `solicitar-vaga.html` | `POST /solicitacoes` | registra o pedido e devolve o protocolo |
| `redefinir-senha.html` | `POST /auth/redefinir-senha` | usa o `?token=` do e-mail |
| `doar.html`, `como-ajudar.html`, `index.html` | `GET /projetos`, `GET /publico/ong` | lista de destinos e chave Pix de verdade |
| `gestao.html` | `POST /auth/login` | entrada da equipe no painel |
| `esqueci-senha.html` | `POST /auth/esqueci-senha` | pede o link de recuperação |
| `admin*.html` | `/adm/**` e `/projetos` | o painel inteiro |

Os formulários públicos ficam em `frontend/assets/js/ligacao.js` e o painel em
`painel.js`. Os dois cuidam só do que está marcado com `data-api` ou `data-painel` no
HTML; o resto continua sendo maquete, validada pelo `paginas.js`.

## As telas

| Arquivo | O que é |
| --- | --- |
| `index.html` | Home — a narrativa completa, da semente ao fruto |
| `quem-somos.html` | História, linha do tempo animada, missão, pilares, galeria |
| `projetos.html` | Os dois projetos ativos + atividades da semana |
| `projeto-feirinha-da-crianca.html` | Detalhe do projeto |
| `projeto-estudando-para-o-amanha.html` | Detalhe da campanha |
| `transparencia.html` | Dados da ONG, barras de aplicação, números, relatórios |
| `como-ajudar.html` | Pix, plataforma, itens e voluntariado (com âncoras) |
| `doar.html` | Formulário de doação com valor, destino e resumo |
| `voluntariado.html` | Áreas, como funciona e formulário de candidatura |
| `solicitar-vaga.html` | Formulário para as famílias |
| `contato.html` | Canais, endereço, horários e mapa |
| `noticias.html` | Lista editorial das notícias |
| `noticia-quermesse-beneficente.html` | Matéria |
| `noticia-entrega-julho.html` | Matéria |
| `noticia-lista-material.html` | Matéria |
| `doar-sucesso.html` · `doar-pendente.html` · `doar-falha.html` | Retornos do pagamento |
| `confirmar-email.html` | Três estados: aguardando, confirmado, expirado |
| `redefinir-senha.html` | Dois estados: formulário e link expirado |
| `404.html` | Página não encontrada |
| `mapa-do-site.html` | Todas as páginas |
| `privacidade.html` · `termos.html` | Documentos legais, com sumário lateral |

As telas com mais de um estado aceitam `?estado=` no endereço:
`confirmar-email.html?estado=confirmado`, `?estado=expirado`,
`redefinir-senha.html?estado=expirado`.

### O painel

A equipe entra por `gestao.html` (também em `/gestao`). Essa tela está **no visual
novo** e usa `POST /auth/login`; o token fica em `sessionStorage`, ou em
`localStorage` se a pessoa marcar "continuar conectado".

O painel do dia a dia é o **do visual novo**, em `admin*.html`, com a ligação em
`painel.js`. É para onde o login leva. Cada tela traz `data-painel` no `<body>`, e o
arquivo descobre qual é, exige o token e troca o conteúdo de exemplo pelo que veio do
banco.

| Tela | Lê | Faz |
| --- | --- | --- |
| `admin.html` | tudo, para os 11 números e as últimas doações | — |
| `admin-solicitacoes.html` | `/adm/solicitacoes` | aprovar e recusar |
| `admin-voluntarios.html` | `/adm/voluntarios` | aprovar e recusar |
| `admin-criancas.html` | `/adm/beneficiarios` | — |
| `admin-responsaveis.html` | `/adm/beneficiarios`, agrupado por responsável | — |
| `admin-doadores.html` | `/adm/doacoes`, somado por pessoa | — |
| `admin-doacoes.html` | `/adm/doacoes` | registrar doação recebida à mão |
| `admin-projetos.html` | `/adm/projetos` | publicar projeto |
| `admin-usuarios.html` | `/adm/usuarios` | criar acesso, promover, rebaixar |
| `admin-noticias.html` | — | — |

O rodapé de todas as páginas tem **Painel da equipe**, ao lado de Mapa do site,
Privacidade e Termos. Ele leva ao login, não ao painel: quem não estiver autenticado
não passa dali, e as telas do painel devolvem para o login sem token.

A barra do cabeçalho é a mesma nas 36 páginas — Quem somos, Projetos, Como ajudar,
Voluntariado e Solicitar Vaga — e cada página acende o seu item com
`aria-current="page"`. Transparência saiu da barra e continua no menu completo, na
lista do rodapé e nos links do texto.

Duas ressalvas do painel novo. **Notícias** não tem API: são páginas HTML do próprio
site, e a tela diz isso em vez de fingir uma lista. E os formulários de **criança** e
**responsável** seguem como maquete, porque a API não tem como criá-los direto — uma
criança nasce ao aprovar uma solicitação de vaga.

## Fotos

As fotos vivem em `assets/img/`, ao lado dos SVGs da interface. Para cada nome o site
tenta `.webp`, `.jpg`, `.jpeg` e `.png`, nessa ordem, e fica com o primeiro que existir
— hoje isso custa uma requisição perdida no `.webp` antes de achar o `.jpg`, que some
no dia em que os `.webp` forem gerados.

As 17 fotos que as páginas pedem estão todas no lugar:

`hero-criancas` · `sede-vila-matias` · `feirinha-da-crianca` · `feirinha-2` ·
`estudando-para-o-amanha` · `estudando-2` · `quermesse-beneficente` · `quermesse-2` ·
`pilar-empreendedorismo` · `lista-material` · `entrega-julho` · `galeria-reforco` ·
`galeria-danca` · `galeria-informatica` · `galeria-arte` · `galeria-esporte` ·
`galeria-convivencia`

Onde uma foto não existir aparece uma moldura hachurada com o nome do arquivo esperado.

## Estrutura

```
.
├── backend/                     API Spring Boot (Java 17) + MongoDB
│   └── src/main/java/br/org/ong/
│       ├── controller/          endpoints REST
│       ├── service/             regras
│       ├── model/ repository/   documentos e acesso ao Mongo
│       └── security/            JWT e quem pode o quê
├── frontend/
│   ├── *.html                   24 páginas públicas do visual novo
│   ├── gestao.html              login da equipe, visual novo (também em /gestao)
│   ├── admin*.html              painel da equipe, visual novo, ligado por painel.js
│   ├── esqueci-senha.html       pede o link de recuperação de senha
│   └── assets/
│       ├── css/  tokens · base · components · paginas · home
│       ├── js/   nucleo · efeitos · paginas · home · api · ligacao · vendor/
│       └── img/  as 17 fotos e os SVGs da interface
├── Dockerfile                   build único: Maven + o site dentro do jar
├── render.yaml
└── DEPLOYMENT.md
```

- `tokens.css` — cores, fontes, espaçamentos e curvas de animação, tudo em `:root`
- `components.css` — cabeçalho, menu, botões, cursor, cortina, bloco Pix, FAQ, rodapé
- `paginas.css` — só as páginas internas; `home.css` só a Home
- `nucleo.js` — configuração, rolagem suave e carregamento das fotos
- `efeitos.js` — o que é igual em todas as páginas
- `paginas.js` — linha do tempo, contadores, barras, formulários e estados de tela
- `api.js` / `api-config.js` — cliente HTTP e descoberta do endereço da API
- `ligacao.js` — os formulários públicos que falam com a API
- `painel.js` — o login da equipe e as dez telas do painel no visual novo
- `api.js` / `api-config.js` — cliente HTTP e descoberta do endereço da API

## Bibliotecas (cópias locais em `assets/js/vendor/`, com `defer`)

| Biblioteca | Versão | Para quê |
| --- | --- | --- |
| GSAP + ScrollTrigger | 3.15.0 | raiz desenhada no scroll, galeria horizontal, contadores, intro |
| GSAP SplitText | 3.15.0 | títulos revelados linha a linha com máscara |
| Lenis | 1.3.26 | rolagem suave (desligada no toque e com "reduzir movimento") |

As bibliotecas ficam dentro do próprio site, e não num CDN, porque redes de faculdade e
de empresa costumam bloquear CDNs, e sem o GSAP todas as animações ficam desligadas.
Os arquivos são os mesmos do jsDelivr, conferidos pelo hash. Para atualizar uma versão,
baixe o arquivo novo para `assets/js/vendor/` e mantenha o mesmo nome.
O GSAP tem licença própria (<https://gsap.com/standard-license>); o Lenis é MIT.

Fontes: Fraunces (Google Fonts) e Satoshi (Fontshare) **ainda vêm de fora**. Se a rede
bloquear esses endereços, o site cai para Georgia e Segoe UI.

## Acessibilidade e movimento

- Intro da Home: fica na tela até a pessoa rolar (mouse, arrastar no celular ou seta/espaço/Enter). Só na primeira visita da sessão.
- `prefers-reduced-motion`: sem intro animada, raiz já desenhada, números finais, galeria vira carrossel.
- Celular/toque: sem cursor customizado nem botões magnéticos; galeria com `scroll-snap`.
- Sem JavaScript: todo o conteúdo aparece normalmente.
- Contraste conferido: todas as combinações de texto passam em WCAG AA.

## O que ainda não está ligado

Os formulários públicos já enviam de verdade. O que falta:

- **Edições que ficaram sem tela.** O painel anterior foi removido, e com ele sumiram
  da interface: editar os dados da ONG, editar e encerrar voluntário, apagar
  solicitação, editar e apagar projeto, editar e desativar beneficiário. Os endpoints
  continuam na API (`PUT /adm/ong`, `PUT`/`DELETE` em `/adm/voluntarios/{id}`,
  `/adm/solicitacoes/{id}`, `/adm/projetos/{id}` e `/adm/beneficiarios/{id}`); falta a
  tela. Enquanto isso, essas operações só por chamada direta à API.
- **Página de projeto por slug.** O `projeto.html`, que montava a página de qualquer
  projeto a partir da API, saiu junto. Os dois projetos de hoje têm página própria
  escrita à mão, mas um projeto novo criado no painel fica sem página pública.
- **Páginas que não existem devolvem 500, não 404.** O `GlobalExceptionHandler` tem um
  `@ExceptionHandler(Exception.class)` que engole o `NoResourceFoundException` do
  Spring, então o `404.html` nunca aparece. É de antes desta junção.
- **Doação mensal.** A API cobra assinatura por `POST /planos`, que exige uma conta de
  doador, e o site não tem mais cadastro. Escolher "Todo mês" hoje mostra um recado
  pedindo para combinar pelo WhatsApp. Ou se cria outro caminho na API, ou a opção sai
  do formulário.
- **Retornos do pagamento.** O Mercado Pago volta para `doar-sucesso.html?doacao=<id>`,
  e as três telas ainda mostram um resumo de exemplo em vez de buscar a doação.
- **Notícias e projetos nas páginas públicas** seguem escritos no HTML. A API tem
  `GET /projetos`, e só o `select` de destino da doação usa isso hoje.
- **Área de conta do doador** (login, cadastro, histórico) foi retirada: as páginas não
  vieram, e no backend elas continuam bloqueadas na `SecurityConfiguration`. O endpoint
  `POST /auth/cadastro` que o site anterior chamava nunca existiu no controller.

## Pendências de conteúdo

- Números reais da prestação de contas (os de `transparencia.html` são exemplo)
- Relatórios em PDF
- Imagem de compartilhamento `assets/img/og-home.jpg` (1200×630): as meta tags de todas
  as páginas já apontam para ela, mas o arquivo ainda não existe
- Confirmar se os números de impacto são ~300/~250 ou +144/+88

A chave Pix saiu desta lista: `como-ajudar.html` e a home agora buscam a chave e o QR
code em `GET /publico/ong`. O que está no HTML é só o exemplo que aparece se a API não
responder.
