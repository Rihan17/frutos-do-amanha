# Frutos do Amanhã — redesign "da semente ao fruto"

Site completo no visual novo: **25 telas**, as mesmas do site publicado em
`ong-frutos-do-amanha.onrender.com`, com o conteúdo real já no lugar.

## Como rodar

Não tem build. Abra a pasta **raiz do repositório** num servidor local:

- VS Code → extensão **Live Server** → botão direito em `redesign/index.html` → *Open with Live Server*
- ou no terminal, na raiz do repositório: `npx serve .` (ou `python -m http.server`) e acesse `/redesign/`

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
| `admin.html` | Painel administrativo |
| `mapa-do-site.html` | Todas as páginas |
| `privacidade.html` · `termos.html` | Documentos legais, com sumário lateral |

As telas com mais de um estado aceitam `?estado=` no endereço:
`confirmar-email.html?estado=confirmado`, `?estado=expirado`,
`redefinir-senha.html?estado=expirado`.

## Fotos

O site procura cada foto primeiro em `assets/img/` e depois em `../fotos-provisorias/`
(pasta na raiz do repositório), testando `.webp`, `.jpg`, `.jpeg` e `.png`.

Os nomes são **os mesmos do site publicado**, então copiar o `assets/img/` do site
atual para cá já resolve a maioria:

`hero-criancas` · `sede-vila-matias` · `feirinha-da-crianca` · `estudando-para-o-amanha` ·
`quermesse-beneficente` · `galeria-reforco` · `galeria-danca` · `galeria-informatica` ·
`galeria-arte` · `galeria-esporte` · `galeria-convivencia`

Faltam quatro que o site atual não tem: `pilar-empreendedorismo`, `feirinha-2`,
`estudando-2` e `quermesse-2`.

Onde a foto não existe aparece uma moldura hachurada com o nome do arquivo esperado.

## Estrutura

```
redesign/
├── *.html                       25 páginas
└── assets/
    ├── css/  tokens.css · base.css · components.css · paginas.css · home.css
    ├── js/   nucleo.js · efeitos.js · paginas.js · home.js
    └── img/  logo.svg · favicon.svg · rasgo*.svg · pix-qr-exemplo.svg
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
- `admin.html` → dados reais do painel (hoje são de exemplo)
- chave Pix e QR code → hoje são fictícios

## Pendências de conteúdo — [CONTEÚDO REAL AQUI]

- Chave Pix real e QR code correspondente
- Números reais da prestação de contas (os de `transparencia.html` são exemplo)
- Relatórios em PDF
- Fotos que faltam (lista acima)
- Imagem de compartilhamento `assets/img/og-home.jpg` (1200×630)
- Confirmar se os números de impacto são ~300/~250 ou +144/+88
