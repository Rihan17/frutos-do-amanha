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

  /* "Rua Geralda Martins de Oliveira, 355 — Vila Matias, São Vicente/SP",
     montado com o que existir. Os cadastros antigos não têm endereço nenhum,
     e os novos podem ter só o bairro: em qualquer caso sai a linha possível,
     ou um traço. */
  /* O CPF é guardado só com os números, porque é assim que o backend compara
     cadastro repetido. Na tela ele volta com os pontos, que é como a pessoa
     leu no documento e como ela digitou no formulário. */
  function cpf(valor) {
    var d = String(valor == null ? '' : valor).replace(/\D/g, '');
    if (d.length !== 11) return valor || '';
    return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
  }

  /* ---------- Dias e horarios de uma turma ---------- */
  /* O banco guarda os dias como codigos de tres letras, que a tela marca em
     caixas. Aqui eles voltam a ser palavras, na ordem da semana. */
  var NOME_DIA = {
    SEG: 'segunda', TER: 'terça', QUA: 'quarta', QUI: 'quinta',
    SEX: 'sexta', SAB: 'sábado', DOM: 'domingo'
  };
  var ORDEM_DIA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

  function dias(lista) {
    var nomes = (lista || []).slice().sort(function (a, b) {
      return ORDEM_DIA.indexOf(a) - ORDEM_DIA.indexOf(b);
    }).map(function (d) { return NOME_DIA[d] || d; });
    if (!nomes.length) return '';
    /* "segunda, quarta e sexta": o "e" no fim e o jeito que a pessoa fala,
       e esta frase vai inteira para o WhatsApp da familia. */
    if (nomes.length === 1) return nomes[0];
    return nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1];
  }

  function horario(a) {
    if (!a || !a.horarioInicio) return '';
    return a.horarioFim ? a.horarioInicio + ' às ' + a.horarioFim : 'a partir das ' + a.horarioInicio;
  }

  /* "terça e quinta, 14:00 às 16:00" — uma linha só, com o que existir. */
  function quando(a) {
    return [dias(a && a.dias), horario(a)].filter(Boolean).join(', ');
  }

  /* "12 de 20" quando ha teto, so a contagem quando nao ha. */
  function ocupacao(a) {
    if (!a) return '—';
    return a.vagas > 0 ? a.inscritos + ' de ' + a.vagas
      : a.inscritos + (a.inscritos === 1 ? ' inscrita' : ' inscritas') + ' · sem limite';
  }

  function endereco(r) {
    if (!r) return '—';
    var rua = [r.endereco, r.numero].filter(Boolean).join(', ');
    if (r.complemento) rua = (rua ? rua + ' ' : '') + r.complemento;
    var lugar = [r.bairro, [r.cidade, r.uf].filter(Boolean).join('/')].filter(Boolean).join(', ');
    return [rua, lugar].filter(Boolean).join(' — ') || '—';
  }

  /* ---------- Preencher a tabela da tela ---------- */
  /* Um elemento escondido (ou dentro de um [hidden]) não tem offsetParent.
     É assim que a tela de Doações sabe qual das duas visões está no ar. */
  function visivel(el) { return !!el && el.offsetParent !== null; }

  function corpoDaTabela() {
    /* A maioria das telas tem uma seção #lista-*, que isola a tabela principal
       das auxiliares. A visão geral não tem, e aí vale a primeira da página.
       Doações tem duas, uma por visão: vale a que está aparecendo. */
    var secoes = $$('[id^="lista-"]');
    var secao = secoes.filter(visivel)[0] || secoes[0];
    var tbody = secao && $('table.tabela tbody', secao);
    return tbody || $('.tabela--rolavel table.tabela tbody') || $('table.tabela tbody');
  }

  /* Mesma ideia para os filtros: cada visão tem os seus. */
  function caixaDeFiltros() {
    var caixas = $$('[data-filtros]');
    return caixas.filter(visivel)[0] || caixas[0] || null;
  }

  /* Escreve numa seção específica, e não na visível: a tela de Doações monta
     as duas de uma vez, para trocar de visão sem ir à API de novo. */
  function preencherSecao(id, linhas, colunas, vazio) {
    var secao = document.getElementById(id);
    var tbody = secao && $('table.tabela tbody', secao);
    if (!tbody) return;
    tbody.innerHTML = linhas.length
      ? linhas.join('')
      : '<tr data-vazio><td colspan="' + colunas + '">' + esc(vazio) + '</td></tr>';
  }
  function preencher(linhas, colunas, vazio) {
    var tbody = corpoDaTabela();
    if (!tbody) return;
    if (!linhas.length) {
      tbody.innerHTML = '<tr data-vazio><td colspan="' + colunas + '">' + esc(vazio) + '</td></tr>';
      return;
    }
    tbody.innerHTML = linhas.join('');
    /* A tabela foi redesenhada do zero: os filtros que saem dela precisam ser
       refeitos, e o que estiver em uso precisa valer de novo. */
    encherFiltrosAutomaticos();
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
  function grafico(doacoes) {
    var ul = $('.barras');
    if (!ul) return;
    var hoje = new Date();
    var meses = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      meses.push({ mes: d.getMonth(), ano: d.getFullYear(), pagas: 0, abertas: 0, valor: 0 });
    }
    doacoes.forEach(function (doa) {
      var x = new Date(doa.data);
      if (isNaN(x)) return;
      meses.forEach(function (m) {
        if (x.getMonth() !== m.mes || x.getFullYear() !== m.ano) return;
        if (String(doa.status).toUpperCase() === 'CONFIRMADA') {
          m.pagas++;
          m.valor += Number(doa.valor || 0);
        } else {
          m.abertas++;
        }
      });
    });

    /* A altura é o número de doações do mês, comparado com o mês mais
       movimentado. A cor dentro da barra é a proporção que foi mesmo paga:
       de 10 doações com 2 pagas, a barra fica 20% verde embaixo e 80%
       vermelha em cima. Sem nenhuma doação no período as barras zeram, que é
       a informação verdadeira. */
    var maior = meses.reduce(function (s, m) { return Math.max(s, m.pagas + m.abertas); }, 0);
    var descrever = function (m) {
      var total = m.pagas + m.abertas;
      if (!total) return MESES[m.mes] + ': nenhuma doação';
      return MESES[m.mes] + ': ' + m.pagas + (m.pagas === 1 ? ' paga' : ' pagas') +
        ' (' + moeda(m.valor) + ') e ' + m.abertas +
        (m.abertas === 1 ? ' sem pagamento' : ' sem pagamento');
    };
    ul.innerHTML = meses.map(function (m) {
      var total = m.pagas + m.abertas;
      /* Mínimo de 2% para o mês com movimento não sumir ao lado de um mês
         muito maior: uma barra invisível parece mês sem doação. */
      var altura = maior > 0 && total > 0 ? Math.max(2, Math.round((total / maior) * 100)) : 0;
      var pago = total > 0 ? Math.round((m.pagas / total) * 100) : 0;
      var detalhe = descrever(m);
      return '<li tabindex="0" aria-label="' + esc(detalhe) + '" data-detalhe="' + esc(detalhe) + '">' +
        '<i style="--h:' + altura + '%;--pago:' + pago + '%"></i>' +
        '<small>' + MESES[m.mes] + '</small></li>';
    }).join('');
    /* Com as colunas navegáveis pelo teclado, o gráfico deixa de ser uma
       imagem só e vira uma lista: cada coluna se anuncia sozinha. */
    ul.removeAttribute('role');
    ul.removeAttribute('aria-label');

    var legenda = ul.parentNode && $('.legenda', ul.parentNode);
    if (legenda) {
      legenda.textContent = 'Altura: quantas doações no mês. Verde: pagas. Vermelho: sem pagamento. '
        + 'Passe o mouse ou use Tab para ver os números.';
    }
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
    var caixa = caixaDeFiltros();
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

    /* Cada visão tem o seu contador. Procurar pelo documento inteiro pegaria
       o da visão escondida, e o número apareceria no lugar errado. */
    var contadores = $$('[data-filtro-contagem]');
    var contador = contadores.filter(visivel)[0] || contadores[0];
    if (contador) {
      contador.textContent = visiveis === total
        ? total + (total === 1 ? ' registro' : ' registros')
        : visiveis + ' de ' + total;
    }
  }

  /* Selects marcados com data-filtro-auto se preenchem com os valores que
     existem mesmo na coluna. As opções escritas à mão no HTML eram de
     maquete: "Vila Matias", "Jardim Rio Branco" e por aí, bairros que podem
     não existir no banco — e aí filtrar por eles não devolvia nada. */
  function encherFiltrosAutomaticos() {
    var caixa = caixaDeFiltros();
    if (!caixa) return;
    $$('[data-filtro-auto]', caixa).forEach(function (sel) {
      var i = Number(sel.getAttribute('data-filtro-coluna'));
      var vistos = {};
      linhasDaTabela().forEach(function (tr) {
        if (tr.hasAttribute('data-vazio') || tr.hasAttribute('data-sem-resultado')) return;
        var v = celula(tr, i);
        if (v && v !== '—') vistos[v] = true;
      });
      var escolhido = sel.value;
      var rotulo = sel.getAttribute('data-filtro-rotulo') || 'Todos';
      sel.innerHTML = '<option value="">' + esc(rotulo) + '</option>' +
        Object.keys(vistos).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); })
          .map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('');
      if (escolhido) sel.value = escolhido;
      /* Coluna sem nenhum valor (ou toda em "—") não tem o que filtrar: o
         select sai da tela em vez de ficar ali só com "Todas". */
      var campo = sel.closest('.campo');
      if (campo) campo.hidden = !Object.keys(vistos).length;
    });
  }

  /* Troca entre "Por doação" e "Por pessoa" sem ir à API: as duas tabelas já
     foram montadas no mesmo carregamento. Cada visão tem os seus filtros, e
     por isso eles são reaplicados depois da troca. */
  function ligarVisoes() {
    var botoes = $$('[data-ver]');
    if (!botoes.length) return;
    botoes.forEach(function (b) {
      b.addEventListener('click', function () {
        var alvo = b.getAttribute('data-ver');
        botoes.forEach(function (outro) {
          outro.setAttribute('aria-selected', String(outro === b));
        });
        $$('[data-visao]').forEach(function (painel) {
          painel.hidden = painel.getAttribute('data-visao') !== alvo;
        });
        encherFiltrosAutomaticos();
        aplicarFiltros();
      });
    });
  }

  function ligarFiltros() {
    /* Liga em todas as caixas, e não só na visível: a tela de Doações tem uma
       por visão, e a escondida vira a visível quando a pessoa troca. */
    $$('[data-filtros] input, [data-filtros] select').forEach(function (c) {
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
  /* ==========================================================
     Modal

     Substitui o confirm e o prompt do navegador. Os dois tinham o mesmo
     defeito: cabem uma frase e nada mais. Para decidir uma solicitação de
     vaga, a pessoa precisa LER o motivo que a família escreveu, e isso não
     cabia num confirm — ela aprovava ou recusava sem ver o pedido.

     O mesmo modal faz dois trabalhos: a análise, que mostra o pedido inteiro
     e oferece aprovar ou recusar, e a confirmação simples de uma ação como
     excluir. Recusar sempre exige um motivo escrito.
     ========================================================== */
  var caixa = null;
  function modal() {
    if (caixa) return caixa;
    caixa = document.createElement('dialog');
    caixa.className = 'modal';
    caixa.innerHTML =
      '<div class="modal__caixa">' +
      '  <h2 class="modal__titulo" data-modal-titulo></h2>' +
      '  <div class="modal__corpo" data-modal-corpo></div>' +
      '  <div class="modal__escolhas" data-modal-escolhas hidden></div>' +
      '  <div class="campo modal__campo" data-modal-campo hidden>' +
      '    <label for="modal-texto" data-modal-rotulo></label>' +
      '    <textarea id="modal-texto" data-modal-texto rows="3"></textarea>' +
      '    <small class="modal__erro" data-modal-erro hidden></small>' +
      '  </div>' +
      '  <div class="modal__acoes" data-modal-acoes></div>' +
      '</div>';
    /* Rede de segurança: qualquer caminho que feche o dialog devolve a bola
       do cursor para o body. Sem isso, um close() que não passe pelo fechar()
       a deixaria presa dentro de um dialog escondido, e aí o cursor sumiria
       de vez, também fora do modal. */
    /* O evento close chega numa tarefa posterior, e nao na hora. Entre o
       fechar e o evento cabe a abertura do proximo modal — uma analise
       aprovada abre o convite do WhatsApp logo em seguida. Sem esta
       conferência, o close do primeiro arrancaria a bola do cursor de
       dentro do segundo, que acabou de abrir. */
    caixa.addEventListener('close', function () { if (!caixa.open) devolverCursor(); });
    document.body.appendChild(caixa);
    return caixa;
  }

  /* O cursor desenhado do site, dentro e fora do modal.

     Um <dialog> aberto com showModal() entra na camada de topo do navegador,
     que fica acima de tudo o que a página desenha, por maior que seja o
     z-index. A bola do cursor é um elemento comum do <body>, então ela ficava
     atrás do modal — e, como o CSS esconde o ponteiro do sistema justamente
     para dar lugar a ela, não sobrava cursor nenhum na tela.

     A saída é levar a bola para dentro do próprio dialog enquanto ele está
     aberto: ali ela sobe junto para a camada de topo e volta a aparecer. Ela
     é position: fixed e nada no caminho do modal cria bloco de contenção
     (nem transform, nem filter), então continua seguindo o ponteiro pela tela
     inteira, como se não tivesse saído do lugar. */
  var bolaDoCursor = null, bolaVizinha = null;
  function levarCursor(d) {
    bolaDoCursor = $('[data-cursor-el]', document);
    if (!bolaDoCursor) return;
    /* Guarda onde ela mora para devolver no mesmo ponto: a ordem dentro do
       body decide quem fica por cima entre elementos de mesmo nível. */
    bolaVizinha = bolaDoCursor.nextSibling;
    d.appendChild(bolaDoCursor);
  }
  function devolverCursor() {
    if (!bolaDoCursor) return;
    document.body.insertBefore(bolaDoCursor, bolaVizinha);
    bolaDoCursor = null;
  }

  /* Devolve { valor, texto } do botão escolhido, ou null se a pessoa
     desistiu (Cancelar, Esc ou clique fora). */
  function abrirModal(opcoes) {
    var d = modal();
    var titulo = $('[data-modal-titulo]', d), corpo = $('[data-modal-corpo]', d);
    var campo = $('[data-modal-campo]', d), rotulo = $('[data-modal-rotulo]', d);
    var escolhas = $('[data-modal-escolhas]', d);
    var texto = $('[data-modal-texto]', d), erro = $('[data-modal-erro]', d);
    var botoes = $('[data-modal-acoes]', d);

    titulo.textContent = opcoes.titulo || 'Confirmar';
    /* Dois tipos de conteúdo no corpo: um recado em prosa, para o que a
       ação vai causar, e os pares rótulo/valor do pedido que se analisa. */
    corpo.innerHTML =
      (opcoes.texto ? '<p class="modal__aviso">' + esc(opcoes.texto) + '</p>' : '') +
      (opcoes.detalhes || []).map(function (par) {
        return '<p class="modal__linha"><b>' + esc(par[0]) + '</b><span>' + esc(par[1] || '—') + '</span></p>';
      }).join('');
    /* Caixas de marcar, quando a decisão não é sim ou não mas "quais".
       É o caso das atividades de uma criança: ela pode estar em várias, e
       quem decide precisa ver as que já valem antes de mexer. */
    escolhas.innerHTML = (opcoes.escolhas || []).map(function (e) {
      /* Turma cheia aparece, e nao some: esconde-la faria parecer que a
         atividade nao existe. Ela vem desligada e dizendo por que. */
      return '<label class="marcar' + (e.desligada ? ' marcar--fora' : '') + '">' +
        '<input type="checkbox" value="' + esc(e.valor) + '"' +
        (e.marcado ? ' checked' : '') + (e.desligada ? ' disabled' : '') +
        '><span>' + esc(e.rotulo) + '</span></label>';
    }).join('');
    escolhas.hidden = !(opcoes.escolhas && opcoes.escolhas.length);
    campo.hidden = true;
    texto.value = '';
    erro.hidden = true;
    botoes.innerHTML = '';

    return new Promise(function (resolve) {
      var respondido = false;
      function fechar(resultado) {
        if (respondido) return;
        respondido = true;
        devolverCursor();
        d.close();
        resolve(resultado);
      }

      (opcoes.botoes || []).forEach(function (b) {
        var el = document.createElement('button');
        el.type = 'button';
        el.className = b.tom === 'perigo' ? 'botao botao--doar' : 'botao botao--folha';
        el.textContent = b.rotulo;
        el.addEventListener('click', function () {
          /* Botão que leva para fora em vez de mandar algo para a API. O
             window.open sai de dentro do clique da pessoa, que é o que o
             bloqueador de pop-up exige para deixar passar. */
          if (b.url) { window.open(b.url, '_blank', 'noopener'); fechar({ valor: b.valor }); return; }
          if (b.pedirTexto && campo.hidden) {
            /* O primeiro clique abre o campo do motivo; o envio só sai no
               segundo, com o motivo escrito. Assim ninguém recusa sem
               justificar por engano. */
            campo.hidden = false;
            rotulo.textContent = b.rotuloTexto || 'Escreva o motivo';
            el.textContent = b.rotuloConfirmar || 'Confirmar';
            texto.focus();
            return;
          }
          if (b.pedirTexto && !texto.value.trim()) {
            erro.textContent = b.erroTexto || 'Escreva o motivo para continuar.';
            erro.hidden = false;
            texto.focus();
            return;
          }
          fechar({
            valor: b.valor,
            texto: texto.value.trim(),
            /* :checked pega tambem as desligadas, e tem de pegar: uma turma
               que encheu depois da crianca entrar nao pode sumir da lista
               dela so porque a caixa veio travada. */
            marcados: $$('input:checked', escolhas).map(function (c) { return c.value; })
          });
        });
        botoes.appendChild(el);
      });

      var cancelar = document.createElement('button');
      cancelar.type = 'button';
      cancelar.className = 'link';
      cancelar.textContent = opcoes.rotuloFechar || 'Cancelar';
      cancelar.addEventListener('click', function () { fechar(null); });
      botoes.appendChild(cancelar);

      /* Esc dispara "cancel" no dialog; clique no fundo escuro fecha também. */
      d.oncancel = function (ev) { ev.preventDefault(); fechar(null); };
      d.onclick = function (ev) { if (ev.target === d) fechar(null); };
      /* Rede de segurança da promessa. Quem fecha pelo botão, pelo Esc ou
         clicando no fundo passa por fechar(), que resolve. Um close() dado
         de outro lugar não passaria, e a promessa ficaria pendurada para
         sempre — com ela, o recarregar da lista que vem depois. */
      d.addEventListener('close', function () { if (!d.open) fechar(null); }, { once: true });
      d.showModal();
      levarCursor(d);
      var primeiro = botoes.querySelector('button');
      if (primeiro) primeiro.focus();
    });
  }

  /* Link que abre a análise de um pedido. Os dados vão num JSON no próprio
     atributo, porque a lista é remontada a cada recarga e guardar referência
     a objetos daria trabalho sem ganho. */
  function botaoAnalise(rotulo, dados) {
    return '<a class="link" href="#" data-analisar="' + esc(JSON.stringify(dados)) + '" data-broto>' +
      esc(rotulo) + '</a>';
  }

  /* ==========================================================
     Avisar pelo WhatsApp

     Quem pede uma vaga ou se candidata ficava sem resposta: a decisão
     acontecia no painel e parava ali. Agora, assim que a análise é enviada,
     o painel oferece a conversa certa com o texto já escrito.

     Não é envio automático, e isso é de propósito: mandar sozinho exigiria
     a conta de WhatsApp Business da Meta, com a ONG verificada, modelos de
     mensagem aprovados e cobrança por envio. O que dá para fazer sem nada
     disso é tirar o trabalho manual do caminho — quem está de plantão
     confere o texto e aperta enviar, em vez de procurar o telefone na lista
     e escrever tudo de novo.
     ========================================================== */
  function numeroWhatsapp(telefone) {
    var so = String(telefone || '').replace(/\D/g, '');
    /* O formulário guarda no formato daqui, "(13) 98888-0000": dez ou onze
       dígitos, com DDD e sem país. O wa.me só aceita com o código do país. */
    if (so.length === 10 || so.length === 11) return '55' + so;
    if ((so.length === 12 || so.length === 13) && so.indexOf('55') === 0) return so;
    /* Telefone estranho (ramal, número de fora, digitação errada): melhor
       mostrar o texto para copiar do que montar um link que não abre. */
    return null;
  }

  function oferecerWhatsapp(whats, aprovado, motivo) {
    if (!whats || !whats.telefone) return;
    var texto = aprovado ? whats.aprovado : String(whats.recusado || '').replace('{motivo}', motivo || '');
    if (!texto) return;
    var numero = numeroWhatsapp(whats.telefone);
    return abrirModal({
      titulo: 'Pronto. Avisar a pessoa?',
      texto: numero
        ? 'O WhatsApp abre numa aba nova com a mensagem já escrita. Confira e envie.'
        : 'O telefone cadastrado não dá para abrir no WhatsApp. Copie a mensagem abaixo.',
      detalhes: [['Para', (whats.nome || 'contato') + ' · ' + whats.telefone], ['Mensagem', texto]],
      botoes: numero ? [{ rotulo: 'Abrir o WhatsApp', valor: 'abrir',
        url: 'https://wa.me/' + numero + '?text=' + encodeURIComponent(texto) }] : [],
      rotuloFechar: numero ? 'Agora não' : 'Fechar'
    });
  }

  function ligarAnalise(recarregar) {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-analisar]');
      if (!link) return;
      e.preventDefault();
      var dados;
      try { dados = JSON.parse(link.getAttribute('data-analisar')); } catch (erro) { return; }

      var botoes = [];
      if (dados.aprovar) {
        botoes.push({ rotulo: 'Aprovar', valor: 'aprovar' });
      }
      if (dados.recusar) {
        botoes.push({
          rotulo: 'Recusar', valor: 'recusar', tom: 'perigo', pedirTexto: true,
          rotuloTexto: 'Por que está recusando? A pessoa recebe este texto.',
          rotuloConfirmar: 'Confirmar recusa',
          erroTexto: 'A recusa precisa de um motivo escrito.'
        });
      }

      /* A ficha de uma turma mostra quem esta nela, e isso e uma busca a
         parte: a lista de atividades traz so a contagem, para nao carregar o
         nome de todas as criancas de todas as turmas a cada abertura da
         tela. */
      var antes = dados.criancasDe
        ? api.request('/adm/atividades/' + dados.criancasDe + '/criancas').catch(function () { return []; })
        : Promise.resolve(null);

      antes.then(function (criancas) {
        var detalhes = dados.detalhes || [];
        if (criancas) {
          detalhes = detalhes.concat(criancas.length
            ? criancas.map(function (c) {
                return ['Criança', c.nome + (c.ativo ? '' : ' (saiu da ONG)')];
              })
            : [['Crianças', 'Nenhuma inscrita ainda']]);
          criancas.filter(function (c) { return c.ativo; }).forEach(function (c) {
            botoes.push({
              rotulo: 'Tirar ' + primeiroNome(c.nome), valor: 'tirar:' + c.id, tom: 'perigo'
            });
          });
        }

      abrirModal({
        titulo: dados.titulo,
        detalhes: detalhes,
        botoes: botoes,
        rotuloFechar: botoes.length ? 'Cancelar' : 'Fechar'
      }).then(function (escolha) {
        if (!escolha) return;
        /* Tirar uma crianca da turma vem daqui, e nao de uma aprovacao: o
           botao carrega o id dela no proprio valor. */
        if (String(escolha.valor).indexOf('tirar:') === 0) {
          var quem = escolha.valor.slice('tirar:'.length);
          return api.request('/adm/atividades/' + dados.criancasDe + '/criancas/' + quem,
            { method: 'DELETE' })
            .then(function () { avisar('Pronto. A criança saiu da atividade.'); return recarregar(); })
            .catch(function (erro) { avisar(erro.message || 'Não foi possível tirar.', 'erro'); });
        }
        var rota = escolha.valor === 'aprovar' ? dados.aprovar : dados.recusar;
        /* O nome do campo é o do RecusaRequest no backend; "justificativa"
           sozinho volta 400 com "A justificativa da recusa é obrigatória". */
        var corpo = escolha.valor === 'recusar' ? { justificativaRecusa: escolha.texto } : undefined;
        link.textContent = 'Enviando…';
        return api.request(rota, { method: 'PUT', body: corpo })
          .then(function () {
            avisar('Pronto. A lista foi atualizada.');
            /* O aviso vem antes de recarregar: a lista se refaz enquanto a
               pessoa lê a mensagem, e não some a linha de baixo dela. */
            return oferecerWhatsapp(dados.whats, escolha.valor === 'aprovar', escolha.texto);
          })
          .then(function () { return recarregar(); })
          .catch(function (erro) {
            link.textContent = rotulo(link);
            avisar(erro.message || 'Não foi possível concluir.', 'erro');
          });
      });

      });

      function rotulo() { return dados.aprovar ? 'Analisar' : 'Ver'; }
    });
  }

  function primeiroNome(nome) { return String(nome || '').trim().split(/\s+/)[0] || 'a criança'; }

  /* ==========================================================
     Atividades de uma criança

     A coluna "Atividades" da tela de Crianças mostrava em quais projetos cada
     uma estava, e não havia por onde mudar isso: dava para ver e não dava
     para inscrever ninguém. A inscrição acontecia fora do painel.

     O modal traz os projetos ativos com as atuais já marcadas — trocar uma
     atividade é desmarcar e marcar, e quem decide vê o estado de hoje antes
     de mexer. Depois de salvar, o painel oferece o recado para o responsável,
     como na aprovação de uma solicitação.
     ========================================================== */
  function botaoAtividades(dados) {
    return '<a class="link" href="#" data-atividades="' + esc(JSON.stringify(dados)) + '" data-broto>' +
      'Atividades</a>';
  }

  function ligarAtividades(recarregar) {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-atividades]');
      if (!link) return;
      e.preventDefault();
      var dados;
      try { dados = JSON.parse(link.getAttribute('data-atividades')); } catch (erro) { return; }
      var atuais = dados.atuais || [];

      var turmas = dados.turmas || [];

      abrirModal({
        titulo: 'Atividades de ' + (dados.nome || 'esta criança'),
        texto: turmas.length
          ? 'Marque as turmas em que ela participa. Desmarcar tira a criança da turma.'
          : 'Nenhuma atividade ativa no momento. Crie uma em Atividades para poder inscrever.',
        escolhas: turmas.map(function (t) {
          var dentro = atuais.indexOf(t.id) >= 0;
          var cheia = t.vagasLivres === 0 && !dentro;
          /* Dia, hora e vaga ao lado do nome: quem inscreve decide com isso
             na frente, em vez de abrir a tela de Atividades para conferir. */
          var detalhe = [t.quando, cheia ? 'turma cheia'
            : (t.vagasLivres == null ? 'sem limite de vagas'
               : t.vagasLivres + (t.vagasLivres === 1 ? ' vaga livre' : ' vagas livres'))]
            .filter(Boolean).join(' · ');
          return {
            valor: t.id, marcado: dentro, desligada: cheia,
            rotulo: t.nome + (detalhe ? ' — ' + detalhe : '')
          };
        }),
        botoes: turmas.length ? [{ rotulo: 'Salvar', valor: 'salvar' }] : [],
        rotuloFechar: turmas.length ? 'Cancelar' : 'Fechar'
      }).then(function (escolha) {
        if (!escolha) return;
        var marcados = escolha.marcados || [];
        /* Lista igual: sem pedido ao servidor e sem recado — ninguém precisa
           saber de uma mudança que não houve. */
        if (marcados.length === atuais.length &&
            marcados.every(function (id) { return atuais.indexOf(id) >= 0; })) {
          avisar('Nada mudou nas atividades.');
          return;
        }
        /* Uma linha por turma, com o dia e a hora: e esta lista que vai para
           o WhatsApp, e e por ela que a familia se organiza na semana. */
        var escolhidas = turmas.filter(function (t) { return marcados.indexOf(t.id) >= 0; });
        var nomes = escolhidas.map(function (t) {
          return '• ' + t.nome + (t.quando ? ' — ' + t.quando : '');
        });

        link.textContent = 'Salvando…';
        return api.request('/adm/beneficiarios/' + dados.id, {
          method: 'PUT', body: { atividadeIds: marcados }
        }).then(function () {
          avisar('Pronto. As atividades foram salvas.');
          /* Sem nenhuma atividade não há o que anunciar: a saída de um projeto
             é conversa, não recado automático. */
          if (!nomes.length) return;
          return oferecerWhatsapp({
            nome: dados.responsavel, telefone: dados.telefone,
            aprovado: 'Olá, ' + (dados.responsavel || '') + '! Aqui é da ONG Frutos do Amanhã.\n\n' +
              /* "participa de", e não "está inscrito" nem "inscrita": o nome da
                 criança não diz o gênero dela, e errar isso num recado que vai
                 para a família é feio. */
              (dados.nome || 'A criança') + ' agora participa de:\n\n' + nomes.join('\n') + '\n\n' +
              'Qualquer dúvida sobre horários ou material, pode falar com a gente por aqui.'
          }, true);
        }).then(function () { return recarregar(); })
          .catch(function (erro) {
            link.textContent = 'Atividades';
            avisar(erro.message || 'Não foi possível salvar.', 'erro');
          });
      });
    });
  }

  function ligarAcoes(recarregar) {
    document.addEventListener('click', function (e) {
      var botao = e.target.closest('[data-acao]');
      if (!botao) return;
      e.preventDefault();
      var acao = botao.getAttribute('data-acao');
      var rota = botao.getAttribute('data-rota');
      var pergunta = botao.getAttribute('data-pergunta') || 'Confirmar?';
      /* Algumas ações só valem com um texto escrito: promover pede a função
         (CargoRequest) e excluir uma criança pede o motivo da saída, que fica
         guardado no histórico dela. O nome do campo no corpo do pedido vem do
         próprio botão, em data-campo; sem ele a ação vai sem corpo. */
      var campoTexto = botao.getAttribute('data-campo') || (acao === 'promover' ? 'cargo' : null);
      var destrutiva = acao === 'excluir' || acao === 'desativar' || acao === 'rebaixar';
      var atributo = function (nome, padrao) { return botao.getAttribute(nome) || padrao; };

      abrirModal({
        titulo: pergunta,
        texto: botao.getAttribute('data-aviso'),
        botoes: [{
          rotulo: campoTexto
            ? atributo('data-abrir', destrutiva ? botao.textContent : 'Informar a função')
            : (destrutiva ? botao.textContent : 'Confirmar'),
          valor: 'ok',
          tom: destrutiva ? 'perigo' : 'normal',
          pedirTexto: !!campoTexto,
          rotuloTexto: atributo('data-rotulo-texto', 'Função desta pessoa na ONG'),
          rotuloConfirmar: atributo('data-confirmar', 'Dar o acesso'),
          erroTexto: atributo('data-erro-texto', 'Informe a função para dar o acesso.')
        }]
      }).then(function (escolha) {
        if (!escolha) return;
        var corpo;
        if (campoTexto) { corpo = {}; corpo[campoTexto] = escolha.texto; }
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
        return api.request(rota, { method: metodo, body: corpo })
          .then(function () { avisar('Pronto. A lista foi atualizada.'); return recarregar(); })
          .catch(function (erro) {
            /* Sem recarregar a lista, o botão continua na tela: devolve o
               rótulo dele para a ação poder ser tentada de novo. */
            botao.textContent = rotulo;
            avisar(erro.message || 'Não foi possível concluir.', 'erro');
          });
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
        api.request('/adm/usuarios')
      ]).then(function (r) {
        /* Sem /adm/planos: a doação mensal saiu do site, e o cartão
           "Doações mensais ativas" saiu junto. Os endpoints de plano
           continuam na API para quem precisar ver uma assinatura antiga. */
        var sols = r[0], vols = r[1], bens = r[2], doas = r[3], users = r[4];
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
          bens.filter(function (b) { return b.ativo; }).length,
          responsaveis.size,
          vols.filter(function (v) { return v.status === 'APROVADA'; }).length,
          users.filter(function (u) { return u.tipo === 'COMUM' && u.ativo; }).length
        ]);
        /* O mesmo gráfico da tela de Doações. Aqui as barras tinham ficado
           como estavam no HTML: alturas inventadas de maio a outubro, que
           não mudavam com as doações de verdade e não diziam nada ao passar
           o mouse. Agora as duas telas leem a mesma função e mostram o
           valor do mês no mesmo lugar. */
        grafico(doas);

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
          var b = s.beneficiario || {}, r = s.responsavel || {};
          /* Uma entrada só, que abre o pedido inteiro. Antes eram dois
             botões que perguntavam "Aprovar?" num confirm, e quem decidia
             nunca via o motivo que a família escreveu. */
          var dados = {
            titulo: 'Solicitação de vaga — ' + (b.nome || 'criança'),
            detalhes: [
              ['Criança', b.nome],
              ['Idade', idade(b.dataNascimento)],
              ['Responsável', r.nome],
              ['Parentesco', r.parentesco],
              ['Telefone', r.telefone],
              ['E-mail', r.email],
              ['Endereço', endereco(r)],
              ['Recebida em', data(s.dataSolicitacao)],
              ['Situação', NOME_SITUACAO[String(s.status).toUpperCase()] || s.status],
              /* A pergunta do formulário público, com as mesmas palavras que
                 a família leu ao responder: é o texto que quem decide precisa
                 ler antes de aprovar ou recusar. */
              ['Por que está procurando a ONG', s.motivo]
            ].filter(function (par) { return par[1] && par[1] !== '—'; })
          };
          if (s.status === 'PENDENTE') {
            dados.aprovar = '/adm/solicitacoes/' + s.id + '/aprovar';
            dados.recusar = '/adm/solicitacoes/' + s.id + '/recusar';
            /* Quem recebe o recado é o responsável, não a criança: o telefone
               do cadastro é o dele, e é com ele que a ONG combina. */
            dados.whats = {
              nome: r.nome, telefone: r.telefone,
              aprovado: 'Olá, ' + (r.nome || '') + '! Aqui é da ONG Frutos do Amanhã.\n\n' +
                'A solicitação de vaga para ' + (b.nome || 'a criança') + ' foi aprovada.\n\n' +
                'Pode falar com a gente por aqui para combinarmos os próximos passos.',
              recusado: 'Olá, ' + (r.nome || '') + '! Aqui é da ONG Frutos do Amanhã.\n\n' +
                'Infelizmente não conseguimos aprovar a solicitação de vaga para ' +
                (b.nome || 'a criança') + ' neste momento.\n\nMotivo: {motivo}\n\n' +
                'Qualquer dúvida, pode falar com a gente por aqui.'
            };
          } else if (s.justificativaRecusa) {
            dados.detalhes.push(['Motivo da recusa', s.justificativaRecusa]);
          }
          var acao = acoes([botaoAnalise(s.status === 'PENDENTE' ? 'Analisar' : 'Ver', dados)]);
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
          var dados = {
            titulo: 'Candidatura — ' + (v.nomeContato || 'voluntário'),
            detalhes: [
              ['Nome', v.nomeContato],
              ['E-mail', v.emailContato],
              ['Telefone', v.telefoneContato],
              ['Área de interesse', area.trim()],
              ['Disponibilidade', disp.trim()],
              ['Enviada em', data(v.dataInscricao)],
              ['Situação', NOME_SITUACAO[String(v.status).toUpperCase()] || v.status],
              /* A observação inteira, como a pessoa escreveu: é nela que vem
                 o recado de quem se candidata, e o resumo acima pode ter
                 deixado algo de fora. */
              ['O que a pessoa escreveu', v.observacao]
            ].filter(function (par) { return par[1] && par[1] !== '—'; })
          };
          if (v.status === 'PENDENTE') {
            dados.aprovar = '/adm/voluntarios/' + v.id + '/aprovar';
            dados.recusar = '/adm/voluntarios/' + v.id + '/recusar';
            dados.whats = {
              nome: v.nomeContato, telefone: v.telefoneContato,
              aprovado: 'Olá, ' + (v.nomeContato || '') + '! Aqui é da ONG Frutos do Amanhã.\n\n' +
                'Sua candidatura para o voluntariado foi aprovada.\n\n' +
                'Pode falar com a gente por aqui para combinarmos como você começa.',
              recusado: 'Olá, ' + (v.nomeContato || '') + '! Aqui é da ONG Frutos do Amanhã.\n\n' +
                'Neste momento não vamos seguir com a sua candidatura para voluntariado.\n\n' +
                'Motivo: {motivo}\n\nObrigado pelo interesse — dá para se candidatar de novo mais para a frente.'
            };
          } else if (v.justificativaRecusa) {
            dados.detalhes.push(['Motivo da recusa', v.justificativaRecusa]);
          }
          var botoes = [botaoAnalise(v.status === 'PENDENTE' ? 'Analisar' : 'Ver', dados)];
          /* As mesmas duas saídas da lista de crianças. Encerrar guarda a
             data e deixa a candidatura na lista; excluir apaga. Quem já
             está encerrado só tem a segunda. */
          if (v.status !== 'ENCERRADA') {
            botoes.push(botaoAcao('Encerrar', 'encerrar', '/adm/voluntarios/' + v.id + '/encerrar',
              'Encerrar a participação de ' + (v.nomeContato || 'esta pessoa') + '?'));
          }
          botoes.push(botaoAcao('Excluir', 'excluir', '/adm/voluntarios/' + v.id,
            'Apagar a candidatura de ' + (v.nomeContato || 'esta pessoa') + ' para sempre?',
            ' data-metodo="DELETE" data-aviso="A candidatura some da ONG e não dá para desfazer. ' +
            'Para só encerrar a participação, feche aqui e use Encerrar."'));
          var acao = acoes(botoes);
          return linha([data(v.dataInscricao), esc(v.nomeContato || '—'), esc(area.trim()),
            esc(disp.trim()), etiqueta(v.status), acao]);
        }), 6, 'Nenhuma candidatura recebida até agora.');
      });
    },

    criancas: function () {
      return Promise.all([api.request('/adm/beneficiarios'),
          api.request('/adm/atividades').catch(function () { return []; })]).then(function (r) {
        var bens = r[0], todas = r[1] || [];
        var porId = {};
        todas.forEach(function (a) { porId[a.id] = a; });
        var nomeAtividade = function (id) { return porId[id] ? porId[id].nome : id; };
        /* Só as ativas entram na lista de marcar: o backend recusa inscrição
           nova em turma encerrada, e oferecer uma caixa que vai dar erro é
           pior do que não oferecer. As encerradas continuam aparecendo na
           coluna de quem já estava nelas. */
        var turmasAtivas = todas.filter(function (a) { return a.ativa; }).map(function (a) {
          return { id: a.id, nome: a.nome, quando: quando(a), vagasLivres: a.vagasLivres };
        });
        preencher(bens.map(function (b) {
          /* Duas saídas, porque são duas coisas diferentes.

             Encerrar é o caminho de sempre: a criança deixa de ser atendida,
             mas continua na lista com a data e o motivo — a passagem dela
             pela ONG faz parte do histórico. Por isso o motivo é
             obrigatório, como na recusa de uma solicitação. Quem já saiu
             não tem esse botão: não há o que encerrar de novo.

             Excluir apaga o cadastro e não tem volta. É para o registro que
             nunca devia existir — nome repetido, digitação errada —, e fica
             sempre disponível, inclusive para quem já saiu. */
          var botoes = [];
          if (b.ativo) {
            botoes.push(botaoAtividades({
              id: b.id, nome: b.nome, atuais: b.atividadeIds || [], turmas: turmasAtivas,
              responsavel: (b.responsavel && b.responsavel.nome) || '',
              telefone: (b.responsavel && b.responsavel.telefone) || ''
            }));
            botoes.push(botaoAcao('Encerrar', 'encerrar', '/adm/beneficiarios/' + b.id,
              'Encerrar o acompanhamento de ' + (b.nome || 'esta criança') + '?',
              ' data-metodo="DELETE" data-campo="motivoSaida" data-abrir="Encerrar"' +
              ' data-rotulo-texto="Por que ela está saindo? Fica guardado no histórico dela."' +
              ' data-confirmar="Confirmar saída"' +
              ' data-erro-texto="Escreva o motivo da saída para continuar."'));
          }
          botoes.push(botaoAcao('Excluir', 'excluir', '/adm/beneficiarios/' + b.id + '/permanente',
            'Apagar o cadastro de ' + (b.nome || 'esta criança') + ' para sempre?',
            ' data-metodo="DELETE" data-aviso="O cadastro some da ONG e não dá para desfazer. ' +
            'Para só tirar da lista de atendidas, feche aqui e use Encerrar."'));
          var acao = acoes(botoes);
          return linha([esc(b.nome), idade(b.dataNascimento), esc((b.responsavel && b.responsavel.nome) || '—'),
            esc((b.atividadeIds || []).map(nomeAtividade).join(', ') || '—'),
            etiqueta(b.ativo ? 'ATIVO' : 'INATIVO'), acao]);
        }), 6, 'Nenhuma criança cadastrada ainda. Elas entram ao aprovar uma solicitação.');
      });
    },

    responsaveis: function () {
      /* Não existe endpoint de responsáveis: eles vêm dentro dos beneficiários,
         e aqui são agrupados por nome para virar uma lista de pessoas. */
      /* Duas origens na mesma lista: quem a equipe cadastrou aqui, que vive
         na coleção própria, e quem entrou junto com uma solicitação aprovada
         e mora dentro do beneficiário. A chave é o nome, que é o que existe
         nos dois lados; quando a mesma pessoa aparece nas duas, o cadastro
         manda, porque é o que a equipe pode corrigir. */
      return Promise.all([
        api.request('/adm/beneficiarios'),
        api.request('/adm/responsaveis').catch(function () { return []; })
      ]).then(function (r) {
        var bens = r[0], cadastrados = r[1] || [];
        var porNome = {};
        var chave = function (nome) { return String(nome || '').trim().toLowerCase(); };

        bens.forEach(function (b) {
          var resp = b.responsavel;
          if (!resp || !resp.nome) return;
          var k = chave(resp.nome);
          if (!porNome[k]) porNome[k] = { dados: resp, criancas: [], id: null, ativo: true };
          porNome[k].criancas.push(b.nome);
        });
        cadastrados.forEach(function (c) {
          var k = chave(c.nome);
          if (!porNome[k]) porNome[k] = { criancas: [] };
          porNome[k].dados = c;
          porNome[k].id = c.id;
          porNome[k].ativo = c.ativo;
        });

        var lista = Object.keys(porNome).map(function (k) { return porNome[k]; })
          .sort(function (a, b) {
            return String(a.dados.nome).localeCompare(String(b.dados.nome), 'pt-BR');
          });

        preencher(lista.map(function (x) {
          var d = x.dados;
          var nome = esc(d.nome) + (x.ativo === false ? ' ' + etiqueta('INATIVO') : '');
          /* A ficha inteira, como foi preenchida no formulário. Na tabela só
             cabem cinco colunas, e CPF, e-mail e observação ficavam de fora:
             eram guardados e nunca mais apareciam para quem precisava ligar
             para a família. */
          var dados = {
            titulo: d.nome || 'Responsável',
            detalhes: [
              /* Sem repetir o nome: ele já é o título do modal. */
              ['CPF', cpf(d.cpf)],
              ['Parentesco', d.parentesco],
              ['Telefone', d.telefone],
              ['E-mail', d.email],
              ['CEP', d.cep],
              ['Endereço', endereco(d)],
              ['Crianças', x.criancas.join(', ')],
              ['Situação', x.ativo === false ? 'Inativo' : 'Ativo'],
              ['Origem', x.id ? 'Cadastrado no painel' : 'Veio de uma solicitação aprovada'],
              ['Observação', d.observacao]
            ].filter(function (par) { return par[1] && par[1] !== '—'; })
          };

          /* Só quem está na coleção própria tem id, e só esses têm o que
             encerrar ou apagar aqui. Quem veio de uma solicitação mora dentro
             da criança: sai junto com ela, na tela de Crianças. */
          var botoes = [botaoAnalise('Ver', dados)];
          if (x.id && x.ativo !== false) {
            botoes.push(botaoAcao('Encerrar', 'encerrar', '/adm/responsaveis/' + x.id,
              'Encerrar o cadastro de ' + d.nome + '?',
              ' data-metodo="DELETE" data-aviso="Ele sai da lista ativa e continua guardado, ' +
              'com o telefone e o endereço."'));
          }
          if (x.id) {
            botoes.push(botaoAcao('Excluir', 'excluir', '/adm/responsaveis/' + x.id + '/permanente',
              'Apagar o cadastro de ' + d.nome + ' para sempre?',
              ' data-metodo="DELETE" data-aviso="O cadastro some da ONG e não dá para desfazer. ' +
              'Para só tirá-lo da lista ativa, feche aqui e use Encerrar."'));
          } else {
            botoes.push('<span class="apoio">veio de solicitação</span>');
          }

          return linha([nome, esc(d.parentesco || '—'), esc(d.telefone || '—'),
            esc(x.criancas.join(', ') || '—'), esc(endereco(d)), acoes(botoes)]);
        }), 6, 'Nenhum responsável ainda. Use o formulário acima ou aprove uma solicitação.');
      });
    },

    doacoes: function () {
      return Promise.all([api.request('/adm/doacoes'), api.request('/projetos')]).then(function (r) {
        var doas = r[0], projetos = r[1];
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
          doas.filter(function (d) { return String(d.status).toUpperCase() === 'PENDENTE'; }).length
        ]);
        var ordenadas = doas.slice().sort(function (a, b) { return new Date(b.data) - new Date(a.data); });
        encherFiltroMes(ordenadas);

        /* ---- Visão "Por doação": o extrato, uma linha por doação ---- */
        preencherSecao('lista-doacoes', ordenadas.map(function (d) {
          return linha([data(d.data), esc(d.doadorNome || d.doadorEmail || 'Anônimo'), moeda(d.valor),
            esc(origem(d.origem)), esc(nomeProjeto(d.projetoId)), etiqueta(d.status)]);
        }), 6, 'Ainda não há doações registradas.');

        /* ---- Visão "Por pessoa": as mesmas doações, agrupadas ----
           Era a tela de Doadores, que nunca teve fonte própria: o site não
           tem cadastro de doador, e a lista sempre saiu daqui. */
        var porPessoa = {};
        ordenadas.forEach(function (d) {
          var chave = d.doadorId || d.doadorEmail || d.doadorNome || 'anonimo';
          if (!porPessoa[chave]) {
            porPessoa[chave] = { nome: d.doadorNome || 'Anônimo', email: d.doadorEmail || '',
              confirmadas: 0, total: 0, doacoes: [] };
          }
          var p = porPessoa[chave];
          p.doacoes.push(d);
          if (d.status === 'CONFIRMADA') { p.confirmadas++; p.total += Number(d.valor || 0); }
        });
        var pessoas = Object.keys(porPessoa).map(function (k) { return porPessoa[k]; })
          .sort(function (a, b) { return b.total - a.total; });

        preencherSecao('lista-pessoas', pessoas.map(function (p) {
          /* O modal abre o extrato da pessoa: cada doação vira uma linha, com
             a data e a origem de um lado e o valor e a situação do outro. */
          var dados = {
            titulo: p.nome,
            detalhes: [['Contato', p.email || '—'],
              ['Doações confirmadas', String(p.confirmadas)],
              ['Total doado', moeda(p.total)]]
              .concat(p.doacoes.map(function (d) {
                return [data(d.data) + ' · ' + origem(d.origem),
                  moeda(d.valor) + ' — ' + (NOME_SITUACAO[String(d.status).toUpperCase()] || d.status) +
                  ' · ' + nomeProjeto(d.projetoId)];
              }))
          };
          return linha([esc(p.nome), esc(p.email || '—'), String(p.confirmadas), moeda(p.total),
            etiqueta(p.confirmadas > 0 ? 'CONFIRMADA' : 'SEM_DOACAO'),
            acoes([botaoAnalise('Ver doações', dados)])]);
        }), 6, 'Ninguém doou ainda.');

        encherFiltrosAutomaticos();
        aplicarFiltros();

        /* O gráfico recebe todas, e não só as pagas: é ele que mostra a
           proporção entre o que entrou e o que ficou pelo caminho. */
        grafico(doas);
      });
    },

    atividades: function () {
      return api.request('/adm/atividades').then(function (lista) {
        preencher(lista.map(function (a) {
          /* A ficha da turma, com quem esta nela. Cada crianca traz o proprio
             botao de sair: quem organiza uma turma pensa pela turma, e nao
             abrindo a ficha de uma crianca por vez para desmarcar uma caixa. */
          var dados = {
            titulo: a.nome,
            detalhes: [
              ['Dias', dias(a.dias)],
              ['Horário', horario(a)],
              ['Onde', a.local],
              ['Vagas', a.vagas > 0 ? a.vagas + ' no total, ' +
                (a.vagasLivres === 0 ? 'turma cheia' : a.vagasLivres + ' livres') : 'sem limite'],
              ['Inscritas hoje', String(a.inscritos)],
              ['Situação', a.ativa ? 'Ativa' : 'Encerrada'],
              ['Observação', a.observacao]
            ].filter(function (par) { return par[1] && par[1] !== '—'; }),
            criancasDe: a.id
          };
          var botoes = [botaoAnalise('Ver', dados)];
          if (a.ativa) {
            botoes.push(botaoAcao('Encerrar', 'encerrar', '/adm/atividades/' + a.id,
              'Encerrar a atividade ' + a.nome + '?',
              ' data-metodo="DELETE" data-aviso="Ela para de aceitar inscrição nova e continua ' +
              'guardada, com as crianças que passaram por ela."'));
          }
          botoes.push(botaoAcao('Excluir', 'excluir', '/adm/atividades/' + a.id + '/permanente',
            'Apagar a atividade ' + a.nome + ' para sempre?',
            ' data-metodo="DELETE" data-aviso="A turma some da ONG e sai da ficha de cada criança ' +
            'inscrita nela. Não dá para desfazer."'));

          return linha([esc(a.nome), esc(dias(a.dias) || '—'), esc(horario(a) || '—'),
            esc(ocupacao(a)), etiqueta(a.ativa ? 'ATIVO' : 'INATIVO'), acoes(botoes)]);
        }), 6, 'Nenhuma atividade criada ainda. Use o formulário acima.');
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

  /* O limite acompanha o @Size de imagemUrl nos Request do backend. A foto
     não é arquivo: vira texto em base64 dentro do próprio registro, e base64
     engorda um terço. 10 MB de arquivo dão cerca de 14 milhões de caracteres,
     que é o teto lá. Mexer num sem mexer no outro faz a API recusar o envio
     com erro de validação. */
  var LIMITE_IMAGEM_MB = 10;
  function lerImagem(input) {
    var arquivo = input && input.files && input.files[0];
    if (!arquivo) return Promise.resolve(null);
    if (arquivo.size > LIMITE_IMAGEM_MB * 1024 * 1024) {
      return Promise.reject(new Error('A imagem precisa ter menos de ' + LIMITE_IMAGEM_MB + ' MB.'));
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
          /* Campo mascarado: "1.234,56" nao e Number(). */
          valor: window.FDA && FDA.valorEmNumero ? FDA.valorEmNumero(valor('doa-valor'))
            : Number(valor('doa-valor')),
          data: valor('doa-data'),
          projetoId: projetoEscolhido(destino),
          observacao: valor('doa-obs').slice(0, 140) || null
        } };
      }, { sucesso: 'Doação registrada.', recarregar: recarregar });
    }

    /* Criar turma. Os dias saem das caixas marcadas; vagas em branco vira 0,
       que o backend lê como "sem limite". */
    if (tela === 'atividades') {
      ligarForm($('form'), function () {
        return { rota: '/adm/atividades', corpo: {
          nome: valor('ati-nome'),
          dias: $$('input[name=ati-dia]:checked').map(function (c) { return c.value; }),
          horarioInicio: valor('ati-inicio') || null,
          horarioFim: valor('ati-fim') || null,
          local: valor('ati-local') || null,
          vagas: Number(valor('ati-vagas')) || 0,
          observacao: valor('ati-obs') || null,
          ativa: true
        } };
      }, { sucesso: 'Atividade criada.', recarregar: recarregar });
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

    if (tela === 'responsaveis') {
      ligarForm($('form'), function () {
        return { rota: '/adm/responsaveis', corpo: {
          nome: valor('res-nome'),
          cpf: valor('res-cpf') || null,
          email: valor('res-email') || null,
          telefone: valor('res-telefone'),
          parentesco: valor('res-parentesco') || null,
          cep: valor('res-cep') || null,
          endereco: valor('res-endereco') || null,
          numero: valor('res-numero') || null,
          complemento: valor('res-complemento') || null,
          bairro: valor('res-bairro') || null,
          cidade: valor('res-cidade') || null,
          uf: valor('res-uf') || null,
          observacao: valor('res-obs') || null
        } };
      }, { sucesso: 'Responsável cadastrado.', recarregar: recarregar });
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
  ligarAnalise(function () { return carregar[tela](); });
  ligarVisoes();
  ligarFiltros();
  ligarExportacao();
  contagensDoMenu();
  var recarregar = function () { return carregar[tela](); };
  ligarAcoes(recarregar);
  ligarAtividades(recarregar);
  formularios(recarregar);
  recarregar().catch(function (erro) {
    if (!api.token()) { location.replace('gestao.html'); return; }
    avisar(erro.message || 'Não foi possível carregar os dados do painel.', 'erro');
  });
})();
