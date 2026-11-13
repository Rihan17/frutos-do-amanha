/* ==========================================================
   Efeitos compartilhados: cabeçalho, menu, cursor, botões
   magnéticos, brotos no hover, cortina entre páginas, FAQ,
   revelações de título e cópia da chave Pix.
   ========================================================== */
(function () {
  'use strict';
  const FDA = window.FDA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const html = document.documentElement;
  const comMovimento = !FDA.reduz && FDA.temGSAP;

  /* ---------- Cabeçalho: tom claro/escuro, fundo e esconder ao descer ---------- */
  function cabecalho() {
    const topo = $('[data-topo]');
    if (!topo) return;
    const capitulos = $$('.capitulo');
    let ultimoY = window.scrollY;
    let pendente = false;

    function atualizar() {
      pendente = false;
      const y = window.scrollY;
      const linha = 44;
      let atual = null;
      for (const c of capitulos) {
        const r = c.getBoundingClientRect();
        if (r.top <= linha && r.bottom > linha) { atual = c; break; }
      }
      topo.classList.toggle('escuro', !!atual && atual.dataset.tom === 'escuro');
      topo.classList.toggle('solido', y > 80);
      const descendo = y > ultimoY + 4;
      const subindo = y < ultimoY - 4;
      if (!document.body.classList.contains('menu-aberto')) {
        if (descendo && y > 400) topo.classList.add('escondido');
        else if (subindo || y < 400) topo.classList.remove('escondido');
      }
      ultimoY = y;
      /* Aqui existia um bloco que acendia a âncora da seção em que a pessoa
         estava, de quando os links do cabeçalho eram âncoras (#manifesto) da
         mesma página. Agora eles apontam para outras páginas, e o bloco só
         sobrescrevia com aria-current="false" o aria-current="page" que cada
         página escreve no seu próprio item. */
    }
    window.addEventListener('scroll', () => {
      if (!pendente) { pendente = true; requestAnimationFrame(atualizar); }
    }, { passive: true });
    atualizar();
  }

  /* ---------- Âncoras com rolagem suave ---------- */
  function ancoras() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const alvo = document.querySelector(id);
      if (!alvo) return;
      e.preventDefault();
      fecharMenu();
      FDA.rolarPara(alvo);
      history.replaceState(null, '', id);
    });
  }

  /* ---------- Menu em tela cheia ---------- */
  let menuAberto = false;
  const menu = $('[data-menu]');
  const botaoMenu = $('[data-menu-botao]');
  function abrirMenu() {
    if (!menu) return;
    menuAberto = true;
    menu.classList.add('aberto');
    document.body.classList.add('menu-aberto');
    botaoMenu.setAttribute('aria-expanded', 'true');
    botaoMenu.querySelector('.botao-menu__texto').textContent = 'Fechar';
    FDA.lenis && FDA.lenis.stop();
    if (comMovimento) {
      gsap.fromTo($$('.menu__lista li', menu), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.9, delay: 0.2 });
    }
    setTimeout(() => { const l = $('a', menu); l && l.focus(); }, 150);
  }
  function fecharMenu() {
    if (!menu || !menuAberto) return;
    menuAberto = false;
    menu.classList.remove('aberto');
    document.body.classList.remove('menu-aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
    botaoMenu.querySelector('.botao-menu__texto').textContent = 'Menu';
    FDA.lenis && FDA.lenis.start();
  }
  function menuPrincipal() {
    if (!menu || !botaoMenu) return;
    botaoMenu.addEventListener('click', () => (menuAberto ? fecharMenu() : abrirMenu()));
    document.addEventListener('keydown', (e) => {
      if (!menuAberto) return;
      if (e.key === 'Escape') { fecharMenu(); botaoMenu.focus(); }
      if (e.key === 'Tab') {
        const focaveis = [botaoMenu, ...$$('a', menu)];
        const i = focaveis.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); focaveis[focaveis.length - 1].focus(); }
        else if (!e.shiftKey && i === focaveis.length - 1) { e.preventDefault(); focaveis[0].focus(); }
      }
    });
  }

  /* ---------- Cursor contextual ("ver", "arrastar", "doar") ---------- */
  function cursor() {
    const el = $('[data-cursor-el]');
    if (!el || FDA.toque) return;
    html.classList.add('tem-cursor');
    const texto = $('.cursor__texto', el);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, visivel = false;

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!visivel) { visivel = true; cx = x; cy = y; el.style.opacity = 1; }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { visivel = false; el.style.opacity = 0; });
    window.addEventListener('pointerdown', () => el.classList.add('pressionado'));
    window.addEventListener('pointerup', () => el.classList.remove('pressionado'));

    /* A bola do cursor e caqui, a mesma cor que pinta as faixas laranja:
       sobre elas o cursor some. Esta lista repete, do lado do JavaScript,
       os blocos que o CSS pinta com --caqui; ao entrar em um deles a bola
       troca para terra (regra .sobre-caqui no components.css).
       O que esta sob o cursor muda tanto quando o mouse anda quanto quando
       a pagina rola com ele parado, por isso a checagem mora no loop e nao
       em um evento de ponteiro. Ela so roda quando a posicao ou a rolagem
       mudaram, e elementFromPoint ignora o cursor, que e pointer-events:none. */
    const FUNDO_CAQUI = '.faixa--caqui, .capa--caqui, .chamada, .ajudar';
    let fx = -1, fy = -1, fscroll = -1;
    const verFundo = () => {
      const sy = window.scrollY;
      if (x === fx && y === fy && sy === fscroll) return;
      fx = x; fy = y; fscroll = sy;
      const sob = document.elementFromPoint(x, y);
      el.classList.toggle('sobre-caqui', !!(sob && sob.closest(FUNDO_CAQUI)));
    };

    const seguir = FDA.reduz ? 1 : 0.22;
    (function loop() {
      cx += (x - cx) * seguir;
      cy += (y - cy) * seguir;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      verFundo();
      requestAnimationFrame(loop);
    })();

    document.addEventListener('pointerover', (e) => {
      const alvo = e.target.closest('[data-cursor], a, button, summary, [role="button"]');
      el.classList.remove('rotulo', 'doar', 'link');
      if (!alvo) return;
      const tipo = alvo.getAttribute('data-cursor');
      if (tipo) {
        texto.textContent = tipo;
        el.classList.add('rotulo');
        if (tipo === 'doar') el.classList.add('doar');
      } else {
        el.classList.add('link');
      }
    });
  }

  /* ---------- Botões magnéticos (só com mouse) ---------- */
  function magneticos() {
    if (!comMovimento || FDA.toque) return;
    $$('[data-magnetico]').forEach((b) => {
      const txt = $('.botao__texto', b);
      const mx = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'power3.out' });
      const my = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'power3.out' });
      const tx = txt && gsap.quickTo(txt, 'x', { duration: 0.6, ease: 'power3.out' });
      const ty = txt && gsap.quickTo(txt, 'y', { duration: 0.6, ease: 'power3.out' });
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        mx(dx * 0.32); my(dy * 0.42);
        if (txt) { tx(dx * 0.12); ty(dy * 0.14); }
      });
      b.addEventListener('pointerleave', () => {
        gsap.to(b, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
        txt && gsap.to(txt, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
      });
    });
  }

  /* ---------- Microinteração: folhas e frutos brotam no hover ---------- */
  const FORMAS = {
    folha: '<path d="M2 16C3 7 9 2 17 2 16 10 11 16 2 16Z"/><path d="M2 16 11 7" stroke="rgba(0,0,0,.25)" stroke-width="1.2" fill="none"/>',
    caqui: '<circle cx="9" cy="10" r="7"/><path d="M9 3C8 1 10 0 11 1" stroke="#2F4A2A" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
    pitanga: '<path d="M9 3C13 3 16 7 16 11S13 17 9 17 2 15 2 11 5 3 9 3Z"/>'
  };
  function brotos() {
    const camada = $('[data-brotos]');
    if (!camada || FDA.reduz) return;
    const ultimo = new WeakMap();
    function soltar(alvo) {
      const agora = performance.now();
      if (agora - (ultimo.get(alvo) || 0) < 600) return;
      ultimo.set(alvo, agora);
      const r = alvo.getBoundingClientRect();
      const tipos = alvo.classList.contains('botao--doar') ? ['pitanga', 'caqui', 'folha'] : ['folha', 'caqui', 'folha'];
      tipos.forEach((tipo, i) => {
        const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        s.setAttribute('viewBox', '0 0 18 18');
        s.setAttribute('class', 'broto-p broto-p--' + tipo);
        s.innerHTML = FORMAS[tipo];
        const px = r.left + r.width * (0.2 + Math.random() * 0.6);
        s.style.left = px + 'px';
        s.style.top = r.top + 4 + 'px';
        s.style.setProperty('--dx', (Math.random() * 40 - 20).toFixed(0) + 'px');
        s.style.setProperty('--dy', (-26 - Math.random() * 30).toFixed(0) + 'px');
        s.style.setProperty('--r', (Math.random() * 120 - 60).toFixed(0) + 'deg');
        s.style.setProperty('--s', (0.8 + Math.random() * 0.5).toFixed(2));
        s.style.animationDelay = i * 70 + 'ms';
        camada.appendChild(s);
        s.addEventListener('animationend', () => s.remove());
      });
    }
    document.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const alvo = e.target.closest('[data-broto]');
      if (alvo && !alvo.contains(e.relatedTarget)) soltar(alvo);
    });
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      const alvo = e.target.closest('[data-broto]');
      if (alvo) soltar(alvo);
    });
  }

  /* ---------- Cortina orgânica entre páginas ---------- */
  function cortina() {
    const c = $('[data-cortina]');
    if (!c) return;
    const forma = $('svg', c);
    const marca = $('.marca', c);

    /* O CSS deixa a cortina em repouso com transform: translateY(110%), que o
       GSAP lê como y em pixels, e não como yPercent. Sem zerar esse y, todo
       yPercent daqui para baixo soma uma altura de cortina e a animação sai
       invertida: em vez de cobrir e abrir, ela sobe cobrindo e some de uma vez.
       Zerar o y entrega o controle do transform ao GSAP. */
    const repouso = (pct) => gsap.set(forma, { y: 0, yPercent: pct });

    // Chegando de outra página: começa coberto e abre
    if (comMovimento && FDA.sessao.ler('fda-cortina')) {
      FDA.sessao.apagar('fda-cortina');
      c.classList.add('ativa');
      repouso(0);
      gsap.set(marca, { opacity: 1 });
      FDA.cortinaAbrindo = true;
      let abriu = false;
      const abrir = () => {
        if (abriu) return;
        abriu = true;
        gsap.timeline({ onComplete: () => { c.classList.remove('ativa'); FDA.cortinaAbrindo = false; } })
          .to(marca, { opacity: 0, duration: 0.3 })
          .to(forma, { yPercent: -110, duration: 0.9, ease: FDA.ease.seiva }, '-=.1');
      };
      if (document.readyState === 'complete') abrir(); else window.addEventListener('load', abrir, { once: true });
      setTimeout(abrir, 1800); // segurança se algo demorar
    }

    window.addEventListener('pageshow', (e) => {
      if (e.persisted) { c.classList.remove('ativa'); gsap && repouso(110); }
    });

    if (!comMovimento) return;
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return; // âncora na mesma página
      e.preventDefault();
      fecharMenu();
      FDA.sessao.gravar('fda-cortina', '1');
      c.classList.add('ativa');
      repouso(110);
      gsap.timeline({ onComplete: () => { location.href = url.href; } })
        .to(forma, { yPercent: 0, duration: 0.75, ease: FDA.ease.seiva })
        .to(marca, { opacity: 1, duration: 0.25 }, '-=.2');
    });
  }

  /* ---------- FAQ com abertura animada ---------- */
  function faq() {
    $$('[data-faq] details').forEach((d) => {
      const s = $('summary', d);
      const corpo = $('.faq__resposta', d);
      s.addEventListener('click', (e) => {
        if (FDA.reduz || !corpo.animate) return;
        e.preventDefault();
        if (d.open) {
          const a = corpo.animate([{ height: corpo.offsetHeight + 'px' }, { height: '0px' }], { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)' });
          d.classList.add('fechando');
          a.onfinish = () => { d.open = false; d.classList.remove('fechando'); };
        } else {
          d.open = true;
          const h = corpo.offsetHeight;
          corpo.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 620, easing: 'cubic-bezier(.16,1,.3,1)' });
        }
      });
    });
  }

  /* ---------- Títulos que se revelam linha a linha, com máscara ---------- */
  FDA.revelarLinhas = function (el, opcoes) {
    if (!comMovimento || !window.SplitText) return null;
    const o = Object.assign({ stagger: 0.09, duration: 1.1, delay: 0, scroll: true }, opcoes);
    let anim;
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'linha-split',
      autoSplit: true,
      onSplit(self) {
        anim = gsap.from(self.lines, {
          yPercent: 115,
          rotate: 2.5,
          transformOrigin: '0 0',
          stagger: o.stagger,
          duration: o.duration,
          delay: o.delay,
          ease: FDA.ease.brota,
          scrollTrigger: o.scroll ? { trigger: el, start: 'top 85%', once: true } : undefined,
          paused: !o.scroll && o.pausado
        });
        return anim;
      }
    });
    return anim;
  };

  function revelacoes() {
    if (!comMovimento) return;
    $$('[data-titulo]').forEach((t) => FDA.revelarLinhas(t));
    $$('[data-surge]').forEach((el) => {
      if (el.closest('.hero')) return; // o hero tem timeline própria
      gsap.from(el, { y: 40, opacity: 0, duration: 1, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }

  /* ---------- Copiar chave Pix ---------- */
  function copiarPix() {
    $$('[data-copiar]').forEach((b) => {
      const alvo = b.closest('.pix') ? $('[data-chave-pix]', b.closest('.pix')) : $('[data-chave-pix]');
      const original = b.textContent;
      b.setAttribute('aria-live', 'polite');
      b.addEventListener('click', async () => {
        const chave = alvo.textContent.trim();
        let ok = false;
        try { await navigator.clipboard.writeText(chave); ok = true; } catch (e) {
          const r = document.createRange(); r.selectNodeContents(alvo);
          const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
          try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        }
        b.textContent = ok ? 'Chave copiada!' : 'Selecione e copie';
        setTimeout(() => (b.textContent = original), 2200);
      });
    });
  }

  /* ---------- Início ---------- */
  cabecalho();
  ancoras();
  menuPrincipal();
  cursor();
  magneticos();
  brotos();
  cortina();
  faq();
  copiarPix();
  // Títulos esperam as fontes para quebrar as linhas no lugar certo
  const depoisDasFontes = (fn) => (document.fonts && document.fonts.ready ? document.fonts.ready.then(fn) : fn());
  depoisDasFontes(revelacoes);
  FDA.depoisDasFontes = depoisDasFontes;
})();
