/* ==========================================================
   Home — loader, hero, raiz que cresce, contadores,
   pilares, galeria horizontal, vozes, ajudar, conversa, pomar
   ========================================================== */
(function () {
  'use strict';
  const FDA = window.FDA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const comMovimento = !FDA.reduz && FDA.temGSAP;
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* =========================================================
     00 · LOADER — a semente cai, racha e vira as três árvores
     ========================================================= */
  function loader(depois) {
    const el = $('[data-loader]');
    if (!el) return depois();
    const sair = () => { el.classList.add('fora'); depois(); };

    // Reduced motion ou sem GSAP: só o logo aparecendo (300ms)
    if (!comMovimento) {
      el.style.transition = 'opacity .3s';
      requestAnimationFrame(() => { el.style.opacity = 0; });
      return setTimeout(sair, 320);
    }
    // Recarregar a página conta como uma entrada nova: a intro volta a rodar
    const recarregou = (() => {
      try {
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) return nav.type === 'reload';
        return performance.navigation && performance.navigation.type === 1;
      } catch (e) { return false; }
    })();
    if (recarregou) FDA.sessao.apagar('fda-loader');

    // Só na primeira visita da sessão (ou vindo de outra página, com a cortina)
    if (FDA.sessao.ler('fda-loader') || FDA.cortinaAbrindo) { el.classList.add('fora'); return depois(); }
    FDA.sessao.gravar('fda-loader', '1');
    FDA.lenis && FDA.lenis.stop();
    document.documentElement.classList.add('intro-ativa');
    // O navegador pode restaurar a rolagem anterior: a intro começa sempre do topo
    try { history.scrollRestoration = 'manual'; } catch (e) { /* sem problema */ }
    window.scrollTo(0, 0);

    const semente = $('.loader__semente', el);
    const troncos = $$('.tronco', el);
    const copas = $$('.copa', el);
    const chao = $('.chao', el);
    const dica = $('[data-dica]', el);
    gsap.set([...troncos, chao], { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(copas, { scale: 0, transformOrigin: '50% 70%' });

    // A semente germina e a intro fica parada até a pessoa rolar
    const tl = gsap.timeline({ defaults: { ease: FDA.ease.brota } });
    tl.from(semente, { y: -30, opacity: 0, duration: 0.2 })
      .to(semente, { y: 110, duration: 0.38, ease: 'power2.in' })
      .to(semente, { scaleY: 0.6, scaleX: 1.3, transformOrigin: '50% 100%', duration: 0.08, ease: 'power1.out' })
      .to(chao, { strokeDashoffset: 0, duration: 0.45 }, '<')
      .to(semente, { scale: 0, opacity: 0, duration: 0.2 })
      .to(troncos, { strokeDashoffset: 0, duration: 0.45, stagger: 0.1, ease: 'power2.out' }, '<')
      .to(copas, { scale: 1, duration: 0.5, stagger: 0.09, ease: FDA.ease.mola }, '-=.3')
      .to('.loader__nome', { opacity: 1, y: 0, duration: 0.4 }, '-=.35')
      .to(dica, { opacity: 1, duration: 0.6 }, '+=.2');

    // Sair: rolagem do mouse, gesto de arrastar no toque ou teclas de rolagem
    let saiu = false;
    let toqueY = null;
    const TECLAS = ['ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter', 'End'];
    function entrar() {
      if (saiu) return;
      saiu = true;
      window.removeEventListener('wheel', aoRolar);
      window.removeEventListener('touchstart', aoTocar);
      window.removeEventListener('touchmove', aoArrastar);
      window.removeEventListener('keydown', aoTeclar);
      dica && dica.removeEventListener('click', entrar);
      tl.progress(1);
      gsap.to(el, {
        yPercent: -100, duration: 0.9, ease: FDA.ease.seiva,
        onComplete: () => {
          document.documentElement.classList.remove('intro-ativa');
          FDA.lenis && FDA.lenis.start();
          el.classList.add('fora');
          if (FDA.temGSAP) ScrollTrigger.refresh();
        }
      });
      depois(0.35);
    }
    const aoRolar = (e) => { if (e.deltaY > 0) entrar(); };
    const aoTocar = (e) => { toqueY = e.touches[0].clientY; };
    const aoArrastar = (e) => { if (toqueY !== null && toqueY - e.touches[0].clientY > 24) entrar(); };
    const aoTeclar = (e) => { if (TECLAS.includes(e.key)) { e.preventDefault(); entrar(); } };
    window.addEventListener('wheel', aoRolar, { passive: true });
    window.addEventListener('touchstart', aoTocar, { passive: true });
    window.addEventListener('touchmove', aoArrastar, { passive: true });
    window.addEventListener('keydown', aoTeclar);
    if (dica) { dica.style.cursor = 'pointer'; dica.addEventListener('click', entrar); }
  }

  /* =========================================================
     01 · SEMENTE — título por máscara, solo que reage ao mouse
     ========================================================= */
  function hero(atraso) {
    const secao = $('.hero');
    if (!secao) return;
    const titulo = $('[data-titulo-hero]');
    const semente = $('[data-semente-hero]');
    const solo = $('[data-solo]');
    const radicula = $('.hero__radicula');

    if (!comMovimento) {
      radicula && radicula.setAttribute('stroke-dashoffset', '0');
      return;
    }

    // Máscara por linha (as linhas são definidas no HTML para controlar a quebra)
    const internos = $$('.linha', titulo).map((l) => {
      const dentro = document.createElement('span');
      dentro.className = 'linha__in';
      dentro.style.display = 'inline-block';
      while (l.firstChild) dentro.appendChild(l.firstChild);
      l.appendChild(dentro);
      l.style.overflow = 'clip';
      l.style.paddingBottom = '.08em';
      l.style.marginBottom = '-.08em';
      return dentro;
    });

    gsap.set(titulo, { visibility: 'visible' });
    const tl = gsap.timeline({ delay: atraso || 0 });
    tl.from(internos, { yPercent: 118, rotate: 4, transformOrigin: '0 0', duration: 1.3, stagger: 0.11 })
      .from(semente, { y: 80, scale: 0.8, rotate: -12, opacity: 0, duration: 1.6 }, 0.1)
      .from($$('[data-surge]', secao), { y: 30, opacity: 0, duration: 1, stagger: 0.08 }, 0.55)
      .from('.hero__topo', { opacity: 0, duration: 0.8 }, 0.3);

    // Solo e semente seguem o mouse (só transform)
    if (!FDA.toque) {
      const sx = gsap.quickTo(solo, 'x', { duration: 1.2, ease: 'power3.out' });
      const sy = gsap.quickTo(solo, 'y', { duration: 1.2, ease: 'power3.out' });
      const ex = gsap.quickTo(semente, 'x', { duration: 1.6, ease: 'power3.out' });
      const ey = gsap.quickTo(semente, 'y', { duration: 1.6, ease: 'power3.out' });
      secao.addEventListener('pointermove', (e) => {
        const nx = e.clientX / innerWidth - 0.5;
        const ny = e.clientY / innerHeight - 0.5;
        sx(nx * -18); sy(ny * -14);
        ex(nx * 26); ey(ny * 20);
      });
    }

    // Ao sair do hero: a semente afunda na terra e a radícula aparece
    gsap.timeline({ scrollTrigger: { trigger: secao, start: 'top top', end: 'bottom top', scrub: 0.6 } })
      .to($('svg', semente), { yPercent: 38, scale: 0.72, rotate: 22, ease: 'none' }, 0)
      .to(radicula, { attr: { 'stroke-dashoffset': 0 }, ease: 'none' }, 0)
      .to(solo, { yPercent: 12, ease: 'none' }, 0)
      .to(titulo, { yPercent: -18, opacity: 0.25, ease: 'none' }, 0);
  }

  /* =========================================================
     02 · RAIZ — palavras empilhadas e marca-texto da missão
     ========================================================= */
  function manifesto() {
    const pilha = $('[data-pilha]');
    const citacao = $('[data-marcador]');
    if (!comMovimento) { citacao && citacao.classList.add('visivel'); return; }
    if (pilha) {
      const linhas = $$(':scope > span', pilha).map((l) => {
        const d = document.createElement('span');
        d.style.display = 'inline-block';
        while (l.firstChild) d.appendChild(l.firstChild);
        l.appendChild(d);
        l.style.overflow = 'clip';
        l.style.paddingBottom = '.24em';
        l.style.marginBottom = '-.24em';
        return d;
      });
      gsap.from(linhas, {
        yPercent: 110, duration: 1.3, stagger: 0.22,
        scrollTrigger: { trigger: pilha, start: 'top 78%', once: true }
      });
      // O peso "amadurece" conforme a seção passa
      gsap.fromTo(pilha, { '--peso': 0 }, {
        '--peso': 1, ease: 'none',
        scrollTrigger: { trigger: pilha, start: 'top 80%', end: 'bottom 20%', scrub: true },
        onUpdate() {
          const p = parseFloat(getComputedStyle(pilha).getPropertyValue('--peso')) || 0;
          pilha.style.fontVariationSettings = `"SOFT" ${Math.round(p * 100)}, "WONK" 0, "opsz" 144`;
        }
      });
    }
    if (citacao) ScrollTrigger.create({ trigger: citacao, start: 'top 75%', once: true, onEnter: () => citacao.classList.add('visivel') });
  }

  /* =========================================================
     03 · BROTO — contadores e círculo desenhado
     ========================================================= */
  function impacto() {
    const contadores = $$('[data-contador]');
    const tracos = $$('[data-desenha] path');
    if (!comMovimento) return;
    tracos.forEach((p) => gsap.set(p, { strokeDasharray: 1, strokeDashoffset: 1 }));
    contadores.forEach((el) => {
      const alvo = parseInt(el.dataset.contador, 10);
      el.textContent = '0';
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: () => gsap.to(obj, {
          v: alvo, duration: alvo > 50 ? 2.2 : 1.4, ease: 'expo.out',
          onUpdate: () => { el.textContent = Math.round(obj.v); }
        })
      });
    });
    tracos.forEach((p) => {
      gsap.to(p, { strokeDashoffset: 0, duration: 1.4, delay: 0.7, ease: 'power2.inOut', scrollTrigger: { trigger: p.closest('svg'), start: 'top 80%', once: true } });
    });
    const card = $('.numero-card');
    card && gsap.from(card, { y: 80, rotate: -4, duration: 1.4, scrollTrigger: { trigger: card, start: 'top 90%', once: true } });
    $$('.numero').forEach((n, i) => gsap.from(n, { y: 60, opacity: 0, duration: 1.1, delay: i * 0.08, scrollTrigger: { trigger: n, start: 'top 90%', once: true } }));
  }

  /* ---------- Pilares: uma frente aberta por vez ---------- */
  function pilares() {
    const lista = $('[data-pilares]');
    if (!lista) return;
    const itens = $$('.pilar', lista);
    itens.forEach((item) => {
      const b = $('.pilar__botao', item);
      b.addEventListener('click', () => {
        const abrir = !item.classList.contains('aberto');
        itens.forEach((o) => { o.classList.remove('aberto'); $('.pilar__botao', o).setAttribute('aria-expanded', 'false'); });
        if (abrir) { item.classList.add('aberto'); b.setAttribute('aria-expanded', 'true'); }
        if (FDA.temGSAP) setTimeout(() => ScrollTrigger.refresh(), 850);
      });
    });
  }

  /* =========================================================
     04 · FLORESCER — galeria horizontal fixada
     ========================================================= */
  function galeria() {
    const pin = $('[data-galeria]');
    const trilho = $('[data-trilho]');
    if (!pin || !trilho) return;
    const fotos = $$('[data-revela]', trilho);

    if (!comMovimento) return;

    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (hover: hover)', () => {
      const distancia = () => trilho.scrollWidth - innerWidth;
      const anda = gsap.to(trilho, {
        x: () => -distancia(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: () => '+=' + distancia(),
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
      fotos.forEach((f) => {
        const img = $('img', f);
        gsap.fromTo(f, { clipPath: 'inset(14% 20% 14% 20%)', scale: 0.88 }, {
          clipPath: 'inset(0% 0% 0% 0%)', scale: 1, ease: 'none',
          scrollTrigger: { trigger: f, containerAnimation: anda, start: 'left 100%', end: 'center 60%', scrub: true }
        });
        img && gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: f, containerAnimation: anda, start: 'left 100%', end: 'right 0%', scrub: true } });
      });

      // Arrastar com o mouse = rolar a página (que move a galeria)
      let arrastando = false, ultimoX = 0;
      const down = (e) => { if (e.pointerType !== 'mouse') return; arrastando = true; ultimoX = e.clientX; trilho.style.cursor = 'grabbing'; };
      const move = (e) => {
        if (!arrastando) return;
        const dx = e.clientX - ultimoX; ultimoX = e.clientX;
        if (FDA.lenis) FDA.lenis.scrollTo(FDA.lenis.scroll - dx * 1.4, { immediate: true });
        else window.scrollBy(0, -dx * 1.4);
      };
      const up = () => { arrastando = false; trilho.style.cursor = ''; };
      trilho.addEventListener('pointerdown', down);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      const semArrasto = (e) => e.preventDefault();
      trilho.addEventListener('dragstart', semArrasto);
      return () => {
        trilho.removeEventListener('pointerdown', down);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        trilho.removeEventListener('dragstart', semArrasto);
      };
    });
  }

  /* ---------- Vozes: um depoimento por vez ---------- */
  function vozes() {
    const cartao = $('[data-vozes]');
    if (!cartao) return;
    const lista = $$('.voz', cartao);
    const contador = $('[data-voz-atual]');
    let atual = 0, ocupado = false;
    function ir(passo) {
      if (ocupado) return;
      const prox = (atual + passo + lista.length) % lista.length;
      const antes = lista[atual], depois = lista[prox];
      const trocar = () => {
        antes.classList.remove('ativa');
        depois.classList.add('ativa');
        atual = prox;
        contador.textContent = prox + 1;
      };
      if (!comMovimento) return trocar();
      ocupado = true;
      gsap.to(antes, {
        opacity: 0, y: -16, duration: 0.3, ease: 'power2.in',
        onComplete: () => {
          gsap.set(antes, { clearProps: 'all' });
          trocar();
          gsap.from(depois, { opacity: 0, y: 28, duration: 0.8, onComplete: () => { ocupado = false; } });
        }
      });
    }
    $$('[data-voz]').forEach((b) => b.addEventListener('click', () => ir(parseInt(b.dataset.voz, 10))));
    cartao.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') ir(1);
      if (e.key === 'ArrowLeft') ir(-1);
    });
  }

  /* ---------- Fruto: blocos alternados entram de lados opostos ---------- */
  function ajudar() {
    if (!comMovimento) return;
    $$('[data-bloco]').forEach((b, i) => {
      const lado = i % 2 === 0 ? -1 : 1;
      const tl = gsap.timeline({ scrollTrigger: { trigger: b, start: 'top 80%', once: true } });
      tl.from($('.bloco__frase', b), { x: 70 * lado, opacity: 0, duration: 1.2 })
        .from($('.bloco__corpo', b), { y: 40, opacity: 0, duration: 1 }, 0.15);
    });
  }

  /* ---------- Conversa: balões chegam um por vez ---------- */
  function conversa() {
    const c = $('[data-conversa]');
    if (!c || !comMovimento) return;
    const baloes = $$('[data-balao]', c);
    gsap.set(baloes, { opacity: 0, scale: 0.85, y: 10 });
    const tl = gsap.timeline({ paused: true });
    baloes.forEach((b) => {
      if (b.classList.contains('balao--ong')) {
        const d = document.createElement('span');
        d.className = 'digitando';
        d.setAttribute('aria-hidden', 'true');
        d.innerHTML = '<i></i><i></i><i></i>';
        tl.call(() => b.before(d))
          .to({}, { duration: 0.9 })
          .call(() => d.remove());
      }
      tl.to(b, { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: FDA.ease.mola })
        .to({}, { duration: 0.35 });
    });
    ScrollTrigger.create({ trigger: c, start: 'top 75%', once: true, onEnter: () => tl.play() });
  }

  /* ---------- Colheita: o pomar do rodapé dá frutos ---------- */
  function pomar() {
    const p = $('[data-pomar]');
    if (!p || !comMovimento) return;
    const troncos = $$('.tronco, .chao', p);
    gsap.set(troncos, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set($$('.copa', p), { scale: 0, transformOrigin: '50% 70%' });
    gsap.set($$('.fruto', p), { scale: 0, transformOrigin: '50% 50%' });
    gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 85%', once: true } })
      .to(troncos, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: 'power2.out' })
      .to($$('.copa', p), { scale: 1, duration: 0.8, stagger: 0.12, ease: FDA.ease.mola }, '-=.6')
      .to($$('.fruto', p), { scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(3)' }, '-=.3');
  }

  /* =========================================================
     LINHA DE CRESCIMENTO — a raiz que liga as seções
     Desenhada conforme o scroll; na ponta viaja uma semente
     que vira broto, flor e fruto.
     ========================================================= */
  function raiz() {
    const svg = $('[data-raiz]');
    const main = $('main');
    if (!svg || !main) return;

    const COMPANHEIRO = `
      <g class="companheiro" data-companheiro>
        <g class="companheiro__etapa" data-e="raiz">
          <ellipse cx="0" cy="-14" rx="9" ry="13" transform="rotate(-18 0 -14)" fill="#8A6547"/>
          <ellipse cx="-3" cy="-18" rx="2.4" ry="5" transform="rotate(-18 -3 -18)" fill="#C39469"/>
        </g>
        <g class="companheiro__etapa" data-e="broto">
          <path d="M0 0C1-10-1-20 0-32" stroke="#4E6B3F" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <path d="M0-26C-5-35-17-36-22-29-15-24-6-23 0-26Z" fill="#4E6B3F"/>
          <path d="M0-30C5-40 17-42 23-35 16-29 6-28 0-30Z" fill="#2F4A2A"/>
          <ellipse cx="0" cy="-2" rx="6" ry="4" fill="#8A6547"/>
        </g>
        <g class="companheiro__etapa" data-e="florescer">
          <path d="M0 0C1-12-1-24 0-36" stroke="#4E6B3F" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <path d="M0-14C-6-20-15-20-18-15-12-11-5-11 0-14Z" fill="#4E6B3F"/>
          <g transform="translate(0 -44)" fill="#E9B44C">
            <ellipse rx="5.5" ry="10" transform="translate(0 -8)"/>
            <ellipse rx="5.5" ry="10" transform="rotate(72) translate(0 -8)"/>
            <ellipse rx="5.5" ry="10" transform="rotate(144) translate(0 -8)"/>
            <ellipse rx="5.5" ry="10" transform="rotate(216) translate(0 -8)"/>
            <ellipse rx="5.5" ry="10" transform="rotate(288) translate(0 -8)"/>
            <circle r="5" fill="#E8672C"/>
          </g>
        </g>
        <g class="companheiro__etapa" data-e="fruto">
          <path d="M0 0C1-8-1-14 0-20" stroke="#4E6B3F" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <circle cx="0" cy="-34" r="16" fill="#E8672C"/>
          <ellipse cx="-6" cy="-40" rx="4" ry="6" fill="#F3EBDD" opacity=".35"/>
          <path d="M0-50C4-58 13-60 19-55 13-49 5-48 0-50Z" fill="#2F4A2A"/>
          <circle cx="12" cy="-18" r="7" fill="#C8323A"/>
        </g>
      </g>`;

    let pontos = [];       // amostras {l, x, y}
    let total = 0;
    let linha, ramos = [], comp, etapas = [], faixas = [];
    const alturaMain = () => main.offsetHeight;

    function relTopo(el) {
      return el.getBoundingClientRect().top - main.getBoundingClientRect().top;
    }

    function construir() {
      const W = main.clientWidth;
      const H = alturaMain();
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML = '';
      const desktop = W >= 900;
      const env = $('.envelope');
      const pad = env ? parseFloat(getComputedStyle(env).paddingLeft) : 20;
      const sobra = Math.max(0, (W - 1680) / 2);
      const x0 = desktop ? sobra + pad * 0.48 : 7;
      const amp = desktop ? pad * 0.22 : 2.5;

      const secoes = $$(':scope > section', main).filter((s) => !s.classList.contains('hero'));
      faixas = secoes.map((s) => ({ ini: relTopo(s), fim: relTopo(s) + s.offsetHeight, etapa: s.dataset.etapa, sob: s.classList.contains('projetos') }));
      if (!faixas.length) return;

      // Pontos de passagem: margem esquerda com ondulação;
      // entre capítulos, a raiz atravessa para o meio da página
      const pts = [[x0 + 30, faixas[0].ini - 30]];
      let lado = 1;
      faixas.forEach((f, i) => {
        const passo = desktop ? 260 : 320;
        for (let y = f.ini + 90; y < f.fim - 90; y += passo) {
          const wob = Math.sin(y * 0.011 + i) * amp + (f.sob ? 0 : Math.sin(y * 0.031) * amp * 0.5);
          pts.push([x0 + wob, y]);
        }
        const prox = faixas[i + 1];
        if (prox && desktop && !f.sob && !prox.sob) {
          lado *= -1;
          pts.push([W * (lado > 0 ? 0.36 : 0.24), f.fim + 8]);
        }
      });
      pts.push([x0 + 6, faixas[faixas.length - 1].fim - 40]);

      // Catmull-Rom → Bézier
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        const t = 0.18;
        const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
        const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
        d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
      }
      linha = document.createElementNS(SVGNS, 'path');
      linha.setAttribute('class', 'raiz__linha');
      linha.setAttribute('d', d);
      svg.appendChild(linha);
      total = linha.getTotalLength();
      linha.style.strokeDasharray = total;
      linha.style.strokeDashoffset = total;

      // Amostras para achar o comprimento a partir do y da tela
      pontos = [];
      let maxY = -Infinity;
      for (let l = 0; l <= total; l += 6) {
        const p = linha.getPointAtLength(l);
        maxY = Math.max(maxY, p.y);
        pontos.push({ l, x: p.x, y: maxY });
      }

      // Ramos: um por capítulo, logo depois que ele começa
      ramos = [];
      if (desktop) {
        faixas.forEach((f) => {
          if (f.sob) return;
          const y = f.ini + 150;
          const amostra = pontos.find((p) => p.y >= y);
          if (!amostra) return;
          const pt = linha.getPointAtLength(amostra.l);
          const g = document.createElementNS(SVGNS, 'g');
          g.setAttribute('class', 'raiz__ramo');
          const len = 70 + Math.random() * 40;
          const dir = 1;
          const ex = pt.x + len * dir, ey = pt.y + 34;
          const rd = `M${pt.x} ${pt.y}C${pt.x + 20 * dir} ${pt.y + 2} ${ex - 30 * dir} ${ey - 26} ${ex} ${ey}`;
          let enfeite = '';
          if (f.etapa === 'broto' || f.etapa === 'florescer') {
            enfeite = `<path class="raiz__folha" d="M${ex} ${ey}c5-7 15-7 20 0-5 7-15 7-20 0z" transform="rotate(${dir > 0 ? 20 : 160} ${ex} ${ey})"/>`;
          } else if (f.etapa === 'fruto') {
            enfeite = `<circle class="raiz__fruto" cx="${ex + 6 * dir}" cy="${ey + 6}" r="7"/>`;
          }
          g.innerHTML = `<path class="raiz__galho" d="${rd}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/>${enfeite}`;
          svg.appendChild(g);
          ramos.push({ el: g, l: amostra.l });
        });
      }

      // Companheiro na ponta da raiz
      svg.insertAdjacentHTML('beforeend', COMPANHEIRO);
      comp = $('[data-companheiro]', svg);
      etapas = $$('.companheiro__etapa', comp);
      if (!comMovimento) {
        linha.style.strokeDashoffset = 0;
        ramos.forEach((r) => r.el.classList.add('vivo'));
        comp.style.display = 'none';
      }
      atualizar(true);
    }

    let etapaAtual = null;
    function atualizar() {
      if (!linha || !comMovimento || !pontos.length) return;
      const topoMain = main.getBoundingClientRect().top;
      const alvoY = -topoMain + innerHeight * 0.62;
      let a = pontos[0];
      for (let i = 0; i < pontos.length; i++) { if (pontos[i].y >= alvoY) { a = pontos[i]; break; } a = pontos[i]; }
      const L = alvoY < pontos[0].y ? 0 : a.l;
      linha.style.strokeDashoffset = total - L;
      ramos.forEach((r) => r.el.classList.toggle('vivo', L > r.l));
      if (comp) {
        const escondido = L <= 0 || L >= total - 2;
        comp.style.opacity = escondido ? 0 : 1;
        comp.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`);
        const f = faixas.find((f) => a.y >= f.ini && a.y < f.fim);
        const e = f ? f.etapa : 'raiz';
        if (e !== etapaAtual) {
          etapaAtual = e;
          etapas.forEach((g) => g.classList.toggle('ativa', g.dataset.e === e));
        }
      }
    }

    let agendado = false;
    const pedir = () => { if (!agendado) { agendado = true; requestAnimationFrame(() => { agendado = false; atualizar(); }); } };
    window.addEventListener('scroll', pedir, { passive: true });
    if (FDA.temGSAP) ScrollTrigger.addEventListener('refresh', construir);
    else { construir(); window.addEventListener('resize', () => { clearTimeout(raiz.t); raiz.t = setTimeout(construir, 200); }); }
    construir();
  }

  /* ---------- Ordem de início ---------- */
  function iniciar() {
    manifesto();
    impacto();
    pilares();
    galeria();
    vozes();
    ajudar();
    conversa();
    pomar();
    raiz();
    if (FDA.temGSAP) {
      window.addEventListener('load', () => ScrollTrigger.refresh());
    }
  }
  FDA.depoisDasFontes(iniciar);

  /* A intro não espera as fontes: ela começa a animar na hora em que a página
     carrega e fica parada até a pessoa rolar. Só o hero, que depende da
     medida das linhas do título, espera as fontes ficarem prontas. */
  loader((atraso) => FDA.depoisDasFontes(() => hero(atraso)));
})();
