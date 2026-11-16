/* Cliente HTTP compartilhado pelo site. O token fica apenas na sessão por padrão. */
(function () {
  "use strict";

  var TOKEN_KEY = "ong.accessToken";
  var USER_KEY = "ong.usuario";
  var baseUrl = String(window.ONG_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

  function storageForToken() {
    return localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
  }

  function token() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function usuario() {
    var raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function limparSessao() {
    [localStorage, sessionStorage].forEach(function (store) {
      store.removeItem(TOKEN_KEY);
      store.removeItem(USER_KEY);
    });
  }

  function salvarSessao(resposta, lembrar) {
    limparSessao();
    var store = lembrar ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, resposta.token);
    store.setItem(USER_KEY, JSON.stringify(resposta.usuario || {}));
  }

  /* Recados por situação, para quem está preenchendo um formulário. O 503 é o
     caso comum no plano gratuito do Render: sem acesso por uns 15 minutos o
     serviço hiberna, e a primeira visita espera a aplicação subir — perto de
     um minuto. Quem enviar o formulário nessa janela precisa entender que é
     para tentar de novo, e não que o cadastro deu erro. */
  var RECADO_POR_STATUS = {
    500: "Algo falhou do nosso lado. Tente de novo em instantes; se continuar, avise a equipe.",
    502: "O servidor está reiniciando. Espere um minuto e tente de novo.",
    503: "O servidor está acordando depois de um tempo parado. Espere um minuto e tente de novo.",
    504: "O servidor demorou demais para responder. Tente de novo em instantes."
  };

  function mensagemDoErro(payload, status) {
    if (payload && payload.campos) {
      var campos = payload.campos;
      var detalhe = Array.isArray(campos) ? campos.map(function (item) {
        return item.mensagem || item.defaultMessage || String(item);
      }).filter(Boolean).join(" ") : Object.keys(campos).map(function (key) {
        var valor = campos[key];
        return key + ": " + (Array.isArray(valor) ? valor.join(", ") : valor);
      }).filter(Boolean).join(" ");
      if (detalhe) return detalhe;
    }
    var daApi = payload && (payload.mensagem || payload.message);
    if (daApi) return daApi;
    /* Situação não prevista: frase em português primeiro, e o código entre
       parênteses no fim, que não atrapalha a leitura e ajuda quem for
       investigar quando a pessoa relatar o problema. */
    return RECADO_POR_STATUS[status]
      || ("Não foi possível concluir agora. Tente de novo em instantes (erro " + status + ").");
  }

  async function request(path, options) {
    options = options || {};
    var headers = new Headers(options.headers || {});
    var accessToken = options.public ? "" : token();
    if (accessToken) headers.set("Authorization", "Bearer " + accessToken);

    var body = options.body;
    if (body !== undefined && !(body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(body);
    }

    var response;
    try {
      response = await fetch(baseUrl + path, {
        method: options.method || "GET",
        headers: headers,
        body: body,
        credentials: "omit"
      });
    } catch (_) {
      throw new Error("Não foi possível conectar à API. Confira se o back-end está em execução e se a URL está correta.");
    }

    if (response.status === 204) return null;
    var text = await response.text();
    var payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (_) {
        /* Resposta que não é JSON: a página "Application loading" do Render
           durante a hibernação, uma página de erro do Spring, o HTML de algum
           proxy. Antes o corpo cru virava a mensagem do formulário, então a
           pessoa que se candidatava a voluntário levava uma página de HTML ou
           um rastro de pilha na tela. O texto vai para o console, de onde se
           investiga, e a pessoa recebe o recado por status. */
        console.error("Resposta não-JSON da API (HTTP " + response.status + "):", text.slice(0, 500));
        payload = null;
      }
    }
    if (!response.ok) {
      if (response.status === 401) limparSessao();
      throw new Error(mensagemDoErro(payload, response.status));
    }
    return payload;
  }

  window.OngApi = {
    baseUrl: baseUrl,
    request: request,
    token: token,
    usuario: usuario,
    salvarSessao: salvarSessao,
    limparSessao: limparSessao,
    endpoint: function (path) { return baseUrl + path; }
  };
}());
