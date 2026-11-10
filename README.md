# Frutos do Amanhã — "da semente ao fruto"

Site completo no visual novo: **34 telas**, com o conteúdo real já no lugar. Cobre o
site público, as mesmas páginas de `ong-frutos-do-amanha.onrender.com`, mais as dez
telas do painel administrativo.

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

### O painel

| Arquivo | O que é |
| --- | --- |
| `admin.html` | Visão geral — placares, pendências e atalhos |
| `admin-solicitacoes.html` | Solicitações de vaga das famílias |
| `admin-voluntarios.html` | Candidaturas de voluntariado |
| `admin-criancas.html` | Crianças atendidas |
| `admin-responsaveis.html` | Responsáveis legais |
| `admin-doadores.html` | Doadores |
| `admin-doacoes.html` | Doações recebidas |
| `admin-projetos.html` | Projetos e atividades |
| `admin-noticias.html` | Notícias publicadas |
| `admin-usuarios.html` | Administradores com acesso |

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
├── *.html                       34 páginas
└── assets/
    ├── css/  tokens.css · base.css · components.css · paginas.css · home.css
    ├── js/   nucleo.js · efeitos.js · paginas.js · home.js
    └── img/  as 17 fotos · logo.svg · favicon.svg · rasgo*.svg · pix-qr-exemplo.svg
```

- `tokens.css` — cores, fontes, espaçamentos e curvas de animação, tudo em `:root`
- `components.css` — cabeçalho, menu, botões, cursor, cortina, bloco Pix, FAQ, rodapé
- `paginas.css` — só as páginas internas; `home.css` só a Home
- `nucleo.js` — configuração, rolagem suave e carregamento das fotos
- `efeitos.js` — o que é igual em todas as páginas
- `paginas.js` — linha do tempo, contadores, barras, formulários e estados de tela

## Bibliotecas (via CDN, com `defer`)

| Biblioteca | Para quê |
| --- | --- |
| GSAP + ScrollTrigger | raiz desenhada no scroll, galeria horizontal, contadores, intro |
| GSAP SplitText | títulos revelados linha a linha com máscara |
| Lenis | rolagem suave (desligada no toque e com "reduzir movimento") |

Fontes: Fraunces (Google Fonts) e Satoshi (Fontshare).

## Acessibilidade e movimento

- Intro da Home: fica na tela até a pessoa rolar (mouse, arrastar no celular ou seta/espaço/Enter). Só na primeira visita da sessão.
- `prefers-reduced-motion`: sem intro animada, raiz já desenhada, números finais, galeria vira carrossel.
- Celular/toque: sem cursor customizado nem botões magnéticos; galeria com `scroll-snap`.
- Sem JavaScript: todo o conteúdo aparece normalmente.
- Contraste conferido: todas as combinações de texto passam em WCAG AA.

## O que ainda não está ligado

Esta etapa é **só visual**. Os formulários validam no navegador e mostram uma confirmação,
mas não enviam nada. Para ligar ao back-end, use os scripts do site atual
(`api-config.js`, `api.js`, `integracao.js`, `site-dados.js`) nos pontos marcados:

- `doar.html` → checkout do Mercado Pago
- `voluntariado.html` → endpoint de candidatura
- `solicitar-vaga.html` → endpoint de solicitação
- o painel → dados reais (hoje são de exemplo em todas as dez telas)
- chave Pix e QR code → hoje são fictícios

