/* ==========================================================
   Painel da equipe no visual novo — login e telas de gestão.

   Cada tela do painel traz data-painel no <body>. Este arquivo
   descobre qual é, exige o token, busca os dados na API e troca o
   conteúdo de exemplo do HTML pelo que veio do banco.

   Carregado depois de api.js, só nas páginas do painel e no login.
   ========================================================== */
(function () {
  'use strict';

  var api = window.OngApi;
  if (!api) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var tela = document.body.getAttribute('data-painel');

  /* ---------- Formatação ---------- */
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function data(v) {
    if (!v) return '—';
    /* "2026-08-23", sem hora, o navegador lê como meia-noite em UTC; no fuso
       do Brasil isso vira o dia 22. As datas que a API manda como LocalDate
       (a publicação de uma notícia, por exemplo) são formatadas na mão, sem
       passar por Date. Os instantes, com hora e fuso, seguem pelo caminho
       normal. */
    var soData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v));
    if (soData) return soData[3] + '/' + soData[2] + '/' + soData[1];
    var d = new Date(v);
    return isNaN(d) ? '—' : d.toLocaleDateString('pt-BR');
  }
  function moeda(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function idade(nascimento) {
    if (!nascimento) return '—';
    var n = new Date(nascimento), hoje = new Date();
    if (isNaN(n)) return '—';
    var anos = hoje.getFullYear() - n.getFullYear();
    var m = hoje.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) anos--;
    return anos + (anos === 1 ? ' ano' : ' anos');
  }
  /* As etiquetas do site têm quatro tons; cada situação da API cai em um. */
  /* Os valores vêm dos enums do backend: StatusVoluntario e StatusSolicitacao
     usam PENDENTE/APROVADA/RECUSADA/ENCERRADA, StatusDoacao usa
     PENDENTE/CONFIRMADA/FALHOU/ESTORNADA e StatusPlano usa
     PENDENTE/ATIVO/PAUSADO/CANCELADO. */
  var TOM = {
    PENDENTE: 'alerta',
    APROVADA: 'ok', CONFIRMADA: 'ok', ATIVO: 'ok',
    RECUSADA: 'erro', FALHOU: 'erro', CANCELADO: 'erro', INATIVO: 'erro',
    ENCERRADA: 'espera', ESTORNADA: 'espera', PAUSADO: 'espera',
    /* Não vem da API: é a situação de quem aparece na lista de doadores sem
       nenhuma doação confirmada. */
    SEM_DOACAO: 'alerta',
    PUBLICADA: 'ok', RASCUNHO: 'espera'
  };
  var NOME_SITUACAO = {
    PENDENTE: 'Em análise', APROVADA: 'Aprovada', RECUSADA: 'Recusada',
    ENCERRADA: 'Encerrada', CONFIRMADA: 'Confirmada', FALHOU: 'Falhou',
    ESTORNADA: 'Estornada', ATIVO: 'Ativo', INATIVO: 'Inativo',
    PAUSADO: 'Pausado', CANCELADO: 'Cancelado', SEM_DOACAO: 'Doação pendente',
    PUBLICADA: 'Publicada', RASCUNHO: 'Rascunho'
  };
  function etiqueta(status) {
    var s = String(status || '').toUpperCase();
    var texto = NOME_SITUACAO[s] || (s ? s.charAt(0) + s.slice(1).toLowerCase() : '—');
    return '<span class="etiqueta etiqueta--' + (TOM[s] || 'espera') + '">' + esc(texto) + '</span>';
  }

  /* A API grava a origem em maiúsculas (DoacaoService); na tela ela vira texto
     legível. Os nomes aqui são os mesmos das opções do filtro no HTML — é por
     esse texto que o filtro compara. */
  var NOME_ORIGEM = {
    PLATAFORMA: 'Plataforma',
    PLATAFORMA_PUBLICA: 'Plataforma',
    MERCADO_PAGO: 'Mercado Pago',
    PIX_MANUAL: 'Pix lançado à mão'
  };
  function origem(v) {
    var s = String(v || '').toUpperCase();
    return NOME_ORIGEM[s] || (v ? String(v) : '—');
  }

  var MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  /* ---------- Preencher a tabela da tela ---------- */
  function corpoDaTabela() {
    /* A maioria das telas tem uma seção #lista-*, que isola a tabela principal
       das auxiliares. A visão geral não tem, e aí vale a primeira da página. */
    var secao = $('[id^="lista-"]');
    var tbody = secao && $('table.tabela tbody', secao);
    return tbody || $('.tabela--rolavel table.tabela tbody') || $('table.tabela tbody');
  }
  function preencher(linhas, colunas, vazio) {
    var tbody = corpoDaTabela();
    if (!tbody) return;
    if (!linhas.length) {
      tbody.innerHTML = '<tr data-vazio><td colspan="' + colunas + '">' + esc(vazio) + '</td></tr>';
      return;
    }
    tbody.innerHTML = linhas.join('');
    /* A tabela foi redesenhada do zero: o filtro que estiver em uso precisa
       valer de novo sobre as linhas novas. */
    aplicarFiltros();
  }
  function linha(celulas) {
    return '<tr>' + celulas.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
  }

  /* ---------- Preencher os números ----------
     Os placares aparecem na ordem do documento, então a lista de valores
     segue a mesma ordem dos rótulos escritos no HTML. */
  function placares(valores) {
    /* Sem filtrar por [data-conta]: depois de uma ação a lista é recarregada e
       os números precisam ser reescritos, então o seletor tem de continuar
       achando os mesmos elementos. Quem não disputa mais com eles é o contador
       animado do paginas.js, desligado nas telas do painel. */
    var alvos = $$('.ficha__valor, .mini-placar b');
    valores.forEach(function (v, i) {
      if (alvos[i]) alvos[i].textContent = v;
    });
  }

  /* ==========================================================
     Gráfico dos últimos seis meses

     O HTML traz seis barras de exemplo com alturas fixas, e era isso que
     mostrava dinheiro recebido num mês em que nada entrou. Aqui as barras
     passam a sair das doações confirmadas, com a mais alta valendo 100%.
     ========================================================== */
  function grafico(confirmadas) {
    var ul = $('.barras');
    if (!ul) return;
    var hoje = new Date();
    var meses = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      meses.push({ mes: d.getMonth(), ano: d.getFullYear(), total: 0 });
    }
    confirmadas.forEach(function (doa) {
      var x = new Date(doa.data);
      if (isNaN(x)) return;
      meses.forEach(function (m) {
        if (x.getMonth() === m.mes && x.getFullYear() === m.ano) m.total += Number(doa.valor || 0);
      });
    });
    var maior = meses.reduce(function (s, m) { return Math.max(s, m.total); }, 0);
    ul.innerHTML = meses.map(function (m) {
      /* Sem nenhuma doação no período as barras ficam zeradas, que é a
         informação verdadeira — melhor do que repetir o exemplo do HTML. */
      var altura = maior > 0 ? Math.round((m.total / maior) * 100) : 0;
      return '<li><i style="--h:' + altura + '%"></i><small>' + MESES[m.mes] + '</small></li>';
    }).join('');
    ul.setAttribute('aria-label', 'Doações por mês: ' + meses.map(function (m) {
      return MESES[m.mes] + ' ' + moeda(m.total);
    }).join(', '));
  }

  /* Preenche o select "Mês" com os meses que realmente têm lançamento. */
  function encherFiltroMes(lista) {
    var sel = $('[data-filtro-mes]');
    if (!sel) return;
    var vistos = {};
    lista.forEach(function (d) {
      var x = new Date(d.data);
      if (isNaN(x)) return;
      var m = x.getMonth() + 1;
      vistos[x.getFullYear() + '-' + (m < 10 ? '0' + m : m)] = MESES[x.getMonth()] + '/' + x.getFullYear();
    });
    var escolhido = sel.value;
    sel.innerHTML = '<option value="">Todos os meses</option>' +
      Object.keys(vistos).sort().reverse().map(function (k) {
        return '<option value="' + k + '">' + esc(vistos[k]) + '</option>';
      }).join('');
    if (escolhido) sel.value = escolhido;
  }

  /* ==========================================================
     Filtros, busca e exportação

     O painel carrega a lista inteira de uma vez, então filtrar no próprio
     navegador evita uma ida e volta à API a cada tecla. Tudo acontece sobre
     as linhas já desenhadas pelo preencher().
     ========================================================== */
  function linhasDaTabela() {
    var tbody = corpoDaTabela();
    return tbody ? $$('tr', tbody) : [];
  }
  function celula(tr, i) {
    return tr.cells[i] ? tr.cells[i].textContent.trim() : '';
  }
  /* "05/10/2026" vira "2026-10", que é o value das opções do select de mês. */
  function mesDaData(texto) {
    var m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? m[3] + '-' + m[2] : '';
  }

  function aplicarFiltros() {
    var caixa = $('[data-filtros]');
    if (!caixa) return;
    var busca = $('[data-filtro-busca]', caixa);
    var termo = busca ? busca.value.trim().toLowerCase() : '';
    var colunas = $$('[data-filtro-coluna]', caixa);
    var selMes = $('[data-filtro-mes]', caixa);
    var mes = selMes ? selMes.value : '';
    var linhas = linhasDaTabela();
    var visiveis = 0, total = 0;

    linhas.forEach(function (tr) {
      if (tr.hasAttribute('data-vazio') || tr.hasAttribute('data-sem-resultado')) return;
      total++;
      var ok = true;
      if (termo && tr.textContent.toLowerCase().indexOf(termo) === -1) ok = false;
      if (ok) {
        colunas.forEach(function (sel) {
          if (!sel.value || !ok) return;
          if (celula(tr, Number(sel.getAttribute('data-filtro-coluna')))
              .toLowerCase().indexOf(sel.value.toLowerCase()) === -1) ok = false;
        });
      }
      if (ok && mes && mesDaData(celula(tr, Number(selMes.getAttribute('data-filtro-mes')))) !== mes) ok = false;
      tr.hidden = !ok;
      if (ok) visiveis++;
    });

    /* Filtro que não acha nada deixaria a tabela em branco, sem explicar. */
    var tbody = corpoDaTabela();
    var recado = tbody && $('[data-sem-resultado]', tbody);
    if (tbody && total && !visiveis) {
      if (!recado) {
        recado = tbody.insertRow();
        recado.setAttribute('data-sem-resultado', '');
        var td = recado.insertCell();
        td.colSpan = 12;
        td.textContent = 'Nenhum registro corresponde ao filtro.';
      }
      recado.hidden = false;
    } else if (recado) {
      recado.hidden = true;
    }

    var contador = $('[data-filtro-contagem]');
    if (contador) {
      contador.textContent = visiveis === total
        ? total + (total === 1 ? ' registro' : ' registros')
        : visiveis + ' de ' + total;
    }
  }

  function ligarFiltros() {
    var caixa = $('[data-filtros]');
    if (!caixa) return;
    $$('input, select', caixa).forEach(function (c) {
      c.addEventListener(c.tagName === 'SELECT' ? 'change' : 'input', aplicarFiltros);
    });
  }

  /* ---------- Exportar o que está na tela ----------
     Exporta as linhas visíveis, respeitando o filtro: é o que a pessoa está
     vendo. Separador ";" e BOM no começo para o Excel em português abrir o
     arquivo com as colunas separadas e os acentos certos. */
  function colunasExportaveis(tabela) {
    return $$('thead th', tabela).map(function (th, i) {
      return { i: i, titulo: th.textContent.trim() };
    }).filter(function (c) { return c.titulo && c.titulo !== 'Ações'; });
  }
  function csv(valor) {
    var t = String(valor == null ? '' : valor).replace(/\s+/g, ' ').trim();
    return /[";\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }
  function exportarCsv() {
    var tbody = corpoDaTabela();
    var tabela = tbody && tbody.closest('table');
    if (!tabela) return;
    var cols = colunasExportaveis(tabela);
    var linhas = [cols.map(function (c) { return csv(c.titulo); }).join(';')];
    linhasDaTabela().forEach(function (tr) {
      if (tr.hidden || tr.hasAttribute('data-vazio') || tr.hasAttribute('data-sem-resultado')) return;
      linhas.push(cols.map(function (c) { return csv(celula(tr, c.i)); }).join(';'));
    });
    if (linhas.length === 1) {
      avisar('Não há nada para exportar com o filtro atual.', 'erro');
      return;
    }
    var hoje = new Date().toISOString().slice(0, 10);
    baixar('﻿' + linhas.join('\r\n'), (tela || 'painel') + '-' + hoje + '.csv',
      'text/csv;charset=utf-8');
  }
  function baixar(conteudo, nome, tipo) {
    var url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    var a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    /* Revogar na hora cancela o download em alguns navegadores. */
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  function ligarExportacao() {
    $$('[data-exportar]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        if (b.getAttribute('data-exportar') === 'pdf') window.print();
        else exportarCsv();
      });
    });
  }

  function avisar(texto, tipo) {
    var secao = $('[id^="lista-"]') || $('main .envelope');
    if (!secao) return;
    var caixa = $('[data-painel-aviso]', document);
    if (!caixa) {
      caixa = document.createElement('div');
      caixa.setAttribute('data-painel-aviso', '');
      secao.parentNode.insertBefore(caixa, secao);
    }
    caixa.className = 'aviso aviso--' + (tipo || 'sucesso');
    caixa.style.marginBottom = 'var(--e-5)';
    caixa.innerHTML = '<p>' + esc(texto) + '</p>';
  }

  /* ---------- Ações da linha (aprovar, recusar) ---------- */
  function ligarAcoes(recarregar) {
    document.addEventListener('click', function (e) {
      var botao = e.target.closest('[data-acao]');
      if (!botao) return;
      e.preventDefault();
      var acao = botao.getAttribute('data-acao');
      var rota = botao.getAttribute('data-rota');
      var pergunta = botao.getAttribute('data-pergunta') || 'Confirmar?';
      if (!window.confirm(pergunta)) return;
      var corpo;
      if (acao === 'recusar') {
        var motivo = window.prompt('Motivo da recusa (fica registrado no cadastro):', '');
        if (motivo === null) return;
        if (!motivo.trim()) {
          avisar('A recusa precisa de um motivo. Nada foi alterado.', 'erro');
          return;
        }
        /* O nome do campo é o do RecusaRequest no backend; "justificativa"
           sozinho volta 400 com "A justificativa da recusa é obrigatória". */
        corpo = { justificativaRecusa: motivo.trim() };
      }
      if (acao === 'promover') {
        /* Promover exige o cargo (CargoRequest). Rebaixar, não: vai sem corpo. */
        var cargo = window.prompt('Função desta pessoa na ONG:', botao.getAttribute('data-cargo') || '');
        if (cargo === null) return;
        if (!cargo.trim()) {
          avisar('Informe a função para dar o acesso. Nada foi alterado.', 'erro');
          return;
        }
        corpo = { cargo: cargo.trim() };
      }
      /* Quase toda ação do painel é um PUT sem corpo (aprovar, encerrar).
         As notícias fogem disso: despublicar manda {publicada:false} e
         excluir é um DELETE. Vêm nos atributos do próprio botão. */
      var metodo = botao.getAttribute('data-metodo') || 'PUT';
      var corpoFixo = botao.getAttribute('data-corpo');
      if (corpoFixo && !corpo) {
        try { corpo = JSON.parse(corpoFixo); } catch (e) { corpo = undefined; }
      }
      var rotulo = botao.textContent;
      botao.textContent = 'Enviando…';
      api.request(rota, { method: metodo, body: corpo })
        .then(function () { avisar('Pronto. A lista foi atualizada.'); return recarregar(); })
        .catch(function (erro) {
          /* Sem recarregar a lista, o botão continua na tela: devolve o rótulo
             dele para a ação poder ser tentada de novo. */
          botao.textContent = rotulo;
          avisar(erro.message || 'Não foi possível concluir.', 'erro');
        });
    });
  }
  function acoes(itens) {
    return '<span class="acoes">' + itens.join('') + '</span>';
  }
  function botaoAcao(rotulo, acao, rota, pergunta, extra) {
    return '<a class="link" href="#" data-acao="' + acao + '" data-rota="' + esc(rota) +
      '" data-pergunta="' + esc(pergunta) + '"' + (extra || '') + '>' + esc(rotulo) + '</a>';
  }

  /* ==========================================================
     Login
     ========================================================== */
  function login() {
    var form = $('[data-api="login"]');
    if (!form) return;
    /* Já logado: não faz sentido mostrar o formulário de novo. */
    if (api.token()) {
      var entrou = $('[data-estado="entrou"]'), formulario = $('[data-estado="formulario"]');
      if (entrou && formulario) { formulario.classList.remove('ativo'); entrou.classList.add('ativo'); }
      return;
    }
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalido = $$('input', form).filter(function (c) { return !c.checkValidity(); })[0];
      if (invalido) { invalido.focus(); invalido.reportValidity && invalido.reportValidity(); return; }
      var caixa = $('[data-form-aviso]', form);
      var botao = $('button[type="submit"]', form);
      var texto = $('.botao__texto', botao) || botao;
      var original = texto.textContent;
      texto.textContent = 'Entrando…';
      botao.disabled = true;
      api.request('/auth/login', {
        method: 'POST',
        public: true,
        body: { email: $('#email', form).value.trim(), senha: $('#senha', form).value }
      }).then(function (resposta) {
        api.salvarSessao(resposta, !!($('#lembrar', form) || {}).checked);
        location.assign("admin.html");
      }).catch(function (erro) {
        if (caixa) {
          caixa.className = 'aviso aviso--erro';
          caixa.hidden = false;
          $('[data-form-aviso-texto]', caixa).textContent = erro.message || 'Não foi possível entrar.';
        }
        texto.textContent = original;
        botao.disabled = false;
      });
    });
  }

  /* ==========================================================
     Recuperar a senha do painel
     ========================================================== */
  function recuperarSenha() {
    var form = $('[data-api="esqueci-senha"]');
    if (!form) return;
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var campo = $('#email', form);
      if (!campo.checkValidity()) { campo.focus(); campo.reportValidity && campo.reportValidity(); return; }
      var caixa = $('[data-form-aviso]', form);
      var botao = $('button[type="submit"]', form);
      var texto = $('.botao__texto', botao) || botao;
      var original = texto.textContent;
      texto.textContent = 'Enviando…';
      botao.disabled = true;
      api.request('/auth/esqueci-senha', {
        method: 'POST', public: true, body: { email: campo.value.trim() }
      }).then(function (resposta) {
        form.reset();
        if (caixa) {
          caixa.className = 'aviso aviso--sucesso';
          caixa.hidden = false;
          /* A API responde sempre a mesma coisa, exista a conta ou não, para
             não revelar quem tem acesso. A mensagem dela é a que vale. */
          $('[data-form-aviso-texto]', caixa).textContent =
            (resposta && resposta.mensagem) || 'Se existir uma conta com esse e-mail, o link foi enviado.';
        }
      }).catch(function (erro) {
        if (caixa) {
          caixa.className = 'aviso aviso--erro';
          caixa.hidden = false;
          $('[data-form-aviso-texto]', caixa).textContent = erro.message || 'Não foi possível enviar o link.';
        }
      }).then(function () {
        texto.textContent = original;
        botao.disabled = false;
      });
    });
  }

  /* ==========================================================
     Telas do painel
     ========================================================== */
  function sair() {
    api.limparSessao();
    location.replace('gestao.html');
  }

  function montarSaida() {
    $$('[data-sair]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); sair(); });
    });
  }

  var carregar = {
    'visao-geral': function () {
      return Promise.all([
        api.request('/adm/solicitacoes'), api.request('/adm/voluntarios'),
        api.request('/adm/beneficiarios'), api.request('/adm/doacoes'),
        api.request('/adm/usuarios'), api.request('/adm/planos')
      ]).then(function (r) {
        var sols = r[0], vols = r[1], bens = r[2], doas = r[3], users = r[4], planos = r[5];
        var mes = new Date().getMonth(), ano = new Date().getFullYear();
        var pagas = doas.filter(function (d) { return d.status === 'CONFIRMADA'; });
        var noMes = pagas.filter(function (d) { var x = new Date(d.data); return x.getMonth() === mes && x.getFullYear() === ano; });
        var total = noMes.reduce(function (s, d) { return s + Number(d.valor || 0); }, 0);
        var responsaveis = new Set(bens.map(function (b) { return b.responsavel && b.responsavel.nome; }).filter(Boolean));
        placares([
          sols.filter(function (s) { return s.status === 'PENDENTE'; }).length,
          vols.filter(function (v) { return v.status === 'PENDENTE'; }).length,
          bens.filter(function (b) { return b.ativo; }).length,
          moeda(total),
          pagas.length,
          doas.filter(function (d) { return String(d.status).toUpperCase() === 'PENDENTE'; }).length,
          planos.filter(function (p) { return p.status === 'ATIVO'; }).length,
          bens.filter(function (b) { return b.ativo; }).length,
          responsaveis.size,
          vols.filter(function (v) { return v.status === 'APROVADA'; }).length,
          users.filter(function (u) { return u.tipo === 'COMUM' && u.ativo; }).length
        ]);
        var ultimas = doas.slice().sort(function (a, b) { return new Date(b.data) - new Date(a.data); }).slice(0, 8);
        preencher(ultimas.map(function (d) {
          return linha([data(d.data), esc(d.doadorNome || d.doadorEmail || 'Anônimo'), moeda(d.valor),
            esc(origem(d.origem)), etiqueta(d.status)]);
        }), 5, 'Ainda não há doações registradas.');
      });
    },

    solicitacoes: function () {
      return api.request('/adm/solicitacoes').then(function (lista) {
        var ano = new Date().getFullYear();
        var doAno = function (s) { return new Date(s.dataSolicitacao).getFullYear() === ano; };
        placares([
          lista.filter(function (s) { return s.status === 'PENDENTE'; }).length,
          lista.filter(function (s) { return s.status === 'APROVADA' && doAno(s); }).length,
          lista.filter(function (s) { return s.status === 'RECUSADA' && doAno(s); }).length
        ]);
        preencher(lista.map(function (s) {
          var acao = s.status === 'PENDENTE' ? acoes([
            botaoAcao('Aprovar', 'aprovar', '/adm/solicitacoes/' + s.id + '/aprovar', 'Aprovar a solicitação de ' + (s.beneficiario && s.beneficiario.nome) + '?'),
            botaoAcao('Recusar', 'recusar', '/adm/solicitacoes/' + s.id + '/recusar', 'Recusar a solicitação de ' + (s.beneficiario && s.beneficiario.nome) + '?')
          ]) : '<span class="apoio">—</span>';
          return linha([data(s.dataSolicitacao), esc(s.beneficiario && s.beneficiario.nome),
            idade(s.beneficiario && s.beneficiario.dataNascimento), esc(s.responsavel && s.responsavel.nome),
            etiqueta(s.status), acao]);
        }), 6, 'Nenhuma solicitação recebida até agora.');
      });
    },

    voluntarios: function () {
      return api.request('/adm/voluntarios').then(function (lista) {
        var ano = new Date().getFullYear();
        placares([
          lista.filter(function (v) { return v.status === 'PENDENTE'; }).length,
          lista.filter(function (v) { return v.status === 'APROVADA'; }).length,
          lista.filter(function (v) { return v.status === 'RECUSADA' && new Date(v.dataInscricao).getFullYear() === ano; }).length
        ]);
        preencher(lista.map(function (v) {
          /* A observação guarda "Área: … Disponibilidade: …", que é o que o
             formulário público do site manda. Aqui ela volta separada. */
          var obs = String(v.observacao || '');
          var area = (obs.match(/Área:\s*([^.]*)/) || [])[1] || '—';
          var disp = (obs.match(/Disponibilidade:\s*(.*)$/) || [])[1] || '—';
          var acao = v.status === 'PENDENTE' ? acoes([
            botaoAcao('Aprovar', 'aprovar', '/adm/voluntarios/' + v.id + '/aprovar', 'Aprovar ' + v.nomeContato + ' como voluntário?'),
            botaoAcao('Recusar', 'recusar', '/adm/voluntarios/' + v.id + '/recusar', 'Recusar a candidatura de ' + v.nomeContato + '?')
          ]) : '<span class="apoio">—</span>';
          return linha([data(v.dataInscricao), esc(v.nomeContato || '—'), esc(area.trim()),
            esc(disp.trim()), etiqueta(v.status), acao]);
        }), 6, 'Nenhuma candidatura recebida até agora.');
      });
    },

    criancas: function () {
      return Promise.all([api.request('/adm/beneficiarios'), api.request('/projetos')]).then(function (r) {
        var bens = r[0], projetos = r[1];
        var nomeProjeto = function (id) {
          var p = projetos.filter(function (x) { return x.id === id; })[0];
          return p ? p.nome : id;
        };
        preencher(bens.map(function (b) {
          return linha([esc(b.nome), idade(b.dataNascimento), esc((b.responsavel && b.responsavel.nome) || '—'),
            esc((b.projetoIds || []).map(nomeProjeto).join(', ') || '—'), etiqueta(b.ativo ? 'ATIVO' : 'INATIVO')]);
        }), 5, 'Nenhuma criança cadastrada ainda. Elas entram ao aprovar uma solicitação.');
      });
    },

    responsaveis: function () {
      /* Não existe endpoint de responsáveis: eles vêm dentro dos beneficiários,
         e aqui são agrupados por nome para virar uma lista de pessoas. */
      return api.request('/adm/beneficiarios').then(function (bens) {
        var porNome = {};
        bens.forEach(function (b) {
          var r = b.responsavel;
          if (!r || !r.nome) return;
          if (!porNome[r.nome]) porNome[r.nome] = { dados: r, criancas: [] };
          porNome[r.nome].criancas.push(b.nome);
        });
        var lista = Object.keys(porNome).map(function (n) { return porNome[n]; });
        preencher(lista.map(function (x) {
          return linha([esc(x.dados.nome), esc(x.dados.parentesco || '—'), esc(x.dados.telefone || '—'),
            esc(x.criancas.join(', ')), esc(x.dados.bairro || '—')]);
        }), 5, 'Nenhum responsável cadastrado ainda.');
      });
    },

    doadores: function () {
      /* Também não tem endpoint próprio: a lista sai das doações, somadas por
         pessoa. Quem doou sem conta aparece pelo nome e e-mail informados. */
      return api.request('/adm/doacoes').then(function (doas) {
        var porPessoa = {};
        doas.forEach(function (d) {
          var chave = d.doadorId || d.doadorEmail || d.doadorNome || 'anonimo';
          if (!porPessoa[chave]) porPessoa[chave] = { nome: d.doadorNome || 'Anônimo', email: d.doadorEmail || '', n: 0, confirmadas: 0, total: 0, ultima: null };
          var p = porPessoa[chave];
          p.n++;
          if (d.status === 'CONFIRMADA') { p.confirmadas++; p.total += Number(d.valor || 0); }
          if (!p.ultima || new Date(d.data) > new Date(p.ultima)) p.ultima = d.data;
        });
        var lista = Object.keys(porPessoa).map(function (k) { return porPessoa[k]; })
          .sort(function (a, b) { return b.total - a.total; });
        placares([
          lista.length,
          lista.filter(function (p) { return p.confirmadas > 1; }).length,
          lista.filter(function (p) { return p.confirmadas === 0; }).length,
          moeda(lista.reduce(function (s, p) { return s + p.total; }, 0))
        ]);
        /* A coluna "Doações" conta só as confirmadas, e a situação sai daí.
           Antes ela era inventada a partir do número de tentativas (n > 1), e
           por isso quem tinha uma cobrança aberta e nunca paga aparecia como
           doador ativo, e quem pagou uma vez só aparecia "Em análise". */
        preencher(lista.map(function (p) {
          return linha([esc(p.nome), esc(p.email || '—'), String(p.confirmadas), moeda(p.total),
            etiqueta(p.confirmadas > 0 ? 'CONFIRMADA' : 'SEM_DOACAO')]);
        }), 5, 'Nenhum doador ainda.');
      });
    },

    doacoes: function () {
      return Promise.all([api.request('/adm/doacoes'), api.request('/projetos'), api.request('/adm/planos')]).then(function (r) {
        var doas = r[0], projetos = r[1], planos = r[2];
        var nomeProjeto = function (id) {
          if (!id) return 'Onde for mais necessário';
          var p = projetos.filter(function (x) { return x.id === id; })[0];
          return p ? p.nome : id;
        };
        var mes = new Date().getMonth(), ano = new Date().getFullYear();
        var pagas = doas.filter(function (d) { return d.status === 'CONFIRMADA'; });
        var noMes = pagas.filter(function (d) { var x = new Date(d.data); return x.getMonth() === mes && x.getFullYear() === ano; });
        placares([
          moeda(noMes.reduce(function (s, d) { return s + Number(d.valor || 0); }, 0)),
          pagas.length,
          doas.filter(function (d) { return String(d.status).toUpperCase() === 'PENDENTE'; }).length,
          planos.filter(function (p) { return p.status === 'ATIVO'; }).length
        ]);
        var ordenadas = doas.slice().sort(function (a, b) { return new Date(b.data) - new Date(a.data); });
        encherFiltroMes(ordenadas);
        preencher(ordenadas.map(function (d) {
          return linha([data(d.data), esc(d.doadorNome || d.doadorEmail || 'Anônimo'), moeda(d.valor),
            esc(origem(d.origem)), esc(nomeProjeto(d.projetoId)), etiqueta(d.status)]);
        }), 6, 'Ainda não há doações registradas.');
        grafico(pagas);
      });
    },

    projetos: function () {
      return api.request('/adm/projetos').then(function (lista) {
        var ordenados = lista.slice().sort(function (a, b) { return (a.ordem || 0) - (b.ordem || 0); });
        preencher(ordenados.map(function (p) {
          return linha([String(p.ordem == null ? '—' : p.ordem), esc(p.nome), esc(p.categoria || '—'),
            etiqueta(p.ativo ? 'ATIVO' : 'INATIVO')]);
        }), 4, 'Nenhum projeto cadastrado.');
      });
    },

    usuarios: function () {
      return api.request('/adm/usuarios').then(function (lista) {
        preencher(lista.map(function (u) {
          var acao = u.principal ? '<span class="apoio">conta principal</span>'
            : (u.tipo === 'ADMIN'
              ? botaoAcao('Rebaixar', 'rebaixar', '/adm/usuarios/' + u.id + '/rebaixar', 'Tirar o acesso de administrador de ' + u.nome + '?')
              : botaoAcao('Promover', 'promover', '/adm/usuarios/' + u.id + '/promover',
                  'Dar acesso de administrador a ' + u.nome + '?',
                  ' data-cargo="' + esc(u.cargo || '') + '"'));
          return linha([esc(u.nome), esc(u.email), esc(u.cargo || '—'),
            esc(u.tipo === 'ADMIN' ? 'Administrador' : 'Comum'), data(u.dataCadastro),
            etiqueta(u.ativo ? 'ATIVO' : 'INATIVO'), acoes([acao])]);
        }), 7, 'Nenhum acesso cadastrado.');
      });
    },

    noticias: function () {
      return api.request('/adm/noticias').then(function (lista) {
        preencher(lista.map(function (n) {
          var botoes = [];
          if (n.publicada) {
            botoes.push('<a class="link" href="noticia.html?n=' + encodeURIComponent(n.slug || n.id) +
              '" target="_blank" rel="noopener" data-broto>Ver</a>');
          }
          botoes.push('<a class="link" href="#" data-editar="' + esc(n.id) + '" data-broto>Editar</a>');
          botoes.push(botaoAcao(
            n.publicada ? 'Despublicar' : 'Publicar',
            n.publicada ? 'despublicar' : 'publicar',
            '/adm/noticias/' + n.id,
            n.publicada
              ? 'Tirar "' + (n.titulo || '') + '" do ar? Ela continua salva como rascunho.'
              : 'Publicar "' + (n.titulo || '') + '" no site?',
            ' data-corpo=\'{"publicada":' + (n.publicada ? 'false' : 'true') + '}\''));
          botoes.push(botaoAcao('Excluir', 'excluir', '/adm/noticias/' + n.id,
            'Excluir "' + (n.titulo || '') + '" de vez? Isso não pode ser desfeito.',
            ' data-metodo="DELETE"'));
          return linha([data(n.dataPublicacao), esc(n.titulo), esc(n.categoria || '—'),
            etiqueta(n.publicada ? 'PUBLICADA' : 'RASCUNHO'), acoes(botoes)]);
        }), 5, 'Nenhuma notícia cadastrada ainda. Use o formulário acima.');
      });
    }
  };

  /* ==========================================================
     Formulários de cadastro do painel
     ========================================================== */
  function avisoDoForm(form, texto, tipo) {
    var caixa = $('[data-form-aviso]', form.parentNode) || $('[data-form-aviso]', form);
    if (!caixa) return;
    caixa.className = 'aviso aviso--' + (tipo || 'sucesso');
    caixa.hidden = false;
    var alvo = $('[data-form-aviso-texto]', caixa);
    if (alvo) alvo.textContent = texto;
    caixa.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function ligarForm(form, montar, depois) {
    if (!form) return;
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalido = $$('input, select, textarea', form).filter(function (c) {
        return !c.disabled && !c.checkValidity();
      })[0];
      if (invalido) {
        invalido.focus();
        invalido.reportValidity && invalido.reportValidity();
        avisoDoForm(form, 'Confira os campos destacados antes de enviar.', 'erro');
        return;
      }
      var botao = $('button[type="submit"]', form);
      var texto = botao && ($('.botao__texto', botao) || botao);
      var original = texto && texto.textContent;
      var salvou = null;
      if (botao) { botao.disabled = true; texto.textContent = 'Salvando…'; }
      Promise.resolve().then(montar).then(function (envio) {
        /* Cadastrar é POST. Editar uma notícia que já existe é PUT no id
           dela, e aí o montar() devolve o método junto. */
        return api.request(envio.rota, { method: envio.metodo || 'POST', body: envio.corpo })
          .then(function (resposta) { return { envio: envio, resposta: resposta }; });
      }).then(function (r) {
        form.reset();
        avisoDoForm(form, typeof depois.sucesso === 'function' ? depois.sucesso(r.envio, r.resposta) : depois.sucesso);
        salvou = r;
        return depois.recarregar && depois.recarregar();
      }).catch(function (erro) {
        avisoDoForm(form, (erro && erro.message) || 'Não foi possível salvar.', 'erro');
      }).then(function () {
        if (botao) { botao.disabled = false; texto.textContent = original; }
        /* Depois de devolver o rótulo que estava no botão: o aoSalvar pode
           querer trocá-lo (sair do modo de edição devolve "Publicar"), e se
           rodasse antes seria desfeito aqui. */
        if (salvou && depois.aoSalvar) depois.aoSalvar(salvou.envio, salvou.resposta);
      });
    });
  }

  function valor(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  /* O select de projeto é escrito à mão no HTML; aqui ele passa a guardar o id
     de verdade. Sem a marca data-projetos-ok, o value seria o nome do projeto,
     e a API recusa qualquer projetoId fora do formato de ObjectId. */
  function encherProjetos(select) {
    if (!select) return Promise.resolve();
    return api.request('/projetos', { public: true }).then(function (lista) {
      if (!lista || !lista.length) return;
      var primeira = select.querySelector('option[value=""]') || select.options[0];
      var rotulo = primeira ? primeira.textContent : 'Onde for mais necessário';
      select.innerHTML = '';
      var vazia = document.createElement('option');
      vazia.value = '';
      vazia.textContent = rotulo;
      select.appendChild(vazia);
      lista.forEach(function (p) {
        var o = document.createElement('option');
        o.value = p.id;
        o.textContent = p.nome;
        select.appendChild(o);
      });
      select.setAttribute('data-projetos-ok', '');
    }).catch(function () { /* sem API o select fica como está e não manda id */ });
  }
  function projetoEscolhido(select) {
    return select && select.hasAttribute('data-projetos-ok') && select.value ? select.value : null;
  }

  function lerImagem(input) {
    var arquivo = input && input.files && input.files[0];
    if (!arquivo) return Promise.resolve(null);
    if (arquivo.size > 2 * 1024 * 1024) {
      return Promise.reject(new Error('A imagem precisa ter menos de 2 MB.'));
    }
    return new Promise(function (ok, falha) {
      var leitor = new FileReader();
      leitor.onload = function () { ok(leitor.result); };
      leitor.onerror = function () { falha(new Error('Não foi possível ler a imagem.')); };
      leitor.readAsDataURL(arquivo);
    });
  }

  function formularios(recarregar) {
    /* Doação registrada à mão (Pix e dinheiro que não passam pelo Mercado Pago) */
    if (tela === 'doacoes') {
      var destino = document.getElementById('doa-destino');
      encherProjetos(destino);
      ligarForm($('form'), function () {
        return { rota: '/adm/doacoes', corpo: {
          doadorNome: valor('doa-nome'),
          valor: Number(valor('doa-valor')),
          data: valor('doa-data'),
          projetoId: projetoEscolhido(destino),
          observacao: valor('doa-obs').slice(0, 140) || null
        } };
      }, { sucesso: 'Doação registrada.', recarregar: recarregar });
    }

    if (tela === 'projetos') {
      ligarForm($('form'), function () {
        return lerImagem(document.getElementById('pro-foto')).then(function (imagem) {
          return { rota: '/adm/projetos', corpo: {
            nome: valor('pro-nome'),
            categoria: valor('pro-etiqueta') || null,
            ordem: Number(valor('pro-ordem')) || 1,
            resumo: valor('pro-resumo') || null,
            descricao: valor('pro-texto'),
            imagemUrl: imagem,
            imagemAlt: valor('pro-alt') || null,
            ativo: true
          } };
        });
      }, { sucesso: 'Projeto publicado.', recarregar: recarregar });
    }

    /* ---------- Notícias: cadastro, edição, rascunho ----------
       O mesmo formulário cria e edita. Em edição ele guarda o id da matéria,
       troca o título da seção e o rótulo do botão, e passa a mandar PUT. */
    if (tela === 'noticias') {
      var formNot = $('form');
      var tituloForm = $('[data-titulo-form]');
      var botaoEnviar = formNot && $('button[type="submit"] .botao__texto', formNot);
      var botaoCancelar = $('[data-cancelar-edicao]');
      var botaoRascunho = $('[data-rascunho]');
      var emEdicao = null;
      /* O botão "Salvar rascunho" é o mesmo envio, só que com publicada
         false. A marca dura um envio e volta ao padrão. */
      var publicarAgora = true;

      function sairDaEdicao() {
        emEdicao = null;
        if (tituloForm) tituloForm.textContent = 'Nova notícia';
        if (botaoEnviar) botaoEnviar.textContent = 'Publicar';
        if (botaoCancelar) botaoCancelar.hidden = true;
        if (botaoRascunho) botaoRascunho.hidden = false;
        if (formNot) formNot.reset();
      }

      function entrarEmEdicao(id) {
        return api.request('/adm/noticias/' + id).then(function (n) {
          emEdicao = n.id;
          var por = function (campo, v) {
            var el = document.getElementById(campo);
            if (el) el.value = v == null ? '' : v;
          };
          por('not-titulo', n.titulo);
          por('not-data', n.dataPublicacao);
          por('not-tipo', n.categoria);
          por('not-resumo', n.resumo);
          por('not-texto', n.texto);
          por('not-alt', n.imagemAlt);
          /* input[type=file] não aceita valor por código, por segurança do
             navegador. Deixar em branco mantém a foto que já está salva: o
             PUT só manda imagemUrl quando a pessoa escolhe outro arquivo. */
          var foto = document.getElementById('not-foto');
          if (foto) foto.value = '';
          if (tituloForm) tituloForm.textContent = 'Editando: ' + n.titulo;
          if (botaoEnviar) botaoEnviar.textContent = 'Salvar alterações';
          if (botaoCancelar) botaoCancelar.hidden = false;
          if (botaoRascunho) botaoRascunho.hidden = true;
          if (tituloForm) tituloForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }).catch(function (erro) {
          avisar(erro.message || 'Não foi possível abrir a notícia para edição.', 'erro');
        });
      }

      document.addEventListener('click', function (e) {
        var link = e.target.closest('[data-editar]');
        if (!link) return;
        e.preventDefault();
        entrarEmEdicao(link.getAttribute('data-editar'));
      });
      if (botaoCancelar) botaoCancelar.addEventListener('click', sairDaEdicao);
      if (botaoRascunho) botaoRascunho.addEventListener('click', function () {
        publicarAgora = false;
        if (formNot.requestSubmit) formNot.requestSubmit();
        else $('button[type="submit"]', formNot).click();
      });

      ligarForm(formNot, function () {
        /* A intenção é lida uma vez e devolvida ao padrão aqui mesmo. Se
           guardasse na variável até o fim do envio, um erro de rede deixaria
           "rascunho" grudado, e o próximo "Publicar" salvaria escondido. */
        var publicando = publicarAgora;
        publicarAgora = true;
        return lerImagem(document.getElementById('not-foto')).then(function (imagem) {
          /* Sem "slug": o endereço da página sai do título, no backend. O
             campo saiu do formulário por ser técnico demais para a tela. A
             API continua aceitando um slug escolhido, para quando for preciso
             consertar o endereço de uma matéria por chamada direta. */
          var corpo = {
            titulo: valor('not-titulo'),
            categoria: valor('not-tipo') || null,
            resumo: valor('not-resumo'),
            texto: valor('not-texto'),
            imagemAlt: valor('not-alt') || null,
            dataPublicacao: valor('not-data') || null
          };
          if (imagem) corpo.imagemUrl = imagem;
          /* Editando, "publicada" não vai no corpo: quem publica e despublica
             é o botão da lista, e salvar uma correção não deve pôr no ar um
             rascunho sem querer. */
          if (!emEdicao) corpo.publicada = publicando;
          return emEdicao
            ? { rota: '/adm/noticias/' + emEdicao, metodo: 'PUT', corpo: corpo, publicando: publicando }
            : { rota: '/adm/noticias', corpo: corpo, publicando: publicando };
        });
      }, {
        sucesso: function (envio) {
          if (envio.metodo === 'PUT') return 'Notícia atualizada.';
          return envio.publicando ? 'Notícia publicada. Ela já aparece no site.'
            : 'Rascunho salvo. Ele só vai ao ar quando você publicar.';
        },
        aoSalvar: sairDaEdicao,
        recarregar: recarregar
      });
    }

    if (tela === 'usuarios') {
      ligarForm($('form'), function () {
        return { rota: '/adm/usuarios', corpo: {
          nome: valor('adm-nome'),
          email: valor('adm-email'),
          telefone: valor('adm-telefone'),
          cargo: valor('adm-funcao'),
          senha: valor('adm-senha')
        } };
      }, { sucesso: 'Administrador criado. Passe a senha para a pessoa e peça que ela troque.', recarregar: recarregar });
    }
  }

  /* ---------- Contagens do menu lateral ----------
     Os números ao lado de "Solicitações" e "Voluntários" estavam escritos no
     HTML e apareciam iguais em toda tela. Agora saem da API; enquanto não
     chegam, ficam escondidos em vez de mostrar um número de exemplo. */
  function contagensDoMenu() {
    var cs = $('a[href="admin-solicitacoes.html"] .contagem');
    var cv = $('a[href="admin-voluntarios.html"] .contagem');
    if (!cs && !cv) return;
    var pendentes = function (lista) {
      return lista.filter(function (x) { return String(x.status).toUpperCase() === 'PENDENTE'; }).length;
    };
    var mostrar = function (el, n) {
      if (!el) return;
      el.textContent = String(n);
      el.hidden = n === 0;
    };
    Promise.all([
      api.request('/adm/solicitacoes').catch(function () { return null; }),
      api.request('/adm/voluntarios').catch(function () { return null; })
    ]).then(function (r) {
      if (r[0]) mostrar(cs, pendentes(r[0]));
      if (r[1]) mostrar(cv, pendentes(r[1]));
    });
  }

  /* ---------- Início ---------- */
  if (tela === 'login') { login(); return; }
  if (tela === 'esqueci-senha') { recuperarSenha(); return; }

  if (!carregar[tela]) return;

  if (!api.token()) { location.replace('gestao.html'); return; }

  montarSaida();
  ligarFiltros();
  ligarExportacao();
  contagensDoMenu();
  var recarregar = function () { return carregar[tela](); };
  ligarAcoes(recarregar);
  formularios(recarregar);
  recarregar().catch(function (erro) {
    if (!api.token()) { location.replace('gestao.html'); return; }
    avisar(erro.message || 'Não foi possível carregar os dados do painel.', 'erro');
  });
})();
