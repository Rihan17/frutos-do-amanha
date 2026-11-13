/* ==========================================================
   Ligação com a API — formulários públicos e dados da ONG.
   Carregado depois de api.js, em todas as páginas do site novo.

   O paginas.js cuida dos formulários de maquete, que só validam e
   mostram uma confirmação. Os formulários marcados com data-api são
   deste arquivo: ele valida, envia à API e mostra a resposta real.
   ========================================================== */
(function () {
  'use strict';

  var api = window.OngApi;
  if (!api) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var suave = !(window.FDA && window.FDA.reduz);

  /* ---------- Aviso: reaproveita o bloco .aviso que já existe no HTML ---------- */
  function aviso(form, texto, tipo) {
    var caixa = $('[data-form-aviso]', form.parentNode) || $('[data-form-aviso]', form);
    if (!caixa) return;
    caixa.className = 'aviso aviso--' + (tipo || 'sucesso');
    caixa.hidden = false;
    var alvo = $('[data-form-aviso-texto]', caixa);
    if (alvo) alvo.textContent = texto;
    caixa.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'center' });
  }

  /* ---------- Botão ocupado enquanto a API responde ---------- */
  function ocupado(form, ligado, textoOcupado) {
    var botao = $('button[type="submit"]', form);
    if (!botao) return;
    var texto = $('.botao__texto', botao) || botao;
    if (ligado) {
      botao.setAttribute('data-texto-original', texto.textContent);
      texto.textContent = textoOcupado || 'Enviando…';
      botao.disabled = true;
    } else {
      var original = botao.getAttribute('data-texto-original');
      if (original) texto.textContent = original;
      botao.disabled = false;
    }
  }

  /* Valida pelo próprio HTML (required, type, minlength) antes de chamar a API. */
  function valido(form) {
    var invalido = $$('input, select, textarea', form).filter(function (c) {
      return !c.disabled && !c.checkValidity();
    })[0];
    if (!invalido) return true;
    invalido.focus();
    if (invalido.reportValidity) invalido.reportValidity();
    aviso(form, 'Confira os campos destacados antes de enviar.', 'erro');
    return false;
  }

  function ligar(seletor, enviar, textoOcupado) {
    var form = $(seletor);
    if (!form) return;
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valido(form)) return;
      ocupado(form, true, textoOcupado);
      Promise.resolve()
        .then(function () { return enviar(form); })
        .catch(function (erro) {
          aviso(form, (erro && erro.message) || 'Não foi possível concluir. Tente de novo.', 'erro');
        })
        .then(function () { ocupado(form, false); });
    });
  }

  function texto(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  /* ---------- Projetos: buscados uma vez e reaproveitados ---------- */
  var projetosPromessa = null;
  function projetos() {
    if (!projetosPromessa) {
      projetosPromessa = api.request('/projetos', { public: true }).catch(function () { return []; });
    }
    return projetosPromessa;
  }

  /* Troca as opções escritas à mão pelos projetos reais, guardando o id no value.
     Só depois disso o select ganha data-projetos-ok: sem essa marca, o value é
     o nome do projeto escrito no HTML, e mandá-lo como projetoId seria um id
     inválido. Sem API, a doação vai para "onde for mais necessário". */
  function encherComProjetos(select) {
    if (!select) return;
    projetos().then(function (lista) {
      if (!lista || !lista.length) return;
      var vazia = select.querySelector('option[value=""]');
      var rotuloVazio = vazia ? vazia.textContent : 'Onde for mais necessário';
      select.innerHTML = '';
      var primeira = document.createElement('option');
      primeira.value = '';
      primeira.textContent = rotuloVazio;
      select.appendChild(primeira);
      lista.forEach(function (p) {
        var o = document.createElement('option');
        o.value = p.id;
        o.textContent = p.nome;
        select.appendChild(o);
      });
      select.setAttribute('data-projetos-ok', '');
    });
  }

  function projetoEscolhido(select) {
    if (!select || !select.hasAttribute('data-projetos-ok')) return null;
    return select.value || null;
  }

  /* ==========================================================
     Doação pública
     ========================================================== */
  function doacao() {
    var form = $('[data-api="doacao"]');
    if (!form) return;

    var destino = document.getElementById('destino');
    encherComProjetos(destino);

    /* Mostrar o campo "outro valor" e manter o resumo em dia já é trabalho do
       paginas.js, que faz isso em qualquer tela de doação. Aqui só se lê. */
    function escolhido() {
      var marcado = form.querySelector('input[name="valor"]:checked');
      if (!marcado) return 0;
      if (marcado.value !== 'outro') return parseFloat(marcado.value) || 0;
      return parseFloat(texto('valor-outro')) || 0;
    }
    function mensal() {
      var m = form.querySelector('input[name="frequencia"]:checked');
      return !!m && m.value === 'mensal';
    }

    ligar('[data-api="doacao"]', function () {
      var valor = escolhido();
      if (valor < 5) {
        aviso(form, 'O valor mínimo da doação é R$ 5,00.', 'erro');
        return;
      }
      /* A doação mensal depende de uma conta de doador, e o site não tem mais
         cadastro. Até existir outro caminho, a cobrança recorrente é combinada
         direto com a ONG. */
      if (mensal()) {
        aviso(form, 'A doação mensal é combinada direto com a ONG pelo WhatsApp (13) 98858-5602. ' +
          'Para doar agora, escolha "Uma vez" ou use a chave Pix em Como ajudar.', 'erro');
        return;
      }
      return api.request('/doacoes/publico', {
        method: 'POST',
        public: true,
        body: {
          projetoId: projetoEscolhido(destino),
          valor: valor,
          nome: texto('doador-nome'),
          email: texto('doador-email')
        }
      }).then(function (resposta) {
        if (!resposta || !resposta.checkoutUrl) {
          throw new Error('O Mercado Pago não devolveu o endereço de pagamento. Tente de novo em instantes.');
        }
        aviso(form, 'Doação registrada. Levando você ao pagamento…');
        location.assign(resposta.checkoutUrl);
      });
    }, 'Abrindo o pagamento…');
  }

  /* ==========================================================
     Candidatura de voluntário
     ========================================================== */
  function voluntariado() {
    ligar('[data-api="voluntariado"]', function (form) {
      /* A API guarda um projeto, e o formulário pergunta por área de atuação,
         que é mais ampla. Área e disponibilidade vão na observação, que é o
         campo livre que a equipe lê no painel. */
      var area = texto('vol-area');
      var quando = texto('vol-disponibilidade');
      var observacao = ['Área: ' + (area || 'não informada'), 'Disponibilidade: ' + (quando || 'não informada')].join('. ');
      return api.request('/voluntarios/publico', {
        method: 'POST',
        public: true,
        body: {
          projetoId: null,
          nome: texto('vol-nome'),
          email: texto('vol-email'),
          telefone: texto('vol-telefone'),
          observacao: observacao.slice(0, 1000)
        }
      }).then(function () {
        form.reset();
        aviso(form, 'Candidatura enviada. A equipe entra em contato pelo telefone ou e-mail que você informou.');
      });
    }, 'Enviando candidatura…');
  }

  /* ==========================================================
     Solicitação de vaga
     ========================================================== */
  function solicitacao() {
    ligar('[data-api="solicitacao"]', function (form) {
      var nome = texto('resp-nome');
      var telefone = texto('resp-telefone');
      var marcados = $$('input[type="checkbox"]', form);
      var aceitou = marcados.length > 0 && marcados.every(function (c) { return c.checked; });
      return api.request('/solicitacoes', {
        method: 'POST',
        public: true,
        body: {
          motivo: texto('motivo'),
          solicitante: { nome: nome, telefone: telefone },
          /* O formulário não pergunta o gênero da criança e a API exige o campo;
             vai "Não informado", como no site anterior. */
          beneficiario: {
            nome: texto('crianca-nome'),
            dataNascimento: texto('crianca-nascimento'),
            genero: 'Não informado'
          },
          responsavel: {
            nome: nome,
            email: texto('resp-email') || null,
            telefone: telefone,
            parentesco: texto('resp-parentesco')
          },
          consentimento: { aceito: aceitou }
        }
      }).then(function (resposta) {
        form.reset();
        var protocolo = resposta && resposta.id ? ' Protocolo: ' + resposta.id + '.' : '';
        aviso(form, 'Pedido enviado.' + protocolo + ' A equipe entra em contato pelo telefone informado.');
      });
    }, 'Enviando pedido…');
  }

  /* ==========================================================
     Redefinir senha (link do e-mail: redefinir-senha.html?token=...)
     ========================================================== */
  function redefinirSenha() {
    var form = $('[data-api="redefinir-senha"]');
    if (!form) return;
    var token = new URLSearchParams(location.search).get('token') || '';

    /* Sem token o link não vale: o paginas.js já sabe mostrar o estado
       "expirado" desta tela, então é só pedir esse estado. */
    if (!token) {
      var expirado = $('[data-estado="expirado"]');
      var formulario = $('[data-estado="formulario"]');
      if (expirado && formulario) {
        formulario.classList.remove('ativo');
        expirado.classList.add('ativo');
      }
      return;
    }

    ligar('[data-api="redefinir-senha"]', function (f) {
      var senha = texto('senha');
      if (senha !== texto('senha2')) {
        aviso(f, 'As duas senhas precisam ser iguais.', 'erro');
        return;
      }
      return api.request('/auth/redefinir-senha', {
        method: 'POST',
        public: true,
        body: { token: token, senha: senha }
      }).then(function (resposta) {
        f.reset();
        aviso(f, (resposta && resposta.mensagem) || 'Senha redefinida. Entre de novo pelo painel.');
      });
    }, 'Salvando…');
  }

  /* ==========================================================
     Dados públicos da ONG: chave Pix e QR code de verdade
     ========================================================== */
  function dadosDaOng() {
    var chaves = $$('[data-chave-pix]');
    var qrs = $$('.pix__qr img');
    if (!chaves.length && !qrs.length) return;
    api.request('/publico/ong', { public: true }).then(function (ong) {
      if (!ong || !ong.chavePix) return;
      chaves.forEach(function (el) { el.textContent = ong.chavePix; });
      qrs.forEach(function (img) {
        img.src = api.endpoint('/publico/ong/pix-qrcode');
        img.alt = 'QR code da chave Pix da ONG Frutos do Amanhã';
      });
    }).catch(function () {
      /* Sem API, ficam a chave e o QR de exemplo que estão no HTML. */
    });
  }

  doacao();
  voluntariado();
  solicitacao();
  redefinirSenha();
  dadosDaOng();
})();
