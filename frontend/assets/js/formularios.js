/* ONG Frutos do Amanhã — validação dos formulários do site.
   Validação no cliente é só conveniência: o back-end precisa validar de novo. */
(function () {
  "use strict";

  /* ---------- utilitários ---------- */

  function soNumeros(valor) {
    return valor.replace(/\D/g, "");
  }

  function mascaraTelefone(valor) {
    var n = soNumeros(valor).slice(0, 11);
    if (n.length <= 2) return n.length ? "(" + n : "";
    if (n.length <= 6) return "(" + n.slice(0, 2) + ") " + n.slice(2);
    if (n.length <= 10) return "(" + n.slice(0, 2) + ") " + n.slice(2, 6) + "-" + n.slice(6);
    return "(" + n.slice(0, 2) + ") " + n.slice(2, 7) + "-" + n.slice(7);
  }

  function mascaraCpf(valor) {
    var n = soNumeros(valor).slice(0, 11);
    if (n.length <= 3) return n;
    if (n.length <= 6) return n.slice(0, 3) + "." + n.slice(3);
    if (n.length <= 9) return n.slice(0, 3) + "." + n.slice(3, 6) + "." + n.slice(6);
    return n.slice(0, 3) + "." + n.slice(3, 6) + "." + n.slice(6, 9) + "-" + n.slice(9);
  }

  /* Confere os dois dígitos verificadores do CPF. */
  function cpfValido(valor) {
    var n = soNumeros(valor);
    if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
    var i, soma, resto;
    for (var rodada = 0; rodada < 2; rodada++) {
      soma = 0;
      var peso = 10 + rodada;
      var limite = 9 + rodada;
      for (i = 0; i < limite; i++) soma += parseInt(n[i], 10) * (peso - i);
      resto = (soma * 10) % 11;
      if (resto === 10) resto = 0;
      if (resto !== parseInt(n[limite], 10)) return false;
    }
    return true;
  }

  function emailValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(valor.trim());
  }

  function aplicarMascara(campo, fn) {
    if (!campo) return;
    campo.addEventListener("input", function () {
      var pos = campo.value.length - campo.selectionStart;
      campo.value = fn(campo.value);
      campo.selectionStart = campo.selectionEnd = Math.max(0, campo.value.length - pos);
    });
  }

  function mostrarErro(campo, mensagem) {
    var alvo = document.getElementById("erro-" + campo.id);
    if (alvo) alvo.textContent = mensagem;
    campo.setAttribute("aria-invalid", "true");
    campo.classList.add("tem-erro");
  }

  function limparErro(campo) {
    var alvo = document.getElementById("erro-" + campo.id);
    if (alvo) alvo.textContent = "";
    campo.removeAttribute("aria-invalid");
    campo.classList.remove("tem-erro");
  }

  /* ---------- mostrar/ocultar senha ---------- */

  Array.prototype.forEach.call(document.querySelectorAll(".ver-senha"), function (botao) {
    botao.addEventListener("click", function () {
      var campo = document.getElementById(botao.dataset.alvo);
      if (!campo) return;
      var visivel = campo.type === "text";
      campo.type = visivel ? "password" : "text";
      botao.textContent = visivel ? "Mostrar" : "Ocultar";
      botao.setAttribute("aria-pressed", String(!visivel));
    });
  });

  /* Mostra um dos blocos .estado conforme ?estado= na URL.
     No site com back-end, quem decide o estado é o servidor, pelo token do link. */
  function aplicarEstado(mapa, padrao) {
    var pedido = new URLSearchParams(location.search).get("estado");
    var id = mapa[pedido] || padrao;
    Object.keys(mapa).forEach(function (chave) {
      var bloco = document.getElementById(mapa[chave]);
      if (bloco) bloco.hidden = mapa[chave] !== id;
    });
    var blocoPadrao = document.getElementById(padrao);
    if (blocoPadrao) blocoPadrao.hidden = padrao !== id;
  }

  /* ---------- painel: CMS ---------- */

  /* Abre e fecha um editor a partir do botão do cabeçalho. */
  function ligarEditor(idBotao, idBloco, idPrimeiro, idCancelar) {
    var botao = document.getElementById(idBotao);
    var bloco = document.getElementById(idBloco);
    if (!botao || !bloco) return;

    function alternar(abrir) {
      bloco.hidden = !abrir;
      botao.setAttribute("aria-expanded", String(abrir));
      if (abrir) {
        var primeiro = document.getElementById(idPrimeiro);
        if (primeiro) primeiro.focus();
      } else { botao.focus(); }
    }
    botao.addEventListener("click", function () { alternar(bloco.hidden); });
    var cancelar = document.getElementById(idCancelar);
    if (cancelar) cancelar.addEventListener("click", function () { alternar(false); });
    return alternar;
  }

  var abrirEditorNoticia = ligarEditor("abrir-noticia", "form-noticia", "n-titulo", "cancelar-noticia");
  ligarEditor("abrir-projeto", "form-projeto", "p-titulo", "cancelar-projeto");

  /* Transforma o título em endereço de página: sem acento, em minúsculas e com hífens. */
  function paraEndereco(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  }

  var formEditorNoticia = document.getElementById("form-editor-noticia");
  if (formEditorNoticia) {
    var nTitulo = document.getElementById("n-titulo");
    var nEndereco = document.getElementById("n-endereco");
    var nData = document.getElementById("n-data");
    var nResumo = document.getElementById("n-resumo");
    var nTexto = document.getElementById("n-texto");
    var contaResumo = document.getElementById("conta-resumo");
    var statusNoticia = document.getElementById("status-noticia");

    nTitulo.addEventListener("input", function () {
      var pedaco = paraEndereco(nTitulo.value);
      nEndereco.value = pedaco ? "noticia-" + pedaco + ".html" : "noticia-...";
      if (nTitulo.classList.contains("tem-erro")) limparErro(nTitulo);
    });

    nResumo.addEventListener("input", function () {
      if (contaResumo) contaResumo.textContent = nResumo.value.length + " de 240 caracteres";
      if (nResumo.classList.contains("tem-erro")) limparErro(nResumo);
    });

    function validarNoticia() {
      var erro = null;
      if (!nTitulo.value.trim()) { mostrarErro(nTitulo, "Escreva o título."); erro = nTitulo; }
      else { limparErro(nTitulo); }

      if (!nData.value) {
        mostrarErro(nData, "Informe a data.");
        if (!erro) erro = nData;
      } else { limparErro(nData); }

      if (!nResumo.value.trim()) {
        mostrarErro(nResumo, "Escreva um resumo curto.");
        if (!erro) erro = nResumo;
      } else { limparErro(nResumo); }

      if (!nTexto.value.trim()) {
        mostrarErro(nTexto, "Escreva o texto da notícia.");
        if (!erro) erro = nTexto;
      } else { limparErro(nTexto); }

      if (erro) { erro.focus(); return false; }
      return true;
    }

    function avisoNoticia(mensagem) {
      if (!statusNoticia) return;
      statusNoticia.textContent = mensagem;
      statusNoticia.className = "form-status form-status-aviso";
    }

    formEditorNoticia.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validarNoticia()) return;
      avisoNoticia("Notícia válida. A publicação ainda não está conectada ao servidor, " +
        "então nada foi publicado no site.");
    });

    var salvarRascunho = document.getElementById("salvar-rascunho");
    if (salvarRascunho) {
      salvarRascunho.addEventListener("click", function () {
        /* Rascunho exige só o título: a ideia é poder parar no meio e voltar depois. */
        if (!nTitulo.value.trim()) {
          mostrarErro(nTitulo, "Escreva ao menos o título para salvar o rascunho.");
          nTitulo.focus();
          return;
        }
        limparErro(nTitulo);
        avisoNoticia("Rascunho válido. A gravação ainda não está conectada ao servidor.");
      });
    }
  }

  var formEditorProjeto = document.getElementById("form-editor-projeto");
  if (formEditorProjeto) {
    var pTitulo = document.getElementById("p-titulo");
    var pResumo = document.getElementById("p-resumo");
    var pDescricao = document.getElementById("p-descricao");
    var statusProjeto = document.getElementById("status-projeto");

    formEditorProjeto.addEventListener("submit", function (e) {
      e.preventDefault();
      var erro = null;

      [[pTitulo, "Escreva o nome do projeto."],
       [pResumo, "Escreva um resumo curto."],
       [pDescricao, "Explique como o projeto funciona."]].forEach(function (par) {
        if (!par[0].value.trim()) {
          mostrarErro(par[0], par[1]);
          if (!erro) erro = par[0];
        } else { limparErro(par[0]); }
      });

      if (erro) { erro.focus(); return; }

      if (statusProjeto) {
        statusProjeto.textContent = "Projeto válido. A gravação ainda não está conectada ao servidor.";
        statusProjeto.className = "form-status form-status-aviso";
      }
    });

    [pTitulo, pResumo, pDescricao].forEach(function (campo) {
      campo.addEventListener("input", function () {
        if (campo.classList.contains("tem-erro")) limparErro(campo);
      });
    });
  }

  /* Ações das listas do CMS */
  function ligarAcoes(seletor, idStatus, mensagem, confirmar) {
    Array.prototype.forEach.call(document.querySelectorAll(seletor), function (botao) {
      botao.addEventListener("click", function () {
        if (confirmar && !window.confirm(confirmar)) return;
        var alvo = document.getElementById(idStatus);
        if (!alvo) return;
        alvo.textContent = mensagem;
        alvo.className = "form-status form-status-aviso";
      });
    });
  }

  if (document.getElementById("tabela-noticias")) {
    Array.prototype.forEach.call(document.querySelectorAll(".editar-noticia"), function (botao) {
      botao.addEventListener("click", function () {
        var titulo = document.getElementById("titulo-editor");
        if (titulo) titulo.textContent = "Editar notícia";
        if (abrirEditorNoticia) abrirEditorNoticia(true);
        var alvo = document.getElementById("status-noticia");
        if (alvo) {
          alvo.textContent = "A leitura da notícia salva ainda não está conectada ao servidor, " +
            "então o editor abriu em branco.";
          alvo.className = "form-status form-status-aviso";
        }
      });
    });
    ligarAcoes(".despublicar-noticia", "status-lista-noticia",
      "A despublicação ainda não está conectada ao servidor.",
      "Tirar esta notícia do site? Ela volta para rascunho e pode ser publicada de novo.");
    ligarAcoes(".excluir-noticia", "status-lista-noticia",
      "A exclusão ainda não está conectada ao servidor.",
      "Excluir este rascunho? Essa ação não pode ser desfeita.");
  }

  if (document.getElementById("tabela-projetos")) {
    ligarAcoes(".editar-projeto", "status-lista-projeto",
      "A edição ainda não está conectada ao servidor.");
    ligarAcoes(".ocultar-projeto", "status-lista-projeto",
      "A alteração ainda não está conectada ao servidor.",
      "Ocultar este projeto? Ele sai do site, mas o conteúdo é mantido.");
    ligarAcoes(".mostrar-projeto", "status-lista-projeto",
      "A alteração ainda não está conectada ao servidor.");
  }

  /* ---------- painel: administradores ---------- */

  var abrirAdmin = document.getElementById("abrir-admin");
  var blocoAdmin = document.getElementById("form-admin");
  if (abrirAdmin && blocoAdmin) {
    function alternarAdmin(abrir) {
      blocoAdmin.hidden = !abrir;
      abrirAdmin.setAttribute("aria-expanded", String(abrir));
      if (abrir) {
        var primeiro = document.getElementById("a-nome");
        if (primeiro) primeiro.focus();
      } else { abrirAdmin.focus(); }
    }
    abrirAdmin.addEventListener("click", function () { alternarAdmin(blocoAdmin.hidden); });
    var cancelarAdmin = document.getElementById("cancelar-admin");
    if (cancelarAdmin) cancelarAdmin.addEventListener("click", function () { alternarAdmin(false); });
  }

  var tabelaAdmins = document.getElementById("tabela-admins");
  if (tabelaAdmins) {
    var statusListaAdmin = document.getElementById("status-lista-admin");

    function avisoAdmin(mensagem) {
      if (!statusListaAdmin) return;
      statusListaAdmin.textContent = mensagem;
      statusListaAdmin.className = "form-status form-status-aviso";
    }

    Array.prototype.forEach.call(tabelaAdmins.querySelectorAll(".desativar-admin"), function (botao) {
      botao.addEventListener("click", function () {
        var linha = botao.closest("tr");
        var nome = linha ? linha.querySelector("th").textContent.trim() : "esta pessoa";
        if (!window.confirm("Desativar o acesso de " + nome + "? Ela não conseguirá mais entrar no painel.")) return;
        avisoAdmin("A desativação ainda não está conectada ao servidor.");
      });
    });

    Array.prototype.forEach.call(tabelaAdmins.querySelectorAll(".reenviar-convite"), function (botao) {
      botao.addEventListener("click", function () {
        avisoAdmin("O reenvio de convite ainda não está conectado ao servidor.");
      });
    });
  }

  /* ---------- painel: voluntários ---------- */

  var tabelaVol = document.getElementById("tabela-voluntarios");
  if (tabelaVol) {
    var linhasVol = Array.prototype.slice.call(tabelaVol.querySelectorAll("tbody tr"));
    var vazioVol = document.getElementById("vol-vazio");
    var contagemVol = document.getElementById("contagem-vol");
    var buscaVol = document.getElementById("busca-vol");
    var painelVol = document.getElementById("detalhe-voluntario");
    var acoesVol = document.getElementById("acoes-vol");
    var campoVol = document.getElementById("campo-vol");

    function filtrarVol() {
      var marcado = document.querySelector('input[name="filtro-vol"]:checked');
      var situacao = marcado ? marcado.value : "pendente";
      var termo = (buscaVol ? buscaVol.value : "").trim().toLowerCase();
      var visiveis = 0;

      linhasVol.forEach(function (linha) {
        var casa = situacao === "todas" || linha.dataset.situacao === situacao;
        var casaBusca = !termo || (linha.dataset.busca || "").indexOf(termo) !== -1;
        var mostra = casa && casaBusca;
        linha.hidden = !mostra;
        if (mostra) visiveis++;
      });

      if (vazioVol) vazioVol.hidden = visiveis > 0;
      if (contagemVol) {
        contagemVol.textContent = visiveis + (visiveis === 1 ? " candidatura" : " candidaturas");
      }
    }

    Array.prototype.forEach.call(document.querySelectorAll('input[name="filtro-vol"]'), function (opcao) {
      opcao.addEventListener("change", filtrarVol);
    });
    if (buscaVol) buscaVol.addEventListener("input", filtrarVol);
    filtrarVol();

    var mapaVol = {
      "v-enviada": "enviada", "v-contato": "contato", "v-areas": "areas",
      "v-disponibilidade": "disponibilidade", "v-doacoes": "doacoes",
      "v-estado": "estado", "v-mensagem": "mensagem"
    };

    Array.prototype.forEach.call(tabelaVol.querySelectorAll(".ver-voluntario"), function (botao) {
      botao.addEventListener("click", function () {
        var linha = botao.closest("tr");
        Object.keys(mapaVol).forEach(function (id) {
          var alvo = document.getElementById(id);
          if (alvo) alvo.textContent = linha.dataset[mapaVol[id]] || "—";
        });
        var titulo = document.getElementById("vol-titulo");
        if (titulo) titulo.textContent = linha.dataset.nome || "Candidatura";

        var pendente = linha.dataset.situacao === "pendente";
        if (acoesVol) acoesVol.hidden = !pendente;
        if (campoVol) campoVol.hidden = !pendente;

        var statusVolDet = document.getElementById("status-vol");
        if (statusVolDet) statusVolDet.textContent = "";
        painelVol.hidden = false;
        painelVol.focus();
      });
    });

    var fecharVol = document.getElementById("fechar-vol");
    if (fecharVol) fecharVol.addEventListener("click", function () { painelVol.hidden = true; });

    function avisoVol(mensagem) {
      var alvo = document.getElementById("status-vol");
      if (!alvo) return;
      alvo.textContent = mensagem;
      alvo.className = "form-status form-status-aviso";
    }

    var aprovarVol = document.getElementById("aprovar-vol");
    if (aprovarVol) {
      aprovarVol.addEventListener("click", function () {
        if (!window.confirm("Aprovar esta candidatura? A pessoa entra na lista de voluntários ativos.")) return;
        avisoVol("A aprovação ainda não está conectada ao servidor.");
      });
    }

    var recusarVol = document.getElementById("recusar-vol");
    if (recusarVol) {
      recusarVol.addEventListener("click", function () {
        var obs = document.getElementById("obs-vol");
        if (obs && !obs.value.trim()) {
          obs.focus();
          avisoVol("Escreva uma observação explicando o motivo antes de recusar.");
          return;
        }
        if (!window.confirm("Recusar esta candidatura?")) return;
        avisoVol("A recusa ainda não está conectada ao servidor.");
      });
    }
  }

  /* ---------- painel: responsáveis ---------- */

  var abrirResp = document.getElementById("abrir-responsavel");
  var blocoResp = document.getElementById("form-responsavel");
  if (abrirResp && blocoResp) {
    function alternarResp(abrir) {
      blocoResp.hidden = !abrir;
      abrirResp.setAttribute("aria-expanded", String(abrir));
      if (abrir) {
        var primeiro = document.getElementById("r-nome");
        if (primeiro) primeiro.focus();
      } else { abrirResp.focus(); }
    }
    abrirResp.addEventListener("click", function () { alternarResp(blocoResp.hidden); });
    var cancelarResp = document.getElementById("cancelar-responsavel");
    if (cancelarResp) cancelarResp.addEventListener("click", function () { alternarResp(false); });
  }

  var formNovoResp = document.getElementById("form-novo-responsavel");
  if (formNovoResp) {
    var rNome = document.getElementById("r-nome");
    var rCpf = document.getElementById("r-cpf");
    var rTel = document.getElementById("r-telefone");
    var rEmail = document.getElementById("r-email");
    var rParentesco = document.getElementById("r-parentesco");
    var rEndereco = document.getElementById("r-endereco");
    var statusResp = document.getElementById("status-responsavel");

    aplicarMascara(rCpf, mascaraCpf);
    aplicarMascara(rTel, mascaraTelefone);

    var regrasResp = [
      [rNome, function (v) {
        if (!v.trim()) return "Informe o nome.";
        if (v.trim().split(/\s+/).length < 2) return "Informe o nome e o sobrenome.";
        return "";
      }],
      [rCpf, function (v) {
        if (!soNumeros(v)) return "Informe o CPF.";
        if (!cpfValido(v)) return "Esse CPF não é válido.";
        return "";
      }],
      [rTel, function (v) {
        var n = soNumeros(v);
        if (!n) return "Informe o telefone.";
        if (n.length < 10) return "O telefone precisa ter DDD e número.";
        return "";
      }],
      [rEmail, function (v) {
        if (!v.trim()) return "";
        return emailValido(v) ? "" : "Esse e-mail não parece válido.";
      }],
      [rParentesco, function (v) { return v ? "" : "Informe o parentesco."; }],
      [rEndereco, function (v) { return v.trim() ? "" : "Informe o endereço."; }]
    ];

    formNovoResp.addEventListener("submit", function (e) {
      e.preventDefault();
      var primeiro = null;
      regrasResp.forEach(function (par) {
        var campo = par[0], teste = par[1];
        var mensagem = teste(campo.value, campo);
        if (mensagem) { mostrarErro(campo, mensagem); if (!primeiro) primeiro = campo; }
        else { limparErro(campo); }
      });

      if (primeiro) { primeiro.focus(); return; }

      if (statusResp) {
        statusResp.textContent = "Dados válidos. A gravação ainda não está conectada ao servidor, " +
          "então o cadastro não foi salvo.";
        statusResp.className = "form-status form-status-aviso";
      }
    });

    regrasResp.forEach(function (par) {
      par[0].addEventListener("input", function () {
        if (par[0].classList.contains("tem-erro")) limparErro(par[0]);
      });
    });
  }

  var tabelaResp = document.getElementById("tabela-responsaveis");
  if (tabelaResp) {
    var linhasResp = Array.prototype.slice.call(tabelaResp.querySelectorAll("tbody tr"));
    var vazioResp = document.getElementById("resp-vazio");
    var contagemResp = document.getElementById("contagem-resp");
    var buscaResp = document.getElementById("busca-resp");
    var painelResp = document.getElementById("detalhe-resp");

    function filtrarResp() {
      var marcado = document.querySelector('input[name="filtro-resp"]:checked');
      var grupo = marcado ? marcado.value : "todos";
      var termo = (buscaResp ? buscaResp.value : "").trim().toLowerCase();
      var visiveis = 0;

      linhasResp.forEach(function (linha) {
        var grupos = (linha.dataset.grupo || "").split(" ");
        var casa = grupo === "todos" || grupos.indexOf(grupo) !== -1;
        var casaBusca = !termo || (linha.dataset.busca || "").indexOf(termo) !== -1;
        var mostra = casa && casaBusca;
        linha.hidden = !mostra;
        if (mostra) visiveis++;
      });

      if (vazioResp) vazioResp.hidden = visiveis > 0;
      if (contagemResp) {
        contagemResp.textContent = visiveis + (visiveis === 1 ? " responsável" : " responsáveis");
      }
    }

    Array.prototype.forEach.call(document.querySelectorAll('input[name="filtro-resp"]'), function (opcao) {
      opcao.addEventListener("change", filtrarResp);
    });
    if (buscaResp) buscaResp.addEventListener("input", filtrarResp);

    var mapaResp = {
      "r-d-parentesco": "parentesco", "r-d-cpf": "cpf", "r-d-telefone": "telefone",
      "r-d-email": "email", "r-d-endereco": "endereco", "r-d-criancas": "criancas",
      "r-d-desde": "desde", "r-d-obs": "obs"
    };

    Array.prototype.forEach.call(tabelaResp.querySelectorAll(".ver-resp"), function (botao) {
      botao.addEventListener("click", function () {
        var linha = botao.closest("tr");
        Object.keys(mapaResp).forEach(function (id) {
          var alvo = document.getElementById(id);
          if (alvo) alvo.textContent = linha.dataset[mapaResp[id]] || "—";
        });
        var titulo = document.getElementById("resp-titulo");
        if (titulo) titulo.textContent = linha.dataset.nome || "Responsável";
        var statusDet = document.getElementById("status-detalhe-resp");
        if (statusDet) statusDet.textContent = "";
        painelResp.hidden = false;
        painelResp.focus();
      });
    });

    var fecharResp = document.getElementById("fechar-resp");
    if (fecharResp) fecharResp.addEventListener("click", function () { painelResp.hidden = true; });

    var editarResp = document.getElementById("editar-resp");
    if (editarResp) {
      editarResp.addEventListener("click", function () {
        var alvo = document.getElementById("status-detalhe-resp");
        if (!alvo) return;
        alvo.textContent = "A edição ainda não está conectada ao servidor.";
        alvo.className = "form-status form-status-aviso";
      });
    }
  }

  /* ---------- painel: crianças ---------- */

  var abrirCrianca = document.getElementById("abrir-crianca");
  var blocoCrianca = document.getElementById("form-crianca");
  if (abrirCrianca && blocoCrianca) {
    function alternarCrianca(abrir) {
      blocoCrianca.hidden = !abrir;
      abrirCrianca.setAttribute("aria-expanded", String(abrir));
      if (abrir) {
        var primeiro = document.getElementById("c-nome");
        if (primeiro) primeiro.focus();
      } else { abrirCrianca.focus(); }
    }
    abrirCrianca.addEventListener("click", function () { alternarCrianca(blocoCrianca.hidden); });
    var cancelarCrianca = document.getElementById("cancelar-crianca");
    if (cancelarCrianca) cancelarCrianca.addEventListener("click", function () { alternarCrianca(false); });
  }

  var formNovaCrianca = document.getElementById("form-nova-crianca");
  if (formNovaCrianca) {
    var cNome = document.getElementById("c-nome");
    var cNasc = document.getElementById("c-nascimento");
    var cResp = document.getElementById("c-responsavel");
    var statusCrianca = document.getElementById("status-crianca");

    formNovaCrianca.addEventListener("submit", function (e) {
      e.preventDefault();
      var erro = null;

      if (cNome.value.trim().split(/\s+/).length < 2) {
        mostrarErro(cNome, "Informe o nome e o sobrenome.");
        erro = cNome;
      } else { limparErro(cNome); }

      if (!cNasc.value) {
        mostrarErro(cNasc, "Informe a data de nascimento.");
        if (!erro) erro = cNasc;
      } else if (cNasc.value > new Date().toISOString().slice(0, 10)) {
        mostrarErro(cNasc, "A data não pode estar no futuro.");
        if (!erro) erro = cNasc;
      } else { limparErro(cNasc); }

      if (!cResp.value) {
        mostrarErro(cResp, "Escolha o responsável.");
        if (!erro) erro = cResp;
      } else { limparErro(cResp); }

      if (erro) { erro.focus(); return; }

      if (statusCrianca) {
        statusCrianca.textContent = "Dados válidos. A gravação ainda não está conectada ao servidor, " +
          "então o cadastro não foi salvo.";
        statusCrianca.className = "form-status form-status-aviso";
      }
    });

    [cNome, cNasc, cResp].forEach(function (campo) {
      campo.addEventListener("input", function () {
        if (campo.classList.contains("tem-erro")) limparErro(campo);
      });
    });
  }

  var tabelaCriancas = document.getElementById("tabela-criancas");
  if (tabelaCriancas) {
    var linhasCriancas = Array.prototype.slice.call(tabelaCriancas.querySelectorAll("tbody tr"));
    var vazioCrianca = document.getElementById("crianca-vazio");
    var contagemCriancas = document.getElementById("contagem-criancas");
    var buscaCrianca = document.getElementById("busca-crianca");
    var painelCrianca = document.getElementById("detalhe-crianca");

    function filtrarCriancas() {
      var marcado = document.querySelector('input[name="filtro-crianca"]:checked');
      var grupo = marcado ? marcado.value : "ativa";
      var termo = (buscaCrianca ? buscaCrianca.value : "").trim().toLowerCase();
      var visiveis = 0;

      linhasCriancas.forEach(function (linha) {
        var grupos = (linha.dataset.grupo || "").split(" ");
        var casa = grupo === "todas" || grupos.indexOf(grupo) !== -1;
        var casaBusca = !termo || (linha.dataset.busca || "").indexOf(termo) !== -1;
        var mostra = casa && casaBusca;
        linha.hidden = !mostra;
        if (mostra) visiveis++;
      });

      if (vazioCrianca) vazioCrianca.hidden = visiveis > 0;
      if (contagemCriancas) {
        contagemCriancas.textContent = visiveis + (visiveis === 1 ? " criança" : " crianças");
      }
    }

    Array.prototype.forEach.call(document.querySelectorAll('input[name="filtro-crianca"]'), function (opcao) {
      opcao.addEventListener("change", filtrarCriancas);
    });
    if (buscaCrianca) buscaCrianca.addEventListener("input", filtrarCriancas);
    filtrarCriancas();

    var mapaCrianca = {
      "k-nascimento": "nascimento", "k-responsavel": "responsavel", "k-escola": "escola",
      "k-atividades": "atividades", "k-imagem": "imagem", "k-desde": "desde",
      "k-obs": "obs", "k-estado": "estado"
    };

    Array.prototype.forEach.call(tabelaCriancas.querySelectorAll(".ver-crianca"), function (botao) {
      botao.addEventListener("click", function () {
        var linha = botao.closest("tr");
        Object.keys(mapaCrianca).forEach(function (id) {
          var alvo = document.getElementById(id);
          if (alvo) alvo.textContent = linha.dataset[mapaCrianca[id]] || "—";
        });
        var titulo = document.getElementById("crianca-titulo");
        if (titulo) titulo.textContent = linha.dataset.nome || "Criança";
        var statusDet = document.getElementById("status-detalhe-crianca");
        if (statusDet) statusDet.textContent = "";
        painelCrianca.hidden = false;
        painelCrianca.focus();
      });
    });

    var fecharCrianca = document.getElementById("fechar-crianca");
    if (fecharCrianca) fecharCrianca.addEventListener("click", function () { painelCrianca.hidden = true; });

    function avisoCrianca(mensagem) {
      var alvo = document.getElementById("status-detalhe-crianca");
      if (!alvo) return;
      alvo.textContent = mensagem;
      alvo.className = "form-status form-status-aviso";
    }

    var editarCrianca = document.getElementById("editar-crianca");
    if (editarCrianca) {
      editarCrianca.addEventListener("click", function () {
        avisoCrianca("A edição ainda não está conectada ao servidor.");
      });
    }

    var inativarCrianca = document.getElementById("inativar-crianca");
    if (inativarCrianca) {
      inativarCrianca.addEventListener("click", function () {
        if (!window.confirm("Inativar este cadastro? A criança sai das listas de atividades, " +
          "mas o histórico é mantido.")) return;
        avisoCrianca("A inativação ainda não está conectada ao servidor.");
      });
    }
  }

  /* ---------- solicitação de vaga (público) ---------- */

  var formSolicitacao = document.getElementById("form-solicitacao");
  if (formSolicitacao) {
    var respNome = document.getElementById("resp-nome");
    var respCpf = document.getElementById("resp-cpf");
    var respParentesco = document.getElementById("resp-parentesco");
    var respTelefone = document.getElementById("resp-telefone");
    var respEmail = document.getElementById("resp-email");
    var respBairro = document.getElementById("resp-bairro");
    var criancaNome = document.getElementById("crianca-nome");
    var criancaNasc = document.getElementById("crianca-nascimento");
    var motivo = document.getElementById("motivo");
    var declaro = document.getElementById("declaro");
    var aceiteLgpd = document.getElementById("aceite-lgpd");
    var statusSolicitacao = document.getElementById("status-solicitacao");

    aplicarMascara(respCpf, mascaraCpf);
    aplicarMascara(respTelefone, mascaraTelefone);

    function idadeEm(dataTexto) {
      var nasc = new Date(dataTexto + "T00:00:00");
      var hoje = new Date();
      var anos = hoje.getFullYear() - nasc.getFullYear();
      var mes = hoje.getMonth() - nasc.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) anos--;
      return anos;
    }

    var regrasSolicitacao = [
      [respNome, function (v) {
        if (!v.trim()) return "Informe o seu nome.";
        if (v.trim().split(/\s+/).length < 2) return "Informe o nome e o sobrenome.";
        return "";
      }],
      [respCpf, function (v) {
        if (!soNumeros(v)) return "Informe o seu CPF.";
        if (!cpfValido(v)) return "Esse CPF não é válido.";
        return "";
      }],
      [respParentesco, function (v) { return v ? "" : "Informe o parentesco."; }],
      [respTelefone, function (v) {
        var n = soNumeros(v);
        if (!n) return "Informe um telefone para contato.";
        if (n.length < 10) return "O telefone precisa ter DDD e número.";
        return "";
      }],
      [respEmail, function (v) {
        if (!v.trim()) return "";
        return emailValido(v) ? "" : "Esse e-mail não parece válido.";
      }],
      [respBairro, function (v) { return v.trim() ? "" : "Informe o bairro e a cidade."; }],
      [criancaNome, function (v) {
        if (!v.trim()) return "Informe o nome da criança.";
        if (v.trim().split(/\s+/).length < 2) return "Informe o nome e o sobrenome.";
        return "";
      }],
      [criancaNasc, function (v) {
        if (!v) return "Informe a data de nascimento.";
        if (v > new Date().toISOString().slice(0, 10)) return "A data não pode estar no futuro.";
        if (idadeEm(v) > 17) return "O atendimento é para crianças e adolescentes de até 17 anos.";
        return "";
      }],
      [motivo, function (v) {
        if (!v.trim()) return "Conte por que está procurando a ONG.";
        if (v.trim().length < 20) return "Escreva um pouco mais para ajudar na análise.";
        return "";
      }],
      [declaro, function (_, campo) {
        return campo.checked ? "" : "É preciso declarar que você é o responsável legal.";
      }],
      [aceiteLgpd, function (_, campo) {
        return campo.checked ? "" : "É preciso autorizar o uso dos dados para analisar o pedido.";
      }]
    ];

    function conferir(campo, teste) {
      var mensagem = teste(campo.value, campo);
      if (mensagem) { mostrarErro(campo, mensagem); return false; }
      limparErro(campo);
      return true;
    }

    regrasSolicitacao.forEach(function (par) {
      var campo = par[0], teste = par[1];
      if (!campo) return;
      var evento = (campo.type === "checkbox" || campo.tagName === "SELECT") ? "change" : "blur";
      campo.addEventListener(evento, function () { conferir(campo, teste); });
      campo.addEventListener("input", function () {
        if (campo.classList.contains("tem-erro")) conferir(campo, teste);
      });
    });

    formSolicitacao.addEventListener("submit", function (e) {
      e.preventDefault();
      var primeiro = null;
      regrasSolicitacao.forEach(function (par) {
        if (!par[0]) return;
        if (!conferir(par[0], par[1]) && !primeiro) primeiro = par[0];
      });

      if (primeiro) {
        primeiro.focus();
        if (statusSolicitacao) {
          statusSolicitacao.textContent = "Confira os campos destacados antes de enviar.";
          statusSolicitacao.className = "form-status form-status-erro";
        }
        return;
      }

      if (statusSolicitacao) {
        statusSolicitacao.textContent = "Solicitação válida. O envio ainda não está conectado ao " +
          "servidor, então o pedido não foi registrado. Para solicitar agora, procure a sede ou " +
          "fale com a ONG pelo WhatsApp.";
        statusSolicitacao.className = "form-status form-status-aviso";
      }
    });
  }

  /* ---------- painel: solicitações ---------- */

  var tabelaSol = document.getElementById("tabela-solicitacoes");
  if (tabelaSol) {
    var linhasSol = Array.prototype.slice.call(tabelaSol.querySelectorAll("tbody tr"));
    var vazioSol = document.getElementById("sol-vazio");
    var contagemSol = document.getElementById("contagem-sol");
    var buscaSol = document.getElementById("busca-sol");
    var painelSol = document.getElementById("detalhe-solicitacao");
    var acoesAnalise = document.getElementById("acoes-analise");
    var campoAnalise = document.getElementById("campo-analise");

    function filtrarSol() {
      var marcado = document.querySelector('input[name="filtro-sol"]:checked');
      var situacao = marcado ? marcado.value : "pendente";
      var termo = (buscaSol ? buscaSol.value : "").trim().toLowerCase();
      var visiveis = 0;

      linhasSol.forEach(function (linha) {
        var casa = situacao === "todas" || linha.dataset.situacao === situacao;
        var casaBusca = !termo || (linha.dataset.busca || "").indexOf(termo) !== -1;
        var mostra = casa && casaBusca;
        linha.hidden = !mostra;
        if (mostra) visiveis++;
      });

      if (vazioSol) vazioSol.hidden = visiveis > 0;
      if (contagemSol) {
        contagemSol.textContent = visiveis + (visiveis === 1 ? " solicitação" : " solicitações");
      }
    }

    Array.prototype.forEach.call(document.querySelectorAll('input[name="filtro-sol"]'), function (opcao) {
      opcao.addEventListener("change", filtrarSol);
    });
    if (buscaSol) buscaSol.addEventListener("input", filtrarSol);
    filtrarSol();

    var mapaSol = {
      "s-recebida": "recebida", "s-crianca": "crianca", "s-nascimento": "nascimento",
      "s-escola": "escola", "s-responsavel": "responsavel", "s-contato": "contato",
      "s-bairro": "bairro", "s-estado": "estado", "s-motivo": "motivo"
    };

    Array.prototype.forEach.call(tabelaSol.querySelectorAll(".ver-solicitacao"), function (botao) {
      botao.addEventListener("click", function () {
        var linha = botao.closest("tr");
        Object.keys(mapaSol).forEach(function (id) {
          var alvo = document.getElementById(id);
          if (alvo) alvo.textContent = linha.dataset[mapaSol[id]] || "—";
        });
        var titulo = document.getElementById("sol-titulo");
        if (titulo) titulo.textContent = linha.dataset.crianca || "Solicitação";

        /* Só pedido pendente pode ser analisado: já decidido vira só consulta. */
        var pendente = linha.dataset.situacao === "pendente";
        if (acoesAnalise) acoesAnalise.hidden = !pendente;
        if (campoAnalise) campoAnalise.hidden = !pendente;

        var statusSol = document.getElementById("status-sol");
        if (statusSol) statusSol.textContent = "";
        painelSol.hidden = false;
        painelSol.focus();
      });
    });

    var fecharSol = document.getElementById("fechar-sol");
    if (fecharSol) fecharSol.addEventListener("click", function () { painelSol.hidden = true; });

    function decidir(mensagem) {
      var statusSol = document.getElementById("status-sol");
      if (!statusSol) return;
      statusSol.textContent = mensagem;
      statusSol.className = "form-status form-status-aviso";
    }

    var aprovar = document.getElementById("aprovar-sol");
    if (aprovar) {
      aprovar.addEventListener("click", function () {
        if (!window.confirm("Aprovar esta solicitação? A criança e o responsável entram no cadastro.")) return;
        decidir("A aprovação ainda não está conectada ao servidor, então nada foi cadastrado.");
      });
    }

    var reprovar = document.getElementById("reprovar-sol");
    if (reprovar) {
      reprovar.addEventListener("click", function () {
        var obs = document.getElementById("observacao");
        if (obs && !obs.value.trim()) {
          obs.focus();
          decidir("Escreva uma observação explicando o motivo antes de reprovar.");
          return;
        }
        if (!window.confirm("Reprovar esta solicitação?")) return;
        decidir("A reprovação ainda não está conectada ao servidor.");
      });
    }
  }

  /* ---------- painel: doadores ---------- */

  var tabelaDoadores = document.getElementById("tabela-doadores");
  if (tabelaDoadores) {
    var linhasDoadores = Array.prototype.slice.call(tabelaDoadores.querySelectorAll("tbody tr"));
    var vazioDoadores = document.getElementById("doadores-vazio");
    var contagemDoadores = document.getElementById("contagem-doadores");
    var buscaDoador = document.getElementById("busca-doador");
    var painel = document.getElementById("detalhe-doador");

    function filtrarDoadores() {
      var marcado = document.querySelector('input[name="filtro-doador"]:checked');
      var grupo = marcado ? marcado.value : "todos";
      var termo = (buscaDoador ? buscaDoador.value : "").trim().toLowerCase();
      var visiveis = 0;

      linhasDoadores.forEach(function (linha) {
        var grupos = (linha.dataset.grupo || "").split(" ");
        var casaGrupo = grupo === "todos" || grupos.indexOf(grupo) !== -1;
        var casaBusca = !termo || (linha.dataset.busca || "").indexOf(termo) !== -1;
        var mostra = casaGrupo && casaBusca;
        linha.hidden = !mostra;
        if (mostra) visiveis++;
      });

      if (vazioDoadores) vazioDoadores.hidden = visiveis > 0;
      if (contagemDoadores) {
        contagemDoadores.textContent = visiveis + (visiveis === 1 ? " doador" : " doadores");
      }
    }

    Array.prototype.forEach.call(document.querySelectorAll('input[name="filtro-doador"]'), function (opcao) {
      opcao.addEventListener("change", filtrarDoadores);
    });
    if (buscaDoador) buscaDoador.addEventListener("input", filtrarDoadores);

    /* Um único painel de detalhe, preenchido com os dados da linha escolhida. */
    var mapa = {
      "detalhe-nome": "nome", "d-email": "email", "d-telefone": "telefone", "d-cpf": "cpf",
      "d-desde": "desde", "d-doacoes": "doacoes", "d-total": "total",
      "d-mensal": "mensal", "d-voluntariado": "voluntariado", "d-situacao": "situacao"
    };

    Array.prototype.forEach.call(tabelaDoadores.querySelectorAll(".ver-doador"), function (botao) {
      botao.addEventListener("click", function () {
        var linha = botao.closest("tr");
        Object.keys(mapa).forEach(function (id) {
          var alvo = document.getElementById(id);
          if (alvo) alvo.textContent = linha.dataset[mapa[id]] || "—";
        });
        var statusDoador = document.getElementById("status-doador");
        if (statusDoador) statusDoador.textContent = "";
        painel.hidden = false;
        painel.focus();
      });
    });

    var fecharDetalhe = document.getElementById("fechar-detalhe");
    if (fecharDetalhe) fecharDetalhe.addEventListener("click", function () { painel.hidden = true; });

    var inativar = document.getElementById("inativar-doador");
    if (inativar) {
      inativar.addEventListener("click", function () {
        var certeza = window.confirm("Inativar esta conta? A pessoa deixa de conseguir entrar, " +
          "mas o histórico de doações é mantido.");
        if (!certeza) return;
        var alvo = document.getElementById("status-doador");
        if (alvo) {
          alvo.textContent = "A inativação ainda não está conectada ao servidor.";
          alvo.className = "form-status form-status-aviso";
        }
      });
    }

    var exportarDoadores = document.getElementById("exportar-doadores");
    if (exportarDoadores) {
      exportarDoadores.addEventListener("click", function () {
        var alvo = document.getElementById("status-exportar-doadores");
        if (!alvo) return;
        alvo.textContent = "A exportação ainda não está conectada ao servidor.";
        alvo.className = "form-status form-status-aviso";
      });
    }
  }

  /* ---------- painel: doações ---------- */

  var tabelaAdmin = document.getElementById("tabela-admin-doacoes");
  if (tabelaAdmin) {
    var linhasAdmin = Array.prototype.slice.call(tabelaAdmin.querySelectorAll("tbody tr"));
    var vazioAdmin = document.getElementById("lista-vazia");
    var contagem = document.getElementById("contagem-doacoes");
    var busca = document.getElementById("busca");

    function filtroAtual() {
      var marcado = document.querySelector('input[name="filtro"]:checked');
      return marcado ? marcado.value : "todas";
    }

    function aplicarFiltros() {
      var situacao = filtroAtual();
      var termo = (busca ? busca.value : "").trim().toLowerCase();
      var visiveis = 0;

      linhasAdmin.forEach(function (linha) {
        var casaSituacao = situacao === "todas" || linha.dataset.situacao === situacao;
        var casaBusca = !termo || (linha.dataset.doador || "").indexOf(termo) !== -1;
        var mostra = casaSituacao && casaBusca;
        linha.hidden = !mostra;
        if (mostra) visiveis++;
      });

      if (vazioAdmin) vazioAdmin.hidden = visiveis > 0;
      if (contagem) contagem.textContent = visiveis + (visiveis === 1 ? " doação" : " doações");
    }

    Array.prototype.forEach.call(document.querySelectorAll('input[name="filtro"]'), function (opcao) {
      opcao.addEventListener("change", aplicarFiltros);
    });
    if (busca) busca.addEventListener("input", aplicarFiltros);

    var exportar = document.getElementById("exportar-csv");
    var statusExportar = document.getElementById("status-exportar");
    if (exportar) {
      exportar.addEventListener("click", function () {
        /* O CSV é gerado pelo back-end, com os dados completos e não só os da página. */
        if (!statusExportar) return;
        statusExportar.textContent = "A exportação ainda não está conectada ao servidor.";
        statusExportar.className = "form-status form-status-aviso";
      });
    }
  }

  /* Abrir e fechar o formulário de doação manual */
  var abrirManual = document.getElementById("abrir-manual");
  var blocoManual = document.getElementById("form-manual");
  if (abrirManual && blocoManual) {
    function alternarManual(abrir) {
      blocoManual.hidden = !abrir;
      abrirManual.setAttribute("aria-expanded", String(abrir));
      if (abrir) {
        var primeiro = document.getElementById("manual-doador");
        if (primeiro) primeiro.focus();
      } else {
        abrirManual.focus();
      }
    }
    abrirManual.addEventListener("click", function () { alternarManual(blocoManual.hidden); });
    var cancelarManual = document.getElementById("cancelar-manual");
    if (cancelarManual) cancelarManual.addEventListener("click", function () { alternarManual(false); });
  }

  var formManual = document.getElementById("form-doacao-manual");
  if (formManual) {
    var manualDoador = document.getElementById("manual-doador");
    var manualValor = document.getElementById("manual-valor");
    var manualData = document.getElementById("manual-data");
    var statusManual = document.getElementById("status-manual");

    manualValor.addEventListener("input", function () {
      var centavos = soNumeros(manualValor.value).slice(0, 9);
      if (!centavos) { manualValor.value = ""; return; }
      var numero = (parseInt(centavos, 10) / 100).toFixed(2).split(".");
      numero[0] = numero[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      manualValor.value = numero.join(",");
      if (manualValor.classList.contains("tem-erro")) limparErro(manualValor);
    });

    formManual.addEventListener("submit", function (e) {
      e.preventDefault();
      var erro = null;

      if (!manualDoador.value.trim()) {
        mostrarErro(manualDoador, "Informe quem fez a doação.");
        erro = manualDoador;
      } else { limparErro(manualDoador); }

      if (!soNumeros(manualValor.value)) {
        mostrarErro(manualValor, "Informe o valor recebido.");
        if (!erro) erro = manualValor;
      } else { limparErro(manualValor); }

      if (!manualData.value) {
        mostrarErro(manualData, "Informe a data do recebimento.");
        if (!erro) erro = manualData;
      } else if (manualData.value > new Date().toISOString().slice(0, 10)) {
        mostrarErro(manualData, "A data não pode estar no futuro.");
        if (!erro) erro = manualData;
      } else { limparErro(manualData); }

      if (erro) { erro.focus(); return; }

      if (statusManual) {
        statusManual.textContent = "Dados válidos. A gravação ainda não está conectada ao servidor, " +
          "então a doação não foi registrada.";
        statusManual.className = "form-status form-status-aviso";
      }
    });
  }

  /* ---------- candidatura de voluntário ---------- */

  var formVoluntario = document.getElementById("form-voluntario");
  if (formVoluntario) {
    aplicarEstado({
      analise: "estado-analise",
      aprovada: "estado-aprovada",
      formulario: "estado-formulario"
    }, "estado-formulario");

    var aceiteVol = document.getElementById("aceite-vol");
    var statusVol = document.getElementById("status-voluntario");

    function marcados(nome) {
      return formVoluntario.querySelectorAll('input[name="' + nome + '"]:checked').length;
    }

    function erroGrupo(id, mensagem) {
      var alvo = document.getElementById(id);
      if (alvo) alvo.textContent = mensagem;
    }

    formVoluntario.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;

      if (!marcados("area")) {
        erroGrupo("erro-area", "Escolha pelo menos uma área.");
        ok = false;
      } else { erroGrupo("erro-area", ""); }

      if (!marcados("disponibilidade")) {
        erroGrupo("erro-disponibilidade", "Informe quando você pode ajudar.");
        ok = false;
      } else { erroGrupo("erro-disponibilidade", ""); }

      if (!aceiteVol.checked) {
        erroGrupo("erro-aceite-vol", "É preciso autorizar o contato para enviar a candidatura.");
        ok = false;
      } else { erroGrupo("erro-aceite-vol", ""); }

      if (!ok) {
        if (statusVol) {
          statusVol.textContent = "Confira os campos destacados antes de enviar.";
          statusVol.className = "form-status form-status-erro";
        }
        return;
      }

      if (statusVol) {
        statusVol.textContent = "Candidatura válida. O envio ainda não está conectado ao servidor, " +
          "então nada foi registrado. Para se candidatar agora, fale com a ONG.";
        statusVol.className = "form-status form-status-aviso";
      }
    });

    formVoluntario.addEventListener("change", function (e) {
      if (e.target.name === "area" && marcados("area")) erroGrupo("erro-area", "");
      if (e.target.name === "disponibilidade" && marcados("disponibilidade")) erroGrupo("erro-disponibilidade", "");
      if (e.target === aceiteVol && aceiteVol.checked) erroGrupo("erro-aceite-vol", "");
    });
  }

  var retirarCandidatura = document.getElementById("retirar-candidatura");
  if (retirarCandidatura) {
    var statusRetirar = document.getElementById("status-retirar");
    retirarCandidatura.addEventListener("click", function () {
      var certeza = window.confirm("Retirar a sua candidatura ao voluntariado?");
      if (!certeza) return;
      if (statusRetirar) {
        statusRetirar.textContent = "A retirada ainda não está conectada ao servidor. " +
          "Para cancelar agora, fale com a ONG.";
        statusRetirar.className = "form-status form-status-aviso";
      }
    });
  }

  /* ---------- histórico de doações ---------- */

  var tabelaDoacoes = document.getElementById("tabela-doacoes");
  if (tabelaDoacoes) {
    var linhas = Array.prototype.slice.call(tabelaDoacoes.querySelectorAll("tbody tr"));
    var vazio = document.getElementById("lista-vazia");

    Array.prototype.forEach.call(document.querySelectorAll('input[name="filtro"]'), function (opcao) {
      opcao.addEventListener("change", function () {
        var filtro = opcao.value;
        var visiveis = 0;
        linhas.forEach(function (linha) {
          var mostra = filtro === "todas" || linha.dataset.situacao === filtro;
          linha.hidden = !mostra;
          if (mostra) visiveis++;
        });
        if (vazio) vazio.hidden = visiveis > 0;
      });
    });

    var statusComprovante = document.getElementById("status-comprovante");
    Array.prototype.forEach.call(tabelaDoacoes.querySelectorAll(".comprovante"), function (botao) {
      botao.addEventListener("click", function () {
        /* O PDF do comprovante é gerado pelo back-end. */
        if (!statusComprovante) return;
        statusComprovante.textContent = "A emissão de comprovante ainda não está conectada ao servidor.";
        statusComprovante.className = "form-status form-status-aviso";
      });
    });
  }

  var cancelarAssinatura = document.getElementById("cancelar-assinatura");
  if (cancelarAssinatura) {
    var statusAssinatura = document.getElementById("status-assinatura");
    cancelarAssinatura.addEventListener("click", function () {
      var certeza = window.confirm("Cancelar a doação mensal? Nenhuma nova cobrança será feita.");
      if (!certeza) return;
      if (statusAssinatura) {
        statusAssinatura.textContent = "O cancelamento ainda não está conectado ao Mercado Pago. " +
          "Para cancelar agora, fale com a ONG.";
        statusAssinatura.className = "form-status form-status-aviso";
      }
    });
  }

  /* ---------- doação ---------- */

  var formDoacao = document.getElementById("form-doacao");
  if (formDoacao) {
    var campoOutro = document.getElementById("campo-outro");
    var valorOutro = document.getElementById("valor-outro");
    var resumoTexto = document.getElementById("resumo-texto");
    var statusDoacao = document.getElementById("status-doacao");
    var MINIMO = 5;

    /* Converte o que foi digitado em centavos e devolve "1.234,56". */
    function mascaraMoeda(valor) {
      var centavos = soNumeros(valor).slice(0, 9);
      if (!centavos) return "";
      var numero = (parseInt(centavos, 10) / 100).toFixed(2);
      var partes = numero.split(".");
      partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return partes.join(",");
    }

    function valorEmReais(texto) {
      var centavos = soNumeros(texto);
      return centavos ? parseInt(centavos, 10) / 100 : 0;
    }

    function formatar(numero) {
      return numero.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d),)/g, ".");
    }

    function escolhaAtual() {
      var marcado = formDoacao.querySelector('input[name="valor"]:checked');
      return marcado ? marcado.value : "";
    }

    function valorEscolhido() {
      var escolha = escolhaAtual();
      return escolha === "outro" ? valorEmReais(valorOutro.value) : parseFloat(escolha || 0);
    }

    function frequenciaAtual() {
      var marcado = formDoacao.querySelector('input[name="frequencia"]:checked');
      return marcado ? marcado.value : "unica";
    }

    function atualizarResumo() {
      if (!resumoTexto) return;
      var valor = valorEscolhido();
      var quando = frequenciaAtual() === "mensal" ? "todo mês" : "uma única vez";
      if (!valor) {
        resumoTexto.textContent = "Escolha um valor para continuar.";
        return;
      }
      resumoTexto.innerHTML = "Você vai doar <strong>R$ " + formatar(valor) + "</strong>, " + quando + ".";
    }

    aplicarMascara(valorOutro, mascaraMoeda);

    formDoacao.addEventListener("change", function (e) {
      if (e.target.name === "valor") {
        var outro = e.target.value === "outro";
        campoOutro.hidden = !outro;
        if (outro) valorOutro.focus(); else limparErro(valorOutro);
      }
      atualizarResumo();
    });

    valorOutro.addEventListener("input", function () {
      if (valorOutro.classList.contains("tem-erro")) limparErro(valorOutro);
      atualizarResumo();
    });

    formDoacao.addEventListener("submit", function (e) {
      e.preventDefault();
      var valor = valorEscolhido();

      if (escolhaAtual() === "outro" && valor < MINIMO) {
        mostrarErro(valorOutro, !valor
          ? "Informe quanto você quer doar."
          : "O valor mínimo é R$ " + formatar(MINIMO) + ".");
        valorOutro.focus();
        return;
      }
      limparErro(valorOutro);

      /* No site com back-end: cria a doação como "aguardando pagamento",
         pede o link ao Mercado Pago e redireciona para ele. */
      if (statusDoacao) {
        statusDoacao.textContent = "Doação de R$ " + formatar(valor) + " " +
          (frequenciaAtual() === "mensal" ? "mensal" : "única") +
          " pronta para envio. O pagamento ainda não está conectado ao Mercado Pago, " +
          "então nada foi cobrado. Para doar agora, use a chave PIX na página Como ajudar.";
        statusDoacao.className = "form-status form-status-aviso";
      }
    });

    atualizarResumo();
  }

  /* ---------- meu perfil ---------- */

  var formPerfil = document.getElementById("form-perfil");
  if (formPerfil) {
    var perfilNome = document.getElementById("nome");
    var perfilEmail = document.getElementById("email");
    var perfilTel = document.getElementById("telefone");
    var statusPerfil = document.getElementById("status-perfil");

    aplicarMascara(perfilTel, mascaraTelefone);

    formPerfil.addEventListener("submit", function (e) {
      e.preventDefault();
      var erro = null;

      if (perfilNome.value.trim().split(/\s+/).length < 2) {
        mostrarErro(perfilNome, "Informe o nome e o sobrenome.");
        erro = perfilNome;
      } else { limparErro(perfilNome); }

      if (!emailValido(perfilEmail.value)) {
        mostrarErro(perfilEmail, "Esse e-mail não parece válido.");
        if (!erro) erro = perfilEmail;
      } else { limparErro(perfilEmail); }

      if (soNumeros(perfilTel.value).length < 10) {
        mostrarErro(perfilTel, "O telefone precisa ter DDD e número.");
        if (!erro) erro = perfilTel;
      } else { limparErro(perfilTel); }

      if (erro) { erro.focus(); return; }

      if (statusPerfil) {
        statusPerfil.textContent = "Dados válidos. A gravação ainda não está conectada ao servidor, " +
          "então nada foi alterado.";
        statusPerfil.className = "form-status form-status-aviso";
      }
    });
  }

  var formSenhaConta = document.getElementById("form-senha");
  if (formSenhaConta) {
    var senhaAtual = document.getElementById("atual");
    var senhaNova = document.getElementById("senha");
    var senhaConfirma = document.getElementById("confirmar");
    var statusSenhaConta = document.getElementById("status-senha");

    formSenhaConta.addEventListener("submit", function (e) {
      e.preventDefault();
      var erro = null;

      if (!senhaAtual.value) { mostrarErro(senhaAtual, "Informe a senha atual."); erro = senhaAtual; }
      else { limparErro(senhaAtual); }

      if (senhaNova.value.length < 8) {
        mostrarErro(senhaNova, !senhaNova.value ? "Crie uma senha." : "A senha precisa ter pelo menos 8 caracteres.");
        if (!erro) erro = senhaNova;
      } else if (senhaNova.value === senhaAtual.value) {
        mostrarErro(senhaNova, "A nova senha precisa ser diferente da atual.");
        if (!erro) erro = senhaNova;
      } else { limparErro(senhaNova); }

      if (senhaConfirma.value !== senhaNova.value) {
        mostrarErro(senhaConfirma, !senhaConfirma.value ? "Repita a senha." : "As senhas não são iguais.");
        if (!erro) erro = senhaConfirma;
      } else { limparErro(senhaConfirma); }

      if (erro) { erro.focus(); return; }

      if (statusSenhaConta) {
        statusSenhaConta.textContent = "Senha válida. A troca ainda não está conectada ao servidor, " +
          "então a senha anterior continua valendo.";
        statusSenhaConta.className = "form-status form-status-aviso";
      }
    });
  }

  var botaoExcluir = document.getElementById("excluir-conta");
  if (botaoExcluir) {
    var statusExcluir = document.getElementById("status-excluir");
    botaoExcluir.addEventListener("click", function () {
      /* Ação destrutiva: pede confirmação antes. A exclusão real é do back-end. */
      var certeza = window.confirm("Excluir a sua conta e apagar os seus dados pessoais? " +
        "Essa ação não pode ser desfeita.");
      if (!certeza) return;
      if (statusExcluir) {
        statusExcluir.textContent = "A exclusão ainda não está conectada ao servidor. " +
          "Para apagar os seus dados agora, fale com a ONG.";
        statusExcluir.className = "form-status form-status-aviso";
      }
    });
  }

  /* ---------- confirmação de e-mail ---------- */

  if (document.getElementById("estado-aguardando")) {
    aplicarEstado({
      confirmado: "estado-confirmado",
      expirado: "estado-expirado",
      aguardando: "estado-aguardando"
    }, "estado-aguardando");

    [["reenviar-email", "status-confirmacao"], ["reenviar-email-2", "status-confirmacao-2"]]
      .forEach(function (par) {
        var botao = document.getElementById(par[0]);
        var alvo = document.getElementById(par[1]);
        if (!botao || !alvo) return;
        botao.addEventListener("click", function () {
          /* O envio de e-mail depende do back-end (Épico 4.1). */
          alvo.textContent = "O reenvio ainda não está conectado ao servidor. " +
            "Se precisar confirmar a conta agora, fale com a ONG.";
          alvo.className = "form-status form-status-aviso";
        });
      });
  }

  /* ---------- esqueci minha senha ---------- */

  var formEsqueci = document.getElementById("form-esqueci");
  if (formEsqueci) {
    var campoEsqueci = document.getElementById("email");
    var statusEsqueci = document.getElementById("status-esqueci");

    formEsqueci.addEventListener("submit", function (e) {
      e.preventDefault();
      var valor = campoEsqueci.value;

      if (!valor.trim() || !emailValido(valor)) {
        mostrarErro(campoEsqueci, !valor.trim() ? "Informe o seu e-mail." : "Esse e-mail não parece válido.");
        campoEsqueci.focus();
        return;
      }
      limparErro(campoEsqueci);

      /* Mensagem propositalmente genérica: não revela se o e-mail existe na base. */
      if (statusEsqueci) {
        statusEsqueci.textContent = "Se existir uma conta com esse e-mail, o link de recuperação será " +
          "enviado. O envio ainda não está conectado ao servidor.";
        statusEsqueci.className = "form-status form-status-aviso";
      }
    });

    campoEsqueci.addEventListener("input", function () {
      if (campoEsqueci.classList.contains("tem-erro")) limparErro(campoEsqueci);
    });
  }

  /* ---------- redefinir senha ---------- */

  var formRedefinir = document.getElementById("form-redefinir");
  if (formRedefinir) {
    aplicarEstado({ invalido: "estado-invalido", formulario: "estado-formulario" }, "estado-formulario");

    var novaSenha = document.getElementById("senha");
    var novaConfirma = document.getElementById("confirmar");
    var statusRedefinir = document.getElementById("status-redefinir");

    formRedefinir.addEventListener("submit", function (e) {
      e.preventDefault();
      var erro = null;

      if (novaSenha.value.length < 8) {
        mostrarErro(novaSenha, !novaSenha.value ? "Crie uma senha." : "A senha precisa ter pelo menos 8 caracteres.");
        erro = novaSenha;
      } else { limparErro(novaSenha); }

      if (novaConfirma.value !== novaSenha.value) {
        mostrarErro(novaConfirma, !novaConfirma.value ? "Repita a senha." : "As senhas não são iguais.");
        if (!erro) erro = novaConfirma;
      } else { limparErro(novaConfirma); }

      if (erro) { erro.focus(); return; }

      if (statusRedefinir) {
        statusRedefinir.textContent = "Senha válida. A troca ainda não está conectada ao servidor, " +
          "então a senha anterior continua valendo.";
        statusRedefinir.className = "form-status form-status-aviso";
      }
    });

    [novaSenha, novaConfirma].forEach(function (campo) {
      campo.addEventListener("input", function () {
        if (campo.classList.contains("tem-erro")) limparErro(campo);
      });
    });
  }

  /* ---------- login ---------- */

  var formLogin = document.getElementById("form-login");
  if (formLogin) {
    var loginEmail = document.getElementById("email");
    var loginSenha = document.getElementById("senha");
    var statusLogin = document.getElementById("status-login");

    var regrasLogin = [
      [loginEmail, function (v) {
        if (!v.trim()) return "Informe o seu e-mail.";
        if (!emailValido(v)) return "Esse e-mail não parece válido.";
        return "";
      }],
      [loginSenha, function (v) {
        if (!v) return "Informe a sua senha.";
        return "";
      }]
    ];

    regrasLogin.forEach(function (par) {
      var campo = par[0], teste = par[1];
      if (!campo) return;
      campo.addEventListener("input", function () {
        if (campo.classList.contains("tem-erro")) {
          var m = teste(campo.value, campo);
          if (m) { mostrarErro(campo, m); } else { limparErro(campo); }
        }
      });
    });

    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      if (statusLogin) statusLogin.textContent = "";

      var erro = null;
      regrasLogin.forEach(function (par) {
        var campo = par[0], teste = par[1];
        if (!campo) return;
        var m = teste(campo.value, campo);
        if (m) { mostrarErro(campo, m); if (!erro) erro = campo; } else { limparErro(campo); }
      });

      if (erro) {
        erro.focus();
        if (statusLogin) {
          statusLogin.textContent = "Preencha o e-mail e a senha para entrar.";
          statusLogin.className = "form-status form-status-erro";
        }
        return;
      }

      /* A autenticação ainda não existe (Épico 4.1, back-end em Java).
         Avisamos em vez de simular um login bem-sucedido. */
      if (statusLogin) {
        statusLogin.textContent = "A entrada ainda não está conectada ao servidor, então não foi " +
          "possível acessar a conta. Para doar agora, use a chave PIX na página Como ajudar.";
        statusLogin.className = "form-status form-status-aviso";
      }
    });
  }

  /* ---------- cadastro ---------- */

  var form = document.getElementById("form-cadastro");
  if (!form) return;

  var nome = document.getElementById("nome");
  var email = document.getElementById("email");
  var telefone = document.getElementById("telefone");
  var cpf = document.getElementById("cpf");
  var senha = document.getElementById("senha");
  var confirmar = document.getElementById("confirmar");
  var aceite = document.getElementById("aceite");
  var status = document.getElementById("status-cadastro");

  aplicarMascara(telefone, mascaraTelefone);
  aplicarMascara(cpf, mascaraCpf);

  var regras = [
    [nome, function (v) {
      if (!v.trim()) return "Informe o seu nome.";
      if (v.trim().split(/\s+/).length < 2) return "Informe o nome e o sobrenome.";
      return "";
    }],
    [email, function (v) {
      if (!v.trim()) return "Informe o seu e-mail.";
      if (!emailValido(v)) return "Esse e-mail não parece válido.";
      return "";
    }],
    [telefone, function (v) {
      var n = soNumeros(v);
      if (!n) return "Informe o seu telefone.";
      if (n.length < 10) return "O telefone precisa ter DDD e número.";
      return "";
    }],
    [cpf, function (v) {
      if (!soNumeros(v)) return "Informe o seu CPF.";
      if (!cpfValido(v)) return "Esse CPF não é válido.";
      return "";
    }],
    [senha, function (v) {
      if (!v) return "Crie uma senha.";
      if (v.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
      return "";
    }],
    [confirmar, function (v) {
      if (!v) return "Repita a senha.";
      if (v !== senha.value) return "As senhas não são iguais.";
      return "";
    }],
    [aceite, function (_, campo) {
      if (!campo.checked) return "É preciso aceitar a política de privacidade e os termos de uso.";
      return "";
    }]
  ];

  function validarCampo(campo, teste) {
    var mensagem = teste(campo.value, campo);
    if (mensagem) { mostrarErro(campo, mensagem); return false; }
    limparErro(campo);
    return true;
  }

  regras.forEach(function (par) {
    var campo = par[0], teste = par[1];
    if (!campo) return;
    var evento = campo.type === "checkbox" ? "change" : "blur";
    campo.addEventListener(evento, function () { validarCampo(campo, teste); });
    campo.addEventListener("input", function () {
      if (campo.classList.contains("tem-erro")) validarCampo(campo, teste);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (status) status.textContent = "";

    var primeiroErro = null;
    regras.forEach(function (par) {
      var campo = par[0], teste = par[1];
      if (!campo) return;
      if (!validarCampo(campo, teste) && !primeiroErro) primeiroErro = campo;
    });

    if (primeiroErro) {
      primeiroErro.focus();
      if (status) {
        status.textContent = "Confira os campos destacados antes de continuar.";
        status.className = "form-status form-status-erro";
      }
      return;
    }

    /* O cadastro ainda não está ligado ao back-end (Java). Enquanto isso,
       avisamos em vez de fingir que a conta foi criada. */
    if (status) {
      status.textContent = "Dados válidos. O cadastro ainda não está conectado ao servidor, " +
        "então a conta não foi criada. Para doar agora, use a chave PIX na página Como ajudar.";
      status.className = "form-status form-status-aviso";
    }
  });
})();
