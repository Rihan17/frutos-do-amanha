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
    ENCERRADA: 'espera', ESTORNADA: 'espera', PAUSADO: 'espera'
  };
  var NOME_SITUACAO = {
    PENDENTE: 'Em análise', APROVADA: 'Aprovada', RECUSADA: 'Recusada',
    ENCERRADA: 'Encerrada', CONFIRMADA: 'Confirmada', FALHOU: 'Falhou',
    ESTORNADA: 'Estornada', ATIVO: 'Ativo', INATIVO: 'Inativo',
    PAUSADO: 'Pausado', CANCELADO: 'Cancelado'
  };
  function etiqueta(status) {
    var s = String(status || '').toUpperCase();
    var texto = NOME_SITUACAO[s] || (s ? s.charAt(0) + s.slice(1).toLowerCase() : '—');
    return '<span class="etiqueta etiqueta--' + (TOM[s] || 'espera') + '">' + esc(texto) + '</span>';
  }

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
      tbody.innerHTML = '<tr><td colspan="' + colunas + '">' + esc(vazio) + '</td></tr>';
      return;
    }
    tbody.innerHTML = linhas.join('');
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
        var motivo = window.prompt('Motivo da recusa (a família recebe este texto):', '');
        if (motivo === null) return;
        corpo = { justificativa: motivo };
      }
      botao.textContent = 'Enviando…';
      api.request(rota, { method: 'PUT', body: corpo })
        .then(function () { avisar('Pronto. A lista foi atualizada.'); return recarregar(); })
        .catch(function (erro) { avisar(erro.message || 'Não foi possível concluir.', 'erro'); });
    });
  }
  function acoes(itens) {
    return '<span class="acoes">' + itens.join('') + '</span>';
  }
  function botaoAcao(rotulo, acao, rota, pergunta) {
    return '<a class="link" href="#" data-acao="' + acao + '" data-rota="' + esc(rota) +
      '" data-pergunta="' + esc(pergunta) + '">' + esc(rotulo) + '</a>';
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
            esc(d.origem || '—'), etiqueta(d.status)]);
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
          if (!porPessoa[chave]) porPessoa[chave] = { nome: d.doadorNome || 'Anônimo', email: d.doadorEmail || '', n: 0, total: 0, ultima: null };
          var p = porPessoa[chave];
          p.n++;
          if (d.status === 'CONFIRMADA') p.total += Number(d.valor || 0);
          if (!p.ultima || new Date(d.data) > new Date(p.ultima)) p.ultima = d.data;
        });
        var lista = Object.keys(porPessoa).map(function (k) { return porPessoa[k]; })
          .sort(function (a, b) { return b.total - a.total; });
        placares([
          lista.length,
          lista.filter(function (p) { return p.n > 1; }).length,
          doas.length,
          moeda(lista.reduce(function (s, p) { return s + p.total; }, 0))
        ]);
        preencher(lista.map(function (p) {
          return linha([esc(p.nome), esc(p.email || '—'), String(p.n), moeda(p.total),
            etiqueta(p.n > 1 ? 'ATIVO' : 'PENDENTE')]);
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
        preencher(ordenadas.map(function (d) {
          return linha([data(d.data), esc(d.doadorNome || d.doadorEmail || 'Anônimo'), moeda(d.valor),
            esc(d.origem || '—'), esc(nomeProjeto(d.projetoId)), etiqueta(d.status)]);
        }), 6, 'Ainda não há doações registradas.');
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
              : botaoAcao('Promover', 'promover', '/adm/usuarios/' + u.id + '/promover', 'Dar acesso de administrador a ' + u.nome + '?'));
          return linha([esc(u.nome), esc(u.email), esc(u.cargo || '—'),
            esc(u.tipo === 'ADMIN' ? 'Administrador' : 'Comum'), data(u.dataCadastro),
            etiqueta(u.ativo ? 'ATIVO' : 'INATIVO'), acoes([acao])]);
        }), 7, 'Nenhum acesso cadastrado.');
      });
    },

    noticias: function () {
      /* As notícias são páginas HTML do próprio site, não há coleção no banco.
         A tela fica informando isso em vez de fingir uma lista. */
      preencher([], 4, 'As notícias são páginas do site, editadas no código. Não há cadastro na API.');
      return Promise.resolve();
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
      if (botao) { botao.disabled = true; texto.textContent = 'Salvando…'; }
      Promise.resolve().then(montar).then(function (envio) {
        return api.request(envio.rota, { method: 'POST', body: envio.corpo });
      }).then(function () {
        form.reset();
        avisoDoForm(form, depois.sucesso);
        return depois.recarregar && depois.recarregar();
      }).catch(function (erro) {
        avisoDoForm(form, (erro && erro.message) || 'Não foi possível salvar.', 'erro');
      }).then(function () {
        if (botao) { botao.disabled = false; texto.textContent = original; }
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

  /* ---------- Início ---------- */
  if (tela === 'login') { login(); return; }

  if (!carregar[tela]) return;

  if (!api.token()) { location.replace('gestao.html'); return; }

  montarSaida();
  var recarregar = function () { return carregar[tela](); };
  ligarAcoes(recarregar);
  formularios(recarregar);
  recarregar().catch(function (erro) {
    if (!api.token()) { location.replace('gestao.html'); return; }
    avisar(erro.message || 'Não foi possível carregar os dados do painel.', 'erro');
  });
})();
