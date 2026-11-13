/* ==========================================================
   Páginas internas — raiz curta, linha do tempo, contadores,
   barras de proporção, sumário, formulários e estados de tela.
   Carregado depois de nucleo.js e efeitos.js.
   ========================================================== */
(function () {
  'use strict';
  const FDA = window.FDA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const comMovimento = !FDA.reduz && FDA.temGSAP;
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- Raiz curta: desce pela lateral e liga as faixas ---------- */
  function raizInterna() {
    const svg = $('[data-raiz]');
    const main = $('main');
    if (!svg || !main) return;
    let linha, total = 0, pontos = [];

    function construir() {
      const W = main.clientWidth;
      const H = main.offsetHeight;
      if (!H) return;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML = '';
      const desktop = W >= 900;
      const env = $('.envelope');
      const pad = env ? parseFloat(getComputedStyle(env).paddingLeft) : 20;
      const sobra = Math.max(0, (W - 1680) / 2);
      const x0 = desktop ? sobra + pad * 0.46 : 7;
      const amp = desktop ? pad * 0.2 : 2.5;

      const pts = [];
      for (let y = 40; y < H - 60; y += desktop ? 240 : 320) {
        pts.push([x0 + Math.sin(y * 0.012) * amp + Math.sin(y * 0.035) * amp * 0.4, y]);
      }
      pts.push([x0, H - 50]);
      if (pts.length < 2) return;

      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        const t = 0.18;
        d += `C${(p1[0] + (p2[0] - p0[0]) * t).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) * t).toFixed(1)} ` +
             `${(p2[0] - (p3[0] - p1[0]) * t).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) * t).toFixed(1)} ` +
             `${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
      }
      linha = document.createElementNS(SVGNS, 'path');
      linha.setAttribute('class', 'raiz__linha');
      linha.setAttribute('d', d);
      svg.appendChild(linha);
      total = linha.getTotalLength();
      linha.style.strokeDasharray = total;

      pontos = [];
      let maxY = -Infinity;
      for (let l = 0; l <= total; l += 8) {
        const p = linha.getPointAtLength(l);
        maxY = Math.max(maxY, p.y);
        pontos.push({ l, y: maxY });
      }
      if (!comMovimento) { linha.style.strokeDashoffset = 0; return; }
      linha.style.strokeDashoffset = total;
      atualizar();
    }

    function atualizar() {
      if (!linha || !comMovimento || !pontos.length) return;
      const alvoY = -main.getBoundingClientRect().top + innerHeight * 0.68;
      let a = pontos[0];
      for (const p of pontos) { if (p.y >= alvoY) { a = p; break; } a = p; }
      linha.style.strokeDashoffset = total - (alvoY < pontos[0].y ? 0 : a.l);
    }

    let agendado = false;
    window.addEventListener('scroll', () => {
      if (!agendado) { agendado = true; requestAnimationFrame(() => { agendado = false; atualizar(); }); }
    }, { passive: true });
    if (FDA.temGSAP) ScrollTrigger.addEventListener('refresh', construir);
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(construir, 200); });
    construir();
    window.addEventListener('load', construir);
  }

  /* ---------- Revelação genérica por entrada na tela ---------- */
  function aoEntrar(seletor, fn, margem) {
    const itens = $$(seletor);
    if (!itens.length) return;
    if (!('IntersectionObserver' in window)) { itens.forEach(fn); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); }
    }), { rootMargin: margem || '0px 0px -12% 0px', threshold: 0.2 });
    itens.forEach((el) => io.observe(el));
  }

  /* ---------- Linha do tempo: cada nó brota ---------- */
  function tempo() {
    aoEntrar('.tempo__item', (el) => {
      el.classList.add('vivo');
      if (comMovimento) gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: FDA.ease.brota });
    });
  }

  /* ---------- Contadores das internas ---------- */
  function contadores() {
    /* Nas telas do painel quem escreve os números é o painel.js, com o que veio
       da API. A animação do contador roda sozinha ao entrar na tela e sobrescrevia
       esses valores de volta para os de exemplo. */
    if (document.body.hasAttribute('data-painel')) return;
    aoEntrar('[data-conta]', (el) => {
      const alvo = parseFloat(el.dataset.conta);
      const casas = (el.dataset.casas | 0);
      const prefixo = el.dataset.prefixo || '';
      if (!comMovimento) { el.textContent = prefixo + alvo.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }); return; }
      const obj = { v: 0 };
      gsap.to(obj, {
        v: alvo, duration: alvo > 100 ? 2 : 1.3, ease: 'expo.out',
        onUpdate: () => { el.textContent = prefixo + obj.v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }); }
      });
    });
  }

  /* ---------- Barras de proporção ---------- */
  function proporcoes() {
    aoEntrar('.proporcao', (el) => el.classList.add('vivo'));
  }

  /* ---------- Revelações suaves de bloco ---------- */
  function blocos() {
    if (!comMovimento) return;
    $$('[data-entra]').forEach((el) => {
      gsap.from(el, {
        y: 44, opacity: 0, duration: 1.1, ease: FDA.ease.brota,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
    $$('[data-entra-lista] > *').forEach((el, i) => {
      gsap.from(el, {
        y: 36, opacity: 0, duration: .9, delay: (i % 4) * 0.07, ease: FDA.ease.brota,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
    });
  }

  /* ---------- Sumário dos documentos legais ---------- */
  function sumario() {
    const links = $$('.sumario a');
    if (!links.length) return;
    const alvos = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    let pendente = false;
    function marcar() {
      pendente = false;
      let ativa = 0;
      alvos.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.35) ativa = i; });
      links.forEach((a, i) => a.classList.toggle('ativo', i === ativa));
    }
    window.addEventListener('scroll', () => { if (!pendente) { pendente = true; requestAnimationFrame(marcar); } }, { passive: true });
    marcar();
  }

  /* ---------- Formulários: validação no cliente, sem back-end ---------- */
  function formularios() {
    $$('form[data-form]').forEach((form) => {
      const aviso = $('[data-form-aviso]', form.parentNode) || $('[data-form-aviso]', form);
      form.setAttribute('novalidate', '');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const invalido = $$('input, select, textarea', form).find((c) => !c.disabled && !c.checkValidity());
        if (invalido) {
          invalido.focus();
          invalido.reportValidity && invalido.reportValidity();
          if (aviso) {
            aviso.className = 'aviso aviso--erro';
            aviso.hidden = false;
            $('[data-form-aviso-texto]', aviso).textContent = 'Confira os campos destacados antes de enviar.';
          }
          return;
        }
        if (aviso) {
          aviso.className = 'aviso aviso--sucesso';
          aviso.hidden = false;
          $('[data-form-aviso-texto]', aviso).textContent = form.dataset.form;
          aviso.scrollIntoView({ behavior: FDA.reduz ? 'auto' : 'smooth', block: 'center' });
        }
        form.reset();
      });
    });

    // Campo "outro valor" da doação
    const outro = $('[data-valor-outro]');
    if (outro) {
      const radios = $$('input[name="valor"]');
      const campo = $('[data-valor-livre]');
      const resumo = $('[data-resumo-valor]');
      const atualizar = () => {
        const marcado = radios.find((r) => r.checked);
        const livre = marcado && marcado.value === 'outro';
        campo.hidden = !livre;
        outro.disabled = !livre;
        if (livre) outro.focus();
        const v = livre ? parseFloat(outro.value || 0) : parseFloat((marcado && marcado.value) || 0);
        if (resumo) resumo.textContent = (v > 0 ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      };
      radios.forEach((r) => r.addEventListener('change', atualizar));
      outro.addEventListener('input', atualizar);
      atualizar();
    }

    // Mostrar/ocultar senha
    $$('[data-ver-senha]').forEach((b) => {
      b.addEventListener('click', () => {
        const campo = document.getElementById(b.dataset.verSenha);
        if (!campo) return;
        const mostrando = campo.type === 'text';
        campo.type = mostrando ? 'password' : 'text';
        b.textContent = mostrando ? 'Mostrar' : 'Ocultar';
        b.setAttribute('aria-pressed', String(!mostrando));
      });
    });
  }

  /* ---------- Telas com vários estados (?estado=...) ---------- */
  function estados() {
    const caixas = $$('[data-estado]');
    if (!caixas.length) return;
    const pedido = new URLSearchParams(location.search).get('estado');
    const alvo = (pedido && caixas.find((c) => c.dataset.estado === pedido)) || caixas[0];
    caixas.forEach((c) => c.classList.toggle('ativo', c === alvo));
  }

  raizInterna();
  tempo();
  contadores();
  proporcoes();
  sumario();
  formularios();
  estados();
  FDA.depoisDasFontes(blocos);
})();
