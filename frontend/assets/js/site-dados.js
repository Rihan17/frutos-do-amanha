/* Conteúdo público carregado da API sem mudar os componentes visuais do site. */
(function () {
  "use strict";
  var api = window.OngApi;
  if (!api) return;
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function safeExternalUrl(value) { return /^https?:\/\//i.test(String(value || "")) ? String(value) : "#"; }
  function safeImage(value) {
    var url = String(value || "");
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(url)) return url;
    if (/^https:\/\//i.test(url) || (!/^([a-z]+:|\/\/)/i.test(url) && url.indexOf("..") < 0)) return url;
    return "assets/img/logo.jpg";
  }
  function cards(items) {
    return (items || []).map(function (item) {
      var href = "projeto.html?slug=" + encodeURIComponent(item.slug || item.id);
      return '<article class="card"><div class="photo photo-3x2"><img src="' + esc(safeImage(item.imagemUrl)) + '" alt="' + esc(item.imagemAlt || item.nome) + '" loading="lazy"></div><div class="card-body">' +
        (item.categoria ? '<p class="eyebrow eyebrow-blue">' + esc(item.categoria) + '</p>' : '') +
        '<h3><a class="card-link" href="' + href + '">' + esc(item.nome) + '</a></h3><p>' + esc(item.resumo || item.descricao || "Conheça este projeto da ONG Frutos do Amanhã.") + '</p><p class="link-mais"><a href="' + href + '">Ver o projeto</a></p></div></article>';
    }).join("");
  }
  function loadProjects() {
    var projects = document.getElementById("projetos-api");
    var featured = document.getElementById("destaques-projetos");
    if (!projects && !featured) return;
    api.request("/projetos", { public: true }).then(function (items) {
      var html = cards(items);
      [projects, featured].forEach(function (target) { if (target) target.innerHTML = html || '<p class="section-lead">Os projetos serão publicados em breve.</p>'; });
    }).catch(function () {});
  }
  function loadProjectDetail() {
    var root = document.getElementById("detalhe-projeto");
    if (!root) {
      var legacy = { "projeto-feirinha-da-crianca.html": "feirinha-da-crianca", "projeto-estudando-para-o-amanha.html": "estudando-para-o-amanha" }[location.pathname.split("/").pop()];
      if (legacy) api.request("/projetos/" + legacy, { public: true }).then(function (item) {
        location.replace("projeto.html?slug=" + encodeURIComponent(item.slug || legacy));
      }).catch(function () {});
      return;
    }
    var slug = new URLSearchParams(location.search).get("slug");
    if (!slug) { root.textContent = "Projeto não encontrado."; return; }
    api.request("/projetos/" + encodeURIComponent(slug), { public: true }).then(function (item) {
      document.title = item.nome + " — ONG Frutos do Amanhã";
      document.getElementById("projeto-titulo").textContent = item.nome;
      document.getElementById("projeto-categoria").textContent = item.categoria || "Projeto social";
      document.getElementById("projeto-resumo").textContent = item.resumo || "";
      var image = document.getElementById("projeto-imagem"); image.src = safeImage(item.imagemUrl); image.alt = item.imagemAlt || item.nome;
      document.getElementById("projeto-descricao").innerHTML = esc(item.descricao || item.resumo || "").split(/\n\s*\n/).map(function (p) { return "<p>" + p.replace(/\n/g, "<br>") + "</p>"; }).join("");
      root.hidden = false;
    }).catch(function () { root.textContent = "Não foi possível carregar este projeto."; });
  }
  function digits(value) { return String(value || "").replace(/\D/g, ""); }
  function phoneLabel(value) {
    var valueDigits = digits(value);
    if (valueDigits.indexOf("55") === 0 && valueDigits.length >= 12) valueDigits = valueDigits.slice(2);
    if (valueDigits.length === 10) return "(" + valueDigits.slice(0,2) + ") " + valueDigits.slice(2,6) + "-" + valueDigits.slice(6);
    if (valueDigits.length === 11) return "(" + valueDigits.slice(0,2) + ") " + valueDigits.slice(2,7) + "-" + valueDigits.slice(7);
    return value || "";
  }
  function setTextNodes(link, value) {
    var nodes = Array.prototype.filter.call(link.childNodes, function (node) { return node.nodeType === 3; });
    if (nodes.length) nodes[nodes.length - 1].nodeValue = " " + value;
    else link.appendChild(document.createTextNode(value));
  }
  function applyOrganization(info) {
    if (!info) return;
    document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
      link.href = "mailto:" + (info.email || ""); if (link.textContent.indexOf("@") >= 0) link.textContent = info.email || "";
    });
    document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
      link.href = "tel:" + (info.telefone || ""); if (/\d/.test(link.textContent)) link.textContent = phoneLabel(info.telefone);
    });
    document.querySelectorAll('a[href*="wa.me"]').forEach(function (link) {
      link.href = "https://wa.me/" + digits(info.whatsapp || "");
      if (/\(\d{2}\)|\d{4,}/.test(link.textContent)) link.textContent = phoneLabel(info.whatsapp);
    });
    document.querySelectorAll('a[href*="instagram.com"]').forEach(function (link) {
      link.href = safeExternalUrl(info.instagramUrl); setTextNodes(link, info.instagramNome || "Instagram");
    });
    document.querySelectorAll('a[href*="facebook.com"]').forEach(function (link) {
      link.href = safeExternalUrl(info.facebookUrl); setTextNodes(link, info.facebookNome || "Facebook");
    });
    document.querySelectorAll("address").forEach(function (node) {
      if (node.textContent.indexOf("Rua Geralda") >= 0) node.innerHTML = esc(info.endereco) + "<br>" + esc(info.localidade) + "<br>CEP " + esc(info.cep);
    });
    document.querySelectorAll(".site-footer p").forEach(function (node) {
      if (node.textContent.indexOf("Rua Geralda") >= 0) node.innerHTML = esc(info.endereco) + "<br>" + esc(info.localidade) + "<br>CEP " + esc(info.cep);
    });
    document.querySelectorAll(".horarios tbody tr").forEach(function (row) {
      var label = row.querySelector("th"); var value = row.querySelector("td"); if (!label || !value) return;
      if (label.textContent.indexOf("Segunda") >= 0) value.textContent = info.horarioSemana || "";
      else if (label.textContent.indexOf("Sábado") >= 0) value.textContent = info.horarioSabado || "";
      else if (label.textContent.indexOf("Domingo") >= 0) value.textContent = info.horarioDomingo || "";
    });
    document.querySelectorAll('a[href*="google.com/maps"]').forEach(function (link) { link.href = safeExternalUrl(info.mapaUrl); });
    document.querySelectorAll('iframe[src*="google.com/maps"]').forEach(function (frame) { frame.src = safeExternalUrl(info.mapaEmbedUrl || info.mapaUrl) === "#" ? "about:blank" : safeExternalUrl(info.mapaEmbedUrl || info.mapaUrl); });
    var pix = document.getElementById("pix-key"); var copy = document.getElementById("copiar-pix");
    if (pix) pix.textContent = info.chavePix || "A chave PIX ainda não foi cadastrada pela ONG.";
    if (copy) copy.disabled = !info.chavePix;
    var qrContainer = document.getElementById("pix-qrcode-container");
    var qrImage = document.getElementById("pix-qrcode");
    if (qrContainer && qrImage) {
      if (info.chavePix) {
        qrImage.src = api.endpoint("/publico/ong/pix-qrcode") + "?v=" + Date.now();
        qrContainer.hidden = false;
      } else {
        qrImage.removeAttribute("src");
        qrContainer.hidden = true;
      }
    }
  }
  function loadOrganization() {
    if (!document.querySelector(".site-footer, .endereco, #pix-key")) return;
    api.request("/publico/ong", { public: true }).then(applyOrganization).catch(function () {});
  }
  function loadAdminOrganization() {
    var form = document.getElementById("form-ong-info");
    if (!form) return;
    api.request("/adm/ong").then(function (info) {
      Object.keys(info || {}).forEach(function (key) { if (form.elements[key]) form.elements[key].value = info[key] || ""; });
    }).catch(function (error) { var out = document.getElementById("status-ong"); if (out) out.textContent = error.message; });
    form.addEventListener("submit", function (event) {
      event.preventDefault(); event.stopImmediatePropagation();
      var body = {}; Array.prototype.forEach.call(form.elements, function (input) { if (input.name) body[input.name] = input.value.trim(); });
      api.request("/adm/ong", { method: "PUT", body: body }).then(function (info) {
        applyOrganization(info); var out = document.getElementById("status-ong"); if (out) out.textContent = "Informações da ONG atualizadas.";
      }).catch(function (error) { var out = document.getElementById("status-ong"); if (out) out.textContent = error.message; });
    }, true);
  }
  function boot() { loadProjects(); loadProjectDetail(); loadOrganization(); loadAdminOrganization(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
}());
