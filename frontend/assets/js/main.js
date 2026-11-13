/* ONG Frutos do Amanhã — comportamentos compartilhados entre as páginas */
(function () {
  "use strict";

  /* Menu mobile (site e painel) --------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("menu-principal") || document.getElementById("admin-menu");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* O painel administrativo mantém uma saída acessível dentro do menu mobile. */
  var adminMenu = document.getElementById("admin-menu");
  if (adminMenu && !adminMenu.querySelector(".admin-sair-menu")) {
    var sair = document.createElement("a");
    sair.className = "admin-item admin-sair admin-sair-menu";
    sair.href = "index.html";
    sair.textContent = "Sair da área administrativa";
    adminMenu.appendChild(sair);
  }

  /* Preenche formulários com dados fictícios que podem ser enviados pela equipe na demonstração. */
  var adminHeader = document.querySelector(".admin .admin-cabecalho");
  var publicDemoPage = /\/(doar|voluntariado|solicitar-vaga)\.html$/.test(location.pathname);
  if ((adminHeader && document.querySelector(".admin main form")) || (publicDemoPage && document.querySelector("main form"))) {
    var demoButton = document.createElement("button");
    demoButton.type = "button";
    demoButton.className = "btn btn-copa admin-demo-button";
    demoButton.textContent = "Preencher exemplo";
    if (adminHeader) adminHeader.appendChild(demoButton);
    else document.querySelector("main form").parentNode.insertBefore(demoButton, document.querySelector("main form"));
    demoButton.addEventListener("click", function () {
      var form = Array.from(document.querySelectorAll("main form")).find(function (candidate) {
        return !candidate.closest("[hidden]");
      });
      if (!form) {
        var status = document.querySelector("main .form-status");
        if (status) status.textContent = "Abra primeiro o formulário que deseja demonstrar.";
        return;
      }
      form.querySelectorAll("input,select,textarea").forEach(function (field) {
        if (field.disabled || field.type === "hidden" || ["submit", "button", "reset", "file"].includes(field.type)) return;
        var key = ((field.id || "") + " " + (field.name || "") + " " +
          ((form.querySelector('label[for="' + field.id + '"]') || field.closest("label") || {}).textContent || "")).toLowerCase();
        if (field.type === "checkbox") { field.checked = true; return; }
        if (field.type === "radio") { field.checked = form.querySelector('input[type="radio"][name="' + field.name + '"]') === field; return; }
        if (field.tagName === "SELECT") {
          var option = Array.from(field.options).find(function (item) { return item.value && !item.disabled; });
          if (option) field.value = option.value;
        } else if (field.type === "email" || key.includes("email")) field.value = "demonstracao@exemplo.org";
        else if (field.type === "tel" || /telefone|celular|contato/.test(key)) field.value = "(13) 90000-0000";
        else if (field.type === "password") field.value = "DemoONG2026!";
        else if (/cpf/.test(key)) field.value = "529.982.247-25";
        else if (/cep/.test(key)) field.value = "11345-230";
        else if (field.type === "date") field.value = /nascimento|nasc/.test(key) ? "2015-06-15" : new Date().toISOString().slice(0, 10);
        else if (field.type === "number") field.value = "1";
        else if (field.tagName === "TEXTAREA") field.value = "Informação fictícia para demonstração do formulário.";
        else if (/nome/.test(key)) field.value = "Pessoa de Demonstração";
        else if (/valor|quantidade|renda/.test(key)) field.value = "100";
        else if (field.type === "url") field.value = "https://exemplo.org";
        else field.value = "Exemplo de demonstração";
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
      });
      form.dataset.demonstracao = "true";
      var notice = form.querySelector(".demo-notice");
      if (!notice) {
        notice = document.createElement("p");
        notice.className = "aviso demo-notice";
        notice.textContent = "Dados de demonstração preenchidos. Se enviar o formulário, eles serão registrados normalmente.";
        form.prepend(notice);
      }
      notice.hidden = false;
    });
  }

  /* Copiar chave PIX (página "Como ajudar") --------------------------- */
  var botao = document.getElementById("copiar-pix");
  var chave = document.getElementById("pix-key");
  var status = document.getElementById("pix-status");

  function fallbackCopy(texto) {
    var campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    try { document.execCommand("copy"); } catch (e) { /* ignora */ }
    campo.remove();
  }

  if (botao && chave) {
    var timer;
    botao.addEventListener("click", function () {
      var texto = chave.textContent.trim();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).catch(function () { fallbackCopy(texto); });
      } else {
        fallbackCopy(texto);
      }

      botao.textContent = "Chave PIX copiada!";
      if (status) status.textContent = "Chave PIX copiada para a área de transferência.";

      clearTimeout(timer);
      timer = setTimeout(function () {
        botao.textContent = botao.dataset.label;
        if (status) status.textContent = "";
      }, 2400);
    });
  }
})();
