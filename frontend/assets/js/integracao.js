/* Integra os fluxos do site com a API Spring sem alterar os componentes visuais. */
(function () {
  "use strict";

  var api = window.OngApi;
  if (!api) return;

  var projectsPromise;
  var profile;
  var donationPlanId;
  var selectedSolicitationId;
  var selectedVolunteerId;
  var currentVolunteer;
  var editingProjectId;

  function byId(id) { return document.getElementById(id); }
  function value(id) { var element = byId(id); return element ? element.value.trim() : ""; }
  function checkedValues(name, root) {
    return Array.prototype.map.call((root || document).querySelectorAll('input[name="' + name + '"]:checked'), function (item) {
      return item.value;
    });
  }
  function status(id, message, error) {
    var element = byId(id) || byId("status-" + id);
    if (!element) return;
    element.textContent = message || "";
    element.className = "form-status" + (message ? (error ? " form-status-erro" : " form-status-aviso") : "");
  }
  function showError(id, error) { status(id, error && error.message ? error.message : "Não foi possível concluir a operação.", true); }
  function bindSubmit(id, handler, statusId) {
    var form = byId(id);
    if (!form) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      Promise.resolve(handler(form)).catch(function (error) {
        showError(statusId || "status-" + id.replace(/^form-/, ""), error);
      });
    }, true);
  }
  function escapeHtml(input) {
    return String(input == null ? "" : input).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }
  function formatDate(date) {
    if (!date) return "—";
    var parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? String(date) : new Intl.DateTimeFormat("pt-BR").format(parsed);
  }
  function formatLocalDate(date) {
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      var parts = date.split("-").map(Number);
      return new Intl.DateTimeFormat("pt-BR", {timeZone:"UTC"}).format(new Date(Date.UTC(parts[0],parts[1]-1,parts[2])));
    }
    return formatDate(date);
  }
  function formatCurrency(amount) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(amount || 0));
  }
  function dateParts(value) {
    if (!value) return null;
    var date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    var parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    var result = {}; parts.forEach(function (part) { if (part.type !== "literal") result[part.type] = Number(part.value); });
    result.key = result.year + "-" + String(result.month).padStart(2, "0");
    result.dateKey = result.key + "-" + String(result.day).padStart(2, "0");
    return result;
  }
  function monthLabel(year, month, short) {
    return new Intl.DateTimeFormat("pt-BR", { month: short ? "short" : "long", timeZone: "America/Sao_Paulo" })
      .format(new Date(Number(year), Number(month) - 1, 15));
  }
  function isDonationPaid(item) { return ["CONFIRMADA", "PAGO"].indexOf(String(item.status || "").toUpperCase()) >= 0; }
  function renderDonationBars(root, buckets, label) {
    if (!root) return;
    if (!buckets.length) {
      root.innerHTML = '<p class="grafico-vazio">Não há doações neste período.</p>';
      root.style.gridTemplateColumns = "1fr";
      root.setAttribute("aria-label", label || "Sem doações para mostrar");
      return;
    }
    var max = Math.max.apply(null, buckets.map(function (bucket) { return bucket.total; }).concat([0]));
    root.style.gridTemplateColumns = "repeat(" + buckets.length + ", minmax(54px, 1fr))";
    root.setAttribute("aria-label", label || "Gráfico de doações por período");
    root.innerHTML = buckets.map(function (bucket) {
      var height = max > 0 ? Math.max(3, Math.round(bucket.total / max * 100)) : 3;
      var amount = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(bucket.total);
      return '<div class="barra" style="--altura:' + height + '%" title="' + escapeHtml(bucket.label + ": " + formatCurrency(bucket.total)) + '"><span class="barra-valor">' + escapeHtml(amount) + '</span><span class="barra-mes">' + escapeHtml(bucket.label) + '</span></div>';
    }).join("");
  }
  function imprimirTabelaPdf(table, title, statusId) {
    if (!table) return;
    var popup = window.open("", "_blank");
    if (!popup) { status(statusId, "Permita a abertura da janela de impressão para salvar o relatório em PDF.", true); return; }
    var clone = table.cloneNode(true);
    clone.querySelectorAll("tr[hidden]").forEach(function (row) { row.remove(); });
    var actionIndex = Array.from(clone.querySelectorAll("thead th")).findIndex(function (cell) { return cell.textContent.trim().toLowerCase() === "ações"; });
    if (actionIndex >= 0) clone.querySelectorAll("tr").forEach(function (row) { if (row.cells[actionIndex]) row.deleteCell(actionIndex); });
    clone.querySelectorAll("button").forEach(function (button) { button.remove(); });
    popup.document.open();
    popup.document.write("<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><title>" + escapeHtml(title) + "</title>" +
      "<style>body{font:12px Arial,sans-serif;color:#222;margin:24px}h1{font-size:20px;margin:0 0 6px}p{color:#555;margin:0 0 18px}table{width:100%;border-collapse:collapse}caption{text-align:left;margin-bottom:10px}th,td{border:1px solid #bbb;padding:7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#eef2e8}@media print{body{margin:12mm}}</style>" +
      "</head><body><h1>" + escapeHtml(title) + "</h1><p>ONG Frutos do Amanhã · Gerado em " + escapeHtml(new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date())) + "</p>" + clone.outerHTML + "</body></html>");
    popup.document.close();
    window.setTimeout(function () { popup.focus(); popup.print(); }, 250);
    status(statusId, "Na janela de impressão, selecione “Salvar como PDF”.");
  }

  function formatStatus(value) {
    var labels = { PENDENTE: "Em análise", APROVADA: "Aprovada", RECUSADA: "Recusada", REJEITADA: "Rejeitada", ENCERRADA: "Encerrada", ATIVO: "Ativo", PAUSADO: "Pausado", CANCELADO: "Cancelado", CONFIRMADA: "Confirmada", ESTORNADA: "Estornada", FALHOU: "Falhou" };
    return labels[String(value || "").toUpperCase()] || value || "—";
  }
  function formatDonationStatus(value) { return String(value || "").toUpperCase() === "PENDENTE" ? "Aguardando pagamento" : formatStatus(value); }
  function statusClass(value) {
    var state = String(value || "").toUpperCase();
    if (["APROVADA", "ATIVO", "CONFIRMADA", "PAGO"].indexOf(state) >= 0) return "selo-ok";
    if (["PENDENTE", "PAUSADO"].indexOf(state) >= 0) return "selo-pendente";
    if (["RECUSADA", "REJEITADA", "CANCELADO", "ENCERRADA", "ESTORNADA", "FALHOU"].indexOf(state) >= 0) return "selo-falha";
    return "selo-neutro";
  }
  function tableBody(id) {
    var table = byId(id);
    return table ? table.querySelector("tbody") : null;
  }
  function requireToken() {
    if (api.token()) return true;
    location.replace("/gestao");
    return false;
  }
  function getProjects() {
    if (!projectsPromise) projectsPromise = api.request("/projetos", { public: true }).catch(function (error) {
      projectsPromise = null;
      throw error;
    });
    return projectsPromise;
  }
  function selectedProjectId(selectId, labelHint) {
    var selected = byId(selectId);
    if (!selected || !selected.value) return null;
    if (/^[a-f\d]{24}$/i.test(selected.value)) return selected.value;
    var option = selected.options[selected.selectedIndex];
    var projects = window.ONG_PROJECTS || [];
    var match = matchProject(projects, option ? option.textContent : labelHint, false);
    return match ? match.id : null;
  }
  function matchProject(projects, hint, firstIfNoMatch) {
    if (!projects || !projects.length) return null;
    var normalize = function (text) { return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
    var wanted = normalize(hint);
    if (wanted) {
      var exact = projects.find(function (project) {
        var name = normalize(project.nome);
        return name.indexOf(wanted) >= 0 || wanted.indexOf(name) >= 0;
      });
      if (exact) return exact;
      if (wanted.indexOf("refor") >= 0 || wanted.indexOf("estud") >= 0) {
        var education = projects.find(function (project) { return /estud|refor/i.test(project.nome); });
        if (education) return education;
      }
      if (wanted.indexOf("feir") >= 0) {
        var fair = projects.find(function (project) { return /feir/i.test(project.nome); });
        if (fair) return fair;
      }
    }
    return firstIfNoMatch === false ? null : projects[0];
  }
  function setProjectOptions(select, projects) {
    if (!select) return;
    var current = select.value;
    var previousOption = select.options[select.selectedIndex];
    var previousProject = previousOption ? matchProject(projects, previousOption.textContent, false) : null;
    select.innerHTML = '<option value="">Onde for mais necessário</option>' + (projects || []).map(function (project) {
      return '<option value="' + escapeHtml(project.id) + '">' + escapeHtml(project.nome) + '</option>';
    }).join("");
    if (current && /^[a-f\d]{24}$/i.test(current)) select.value = current;
    else if (previousProject) select.value = previousProject.id;
  }
  function setFilter(tableId, name, statusKey, searchId, searchKey, countId, singular, plural) {
    var table = byId(tableId);
    if (!table) return;
    function apply() {
      var selected = document.querySelector('input[name="' + name + '"]:checked');
      var filter = selected ? selected.value : "todas";
      var term = (byId(searchId) ? byId(searchId).value : "").trim().toLocaleLowerCase("pt-BR");
      var rows = table.querySelectorAll("tbody tr");
      var visible = 0;
      Array.prototype.forEach.call(rows, function (row) {
        var state = row.dataset[statusKey] || "";
        var text = row.dataset[searchKey] || row.textContent.toLocaleLowerCase("pt-BR");
        var stateMatch = filter === "todas" || filter === "todos" || filter === "outras" && ["recusada", "rejeitada", "cancelado", "falhou", "encerrada"].indexOf(state) >= 0 || filter === "pago" && state === "pago" || filter === "aguardando" && (state === "pendente" || state === "aguardando") || filter === state;
        var show = stateMatch && (!term || text.indexOf(term) >= 0);
        row.hidden = !show;
        if (show) visible++;
      });
      var empty = byId("sol-vazio") || byId("vol-vazio") || byId("lista-vazia") || byId("crianca-vazio");
      if (empty) empty.hidden = visible > 0;
      var count = countId && byId(countId);
      if (count) count.textContent = visible + (visible === 1 ? singular : plural);
    }
    Array.prototype.forEach.call(document.querySelectorAll('input[name="' + name + '"]'), function (input) {
      input.addEventListener("change", apply);
    });
    var search = byId(searchId);
    if (search) search.addEventListener("input", apply);
    apply();
  }

  function onLoginOrSignup() {
    bindSubmit("form-login", async function () {
      status("login", "Entrando...");
      var result = await api.request("/auth/login", { method: "POST", public: true, body: { email: value("email"), senha: value("senha") } });
      api.salvarSessao(result, !!(byId("lembrar") && byId("lembrar").checked));
      location.href = result.usuario && result.usuario.tipo === "ADMIN" ? "admin.html" : "conta.html";
    });

    bindSubmit("form-cadastro", async function () {
      var password = value("senha");
      if (password.length < 8) { status("cadastro", "A senha deve ter no mínimo 8 caracteres.", true); return; }
      if (password !== value("confirmar")) { status("cadastro", "As senhas não conferem.", true); return; }
      if (byId("cpf") && !/^\d{11}$/.test(value("cpf").replace(/\D/g, ""))) {
        status("cadastro", "Informe um CPF com 11 números.", true);
        return;
      }
      status("cadastro", "Criando sua conta...");
      var result = await api.request("/auth/cadastro", { method: "POST", public: true, body: {
        nome: value("nome"), email: value("email"), telefone: value("telefone"),
        cpfCnpj: value("cpf").replace(/\D/g, "") || null, senha: password
      } });
      api.salvarSessao(result, false);
      location.href = "conta.html";
    });
  }

  function showInvalidResetLink() {
    var form = byId("estado-formulario");
    var invalid = byId("estado-invalido");
    if (form) form.hidden = true;
    if (invalid) invalid.hidden = false;
  }

  function onPasswordRecovery() {
    bindSubmit("form-esqueci", async function () {
      status("esqueci", "Enviando link de recuperação...");
      var response = await api.request("/auth/esqueci-senha", {
        method: "POST", public: true, body: { email: value("email") }
      });
      status("esqueci", response.mensagem || "Se existir uma conta com esse e-mail, o link será enviado.");
      document.querySelectorAll(".nota-dev").forEach(function (notice) { notice.hidden = true; });
    }, "status-esqueci");

    bindSubmit("form-redefinir", async function () {
      var token = new URLSearchParams(location.search).get("token");
      if (!token) { showInvalidResetLink(); return; }
      var password = value("senha");
      if (password.length < 8) { status("redefinir", "A senha deve ter no mínimo 8 caracteres.", true); return; }
      if (password !== value("confirmar")) { status("redefinir", "As senhas não conferem.", true); return; }

      try {
        var response = await api.request("/auth/redefinir-senha", {
          method: "POST", public: true, body: { token: token, senha: password }
        });
        api.limparSessao();
        history.replaceState(null, "", location.pathname);
        status("redefinir", response.mensagem || "Senha redefinida. Entre novamente com a senha nova.");
        document.querySelectorAll(".nota-dev").forEach(function (notice) { notice.hidden = true; });
      } catch (error) {
        if (error.message === "Link de recuperação inválido ou expirado") {
          showInvalidResetLink();
          return;
        }
        throw error;
      }
    }, "status-redefinir");

    if (byId("form-redefinir") && !new URLSearchParams(location.search).get("token")) {
      showInvalidResetLink();
    }
  }

  function onSolicitation() {
    bindSubmit("form-solicitacao", async function () {
      status("solicitacao", "Enviando solicitação...");
      var name = value("resp-nome");
      var phone = value("resp-telefone");
      var accepted = !!(byId("aceite-lgpd") && byId("aceite-lgpd").checked && byId("declaro") && byId("declaro").checked);
      var result = await api.request("/solicitacoes", { method: "POST", public: true, body: {
        motivo: value("motivo"),
        solicitante: { nome: name, telefone: phone },
        beneficiario: { nome: value("crianca-nome"), dataNascimento: value("crianca-nascimento"), genero: "Não informado" },
        responsavel: { nome: name, email: value("resp-email") || null, telefone: phone, parentesco: value("resp-parentesco") },
        consentimento: { aceito: accepted }
      } });
      status("solicitacao", "Solicitação enviada. Protocolo: " + result.id + ". A equipe entrará em contato pelo telefone informado.");
    });
  }

  async function fillProfile() {
    if (!requireToken()) return;
    var cachedUser = api.usuario();
    if (cachedUser && cachedUser.tipo === "ADMIN") { location.replace("admin.html"); return; }
    try {
      profile = await api.request("/me");
      var greeting = byId("nome-saudacao");
      if (greeting) greeting.textContent = (profile.nome || "").trim().split(/\s+/)[0] || "você";
      ["nome", "email", "telefone"].forEach(function (key) { if (byId(key)) byId(key).value = profile[key] || ""; });
      if (byId("cpf")) byId("cpf").value = maskCpf(profile.cpfCnpj);
      if (byId("doador-nome")) byId("doador-nome").value = profile.nome || "";
      if (byId("doador-cpf")) byId("doador-cpf").value = maskCpf(profile.cpfCnpj);
      document.querySelectorAll(".nota-dev").forEach(function (notice) { notice.hidden = true; });
    } catch (error) {
      if (!api.token()) location.replace("/gestao");
      else status("perfil", error.message, true);
    }
  }
  function maskCpf(cpf) {
    var digits = String(cpf || "").replace(/\D/g, "");
    return digits.length === 11 ? digits.slice(0, 3) + ".***.***-" + digits.slice(-2) : "";
  }
  function onProfile() {
    bindSubmit("form-perfil", async function () {
      if (!profile) await fillProfile();
      var updated = await api.request("/me", { method: "PUT", body: {
        nome: value("nome"), email: value("email"), telefone: value("telefone"), cpfCnpj: profile ? profile.cpfCnpj : null
      } });
      profile = updated;
      status("perfil", "Seus dados foram atualizados.");
    });
    bindSubmit("form-senha", async function () {
      var novaSenha = value("senha");
      if (novaSenha.length < 8) throw new Error("A senha deve ter no mínimo 8 caracteres.");
      if (novaSenha !== value("confirmar")) throw new Error("As senhas não conferem.");
      var response = await api.request("/auth/alterar-senha", { method: "PUT", body: {
        senhaAtual: value("atual"), novaSenha: novaSenha
      } });
      api.limparSessao();
      status("senha", response.mensagem || "Senha alterada. Entre novamente com a nova senha.");
      window.setTimeout(function () { location.replace("/gestao"); }, 1200);
    });
  }

  async function prepareDonation() {
    if (!requireToken()) return;
    try {
      profile = await api.request("/me");
      if (byId("doador-nome")) byId("doador-nome").value = profile.nome || "";
      if (byId("doador-cpf")) byId("doador-cpf").value = maskCpf(profile.cpfCnpj);
      var projects = await getProjects();
      window.ONG_PROJECTS = projects;
      setProjectOptions(byId("destino"), projects);
    } catch (error) { status("doacao", error.message, true); }
  }
  function onDonation() {
    bindSubmit("form-doacao", async function (form) {
      var chosen = form.querySelector('input[name="valor"]:checked');
      var amount;
      if (!chosen) { status("doacao", "Escolha o valor da doação.", true); return; }
      if (chosen.value === "outro") amount = Number(value("valor-outro").replace(/\./g, "").replace(",", "."));
      else amount = Number(chosen.value);
      if (!Number.isFinite(amount) || amount <= 0) { status("doacao", "Informe um valor maior que zero.", true); return; }
      var projectId = selectedProjectId("destino");
      var checkout;
      var publicDonor = byId("doador-email");
      if (publicDonor) {
        checkout = await api.request("/doacoes/publico", { method: "POST", public: true, body: {
          projetoId: projectId, valor: amount, nome: value("doador-nome"), email: value("doador-email")
        } });
        if (!checkout.checkoutUrl) throw new Error("O Mercado Pago não retornou o endereço de pagamento.");
        location.assign(checkout.checkoutUrl);
        return;
      }
      if (form.querySelector('input[name="frequencia"]:checked').value === "mensal") {
        checkout = await api.request("/planos", { method: "POST", body: {
          projetoId: projectId, valorMensal: amount, diaCobranca: Math.min(28, new Date().getDate())
        } });
      } else {
        checkout = await api.request("/doacoes", { method: "POST", body: { projetoId: projectId, valor: amount } });
      }
      if (!checkout.checkoutUrl) throw new Error("O Mercado Pago não retornou o endereço de pagamento.");
      location.assign(checkout.checkoutUrl);
    });
  }

  function volunteerObservation(form) {
    var areas = checkedValues("area", form);
    var availability = checkedValues("disponibilidade", form);
    var note = value("mensagem");
    return [areas.length ? "Áreas de interesse: " + areas.join(", ") : "", availability.length ? "Disponibilidade: " + availability.join(", ") : "", note ? "Sobre a pessoa: " + note : ""].filter(Boolean).join(". ").slice(0, 1000);
  }
  async function loadMyVolunteering() {
    if (!requireToken()) return;
    try {
      var applications = await api.request("/voluntarios/minhas");
      currentVolunteer = applications && applications.length ? applications[applications.length - 1] : null;
      if (!currentVolunteer) {
        ["estado-formulario", "estado-analise", "estado-aprovada"].forEach(function (id) { if (byId(id)) byId(id).hidden = id !== "estado-formulario"; });
        return;
      }
      var isApproved = currentVolunteer.status === "APROVADA";
      var isPending = currentVolunteer.status === "PENDENTE";
      ["estado-formulario", "estado-analise", "estado-aprovada"].forEach(function (id) {
        if (byId(id)) byId(id).hidden = id !== (isApproved ? "estado-aprovada" : isPending ? "estado-analise" : "estado-formulario");
      });
      if (!isApproved && !isPending) status("voluntario", "Sua candidatura anterior foi " + formatStatus(currentVolunteer.status).toLowerCase() + ". Você pode enviar uma nova.");
      if (currentVolunteer.observacao) {
        var detail = byId("estado-analise");
        if (detail) {
          var description = detail.querySelector(".ajuda");
          if (description) description.textContent = currentVolunteer.observacao;
        }
      }
    } catch (error) { status("voluntario", error.message, true); }
  }
  function onVolunteer() {
    var publicForm = byId("form-voluntario-publico");
    if (publicForm) {
      getProjects().then(function (projects) { setProjectOptions(byId("vol-projeto"), projects); }).catch(function () {});
      publicForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        var statusEl = byId("status-voluntario-publico");
        if (!byId("vol-aceite").checked) { statusEl.textContent = "Autorize o uso dos dados para enviar a candidatura."; return; }
        statusEl.textContent = "Enviando candidatura…";
        try {
          await api.request("/voluntarios/publico", { method: "POST", public: true, body: {
            projetoId: value("vol-projeto") || null, nome: value("vol-nome"), email: value("vol-email"),
            telefone: value("vol-telefone"), observacao: value("vol-mensagem")
          } });
          statusEl.textContent = "Candidatura enviada. A equipe entrará em contato pelos dados informados.";
          publicForm.reset();
        } catch (error) { statusEl.textContent = error.message; }
      });
    }
    bindSubmit("form-voluntario", async function (form) {
      if (!requireToken()) return;
      var areas = checkedValues("area", form);
      var availability = checkedValues("disponibilidade", form);
      if (!areas.length || !availability.length || !byId("aceite-vol").checked) {
        status("voluntario", "Selecione ao menos uma área, uma disponibilidade e aceite o uso dos dados.", true);
        return;
      }
      var projects = await getProjects();
      if (!projects.length) { status("voluntario", "Ainda não há projetos ativos para receber candidaturas.", true); return; }
      var hint = areas[0] === "reforco" ? "Estudando para o Amanhã" : areas[0] === "oficinas" ? "oficina" : areas[0] === "esporte" ? "esporte" : "evento";
      var project = matchProject(projects, hint);
      await api.request("/voluntarios", { method: "POST", body: { projetoId: project.id, observacao: volunteerObservation(form) } });
      status("voluntario", "Candidatura registrada para o projeto " + project.nome + ". Acompanhe o andamento nesta página.");
      await loadMyVolunteering();
    });
    var withdraw = byId("retirar-candidatura");
    if (withdraw) withdraw.addEventListener("click", async function (event) {
      event.stopImmediatePropagation();
      if (!currentVolunteer || !window.confirm("Encerrar sua candidatura?")) return;
      try {
        await api.request("/voluntarios/" + encodeURIComponent(currentVolunteer.id) + "/encerrar", { method: "PUT" });
        status("retirar", "Candidatura encerrada.");
        await loadMyVolunteering();
      } catch (error) { showError("status-retirar", error); }
    }, true);
  }

  async function loadDonations() {
    if (!requireToken()) return;
    try {
      var pair = await Promise.all([api.request("/doacoes/minhas"), api.request("/planos/meus")]);
      var donations = pair[0] || [];
      var plans = pair[1] || [];
      var active = plans.find(function (plan) { return plan.status === "ATIVO" || plan.status === "PAUSADO" || plan.status === "PENDENTE"; });
      donationPlanId = active ? active.id : null;
      var planCard = document.querySelector("#cancelar-assinatura") && document.querySelector("#cancelar-assinatura").closest(".form-card");
      if (planCard) {
        var summary = planCard.querySelector(".resumo");
        if (summary) summary.innerHTML = active
          ? "<div><dt>Valor</dt><dd>" + escapeHtml(formatCurrency(active.valorMensal)) + " por mês</dd></div><div><dt>Dia da cobrança</dt><dd>Dia " + escapeHtml(active.diaCobranca) + "</dd></div><div><dt>Situação</dt><dd><span class=\"selo " + statusClass(active.status) + "\">" + escapeHtml(formatDonationStatus(active.status)) + "</span></dd></div>"
          : "<div><dt>Situação</dt><dd>Você ainda não tem um plano mensal.</dd></div>";
        var cancel = byId("cancelar-assinatura");
        if (cancel) cancel.hidden = !active || active.status === "CANCELADO";
      }
      var body = tableBody("tabela-doacoes");
      if (body) body.innerHTML = donations.map(function (donation) {
        var state = String(donation.status || "").toLowerCase();
        var destination = donation.tipo === "MENSAL" ? "Doação mensal" : donation.projetoId || "Onde for mais necessário";
        return "<tr data-situacao=\"" + escapeHtml(["pago", "confirmada"].indexOf(state) >= 0 ? "pago" : state === "pendente" ? "aguardando" : "outras") + "\"><th scope=\"row\">" + escapeHtml(formatDate(donation.data)) + "</th><td>" + escapeHtml(formatCurrency(donation.valor)) + "</td><td>" + escapeHtml(destination) + "</td><td><span class=\"selo " + statusClass(donation.status) + "\">" + escapeHtml(formatDonationStatus(donation.status)) + "</span></td><td><span class=\"muted\">—</span></td></tr>";
      }).join("");
      setFilter("tabela-doacoes", "filtro", "situacao", "", "");
      var countBlocks = document.querySelectorAll(".numeros-conta .numero .stat-num");
      if (countBlocks.length >= 3) {
        var paid = donations.filter(function (item) { return item.status === "PAGO" || item.status === "CONFIRMADA"; });
        countBlocks[0].textContent = formatCurrency(paid.reduce(function (sum, item) { return sum + Number(item.valor || 0); }, 0));
        countBlocks[1].textContent = String(paid.length);
        countBlocks[2].textContent = String(plans.filter(function (plan) { return plan.status === "ATIVO"; }).length);
      }
      document.querySelectorAll(".nota-dev").forEach(function (notice) { notice.hidden = true; });
    } catch (error) { status("assinatura", error.message, true); }
  }
  function onDonationHistory() {
    var cancel = byId("cancelar-assinatura");
    if (cancel) cancel.addEventListener("click", async function (event) {
      event.stopImmediatePropagation();
      if (!donationPlanId || !window.confirm("Cancelar o plano mensal?")) return;
      try {
        await api.request("/planos/" + encodeURIComponent(donationPlanId) + "/cancelar", { method: "PUT" });
        status("assinatura", "Plano mensal cancelado.");
        location.reload();
      } catch (error) { showError("status-assinatura", error); }
    }, true);
  }

  function mapAdminApplicant(item, users, projects) {
    var user = users.find(function (entry) { return entry.id === item.usuarioId; }) || {};
    user = Object.assign({}, user, { nome: user.nome || item.nomeContato, email: user.email || item.emailContato, telefone: user.telefone || item.telefoneContato });
    var project = projects.find(function (entry) { return entry.id === item.projetoId; }) || {};
    return { user: user, project: project };
  }
  function rowHtml(cells) { return "<tr>" + cells.map(function (cell) { return "<td>" + escapeHtml(cell) + "</td>"; }).join("") + "</tr>"; }

  async function authorizeAdmin() {
    if (!requireToken()) return null;
    try {
      var users = await api.request("/adm/usuarios");
      var current = api.usuario();
      var self = current && users.find(function (user) { return user.id === current.id; });
      if (!self || self.tipo !== "ADMIN" || !self.ativo) throw new Error("Esta área é restrita a administradores ativos.");
      document.querySelectorAll(".admin-nome").forEach(function (element) { element.textContent = self.nome; });
      return users;
    } catch (error) {
      if (!api.token()) location.replace("/gestao");
      else location.replace("index.html?acesso=negado");
      return null;
    }
  }

  async function loadAdminDashboard(users) {
    var results=await Promise.all([api.request("/adm/doacoes"),api.request("/adm/planos"),api.request("/adm/solicitacoes"),api.request("/adm/voluntarios"),api.request("/adm/beneficiarios"),api.request("/adm/projetos")]);
    var donations=results[0],plans=results[1],requests=results[2],volunteers=results[3],beneficiaries=results[4],projects=results[5];
    var now=new Date(), today=dateParts(now), monthKey=today.key, monthDonations=donations.filter(function(d){var p=dateParts(d.data);return p&&p.key===monthKey;}),paid=monthDonations.filter(isDonationPaid),pending=monthDonations.filter(function(d){return String(d.status).toUpperCase()==="PENDENTE";});
    var solicitPend=requests.filter(function(x){return x.status==="PENDENTE";}).length,volPend=volunteers.filter(function(x){return x.status==="PENDENTE";}).length,benefActive=beneficiaries.filter(function(x){return x.ativo;}).length,volActive=volunteers.filter(function(x){return x.status==="APROVADA";}).length;
    var put=function(id,text){if(byId(id))byId(id).textContent=text;};
    put("dashboard-sauda","Resumo atualizado em "+new Intl.DateTimeFormat("pt-BR",{dateStyle:"long",timeZone:"America/Sao_Paulo"}).format(now)+".");
    put("dashboard-periodo",""+monthLabel(today.year,today.month,false).replace(/^./,function(c){return c.toUpperCase();})+" "+today.year+" até agora");
    put("dashboard-solicitacoes-pendentes",String(solicitPend));put("dashboard-voluntarios-pendentes",String(volPend));
    put("dashboard-beneficiarios-ativos",String(benefActive));put("dashboard-recebido",formatCurrency(paid.reduce(function(a,d){return a+Number(d.valor||0);},0)));
    put("dashboard-doacoes-pagas",String(paid.length));put("dashboard-pendente",formatCurrency(pending.reduce(function(a,d){return a+Number(d.valor||0);},0)));
    put("dashboard-planos-ativos",String(plans.filter(function(x){return x.status==="ATIVO";}).length));put("dashboard-beneficiarios",String(benefActive));
    put("dashboard-voluntarios-ativos",String(volActive));put("dashboard-contas",String(users.filter(function(u){return u.tipo==="COMUM"&&u.ativo;}).length));
    var responsibleKeys=new Set();beneficiaries.forEach(function(b){var r=b.responsavel||{},key=(r.email||r.telefone||r.nome||"").toLocaleLowerCase("pt-BR");if(key)responsibleKeys.add(key);});
    requests.forEach(function(x){var r=x.responsavel||{},key=(r.email||r.telefone||r.nome||"").toLocaleLowerCase("pt-BR");if(key)responsibleKeys.add(key);});put("dashboard-responsaveis",String(responsibleKeys.size));
    put("dashboard-projetos-resumo",projects.filter(function(x){return x.ativo;}).length+" ativos de "+projects.length+" cadastrados.");
    var buckets=[],map=new Map(),start=new Date(now.getFullYear(),now.getMonth()-5,1);
    for(var i=0;i<6;i++){var dt=new Date(start.getFullYear(),start.getMonth()+i,1),y=dt.getFullYear(),m=dt.getMonth()+1,k=y+"-"+String(m).padStart(2,"0"),b={label:monthLabel(y,m,true)+" "+y,total:0};buckets.push(b);map.set(k,b);}
    donations.filter(isDonationPaid).forEach(function(d){var p=dateParts(d.data),b=p&&map.get(p.key);if(b)b.total+=Number(d.valor||0);});
    renderDonationBars(byId("grafico-dashboard"),buckets,"Doações confirmadas nos últimos seis meses");
    var note=byId("grafico-dashboard-nota");if(note)note.textContent="Valores de doações confirmadas no banco de dados; PIX direto deve ser registrado no painel.";
    var monthTable=byId("dashboard-tabela-meses");if(monthTable)monthTable.innerHTML=buckets.map(function(b){return "<tr><th scope=\"row\">"+escapeHtml(b.label)+"</th><td>"+escapeHtml(formatCurrency(b.total))+"</td></tr>";}).join("");
    var latest=donations.slice().sort(function(a,b){return new Date(b.data||0)-new Date(a.data||0);}).slice(0,5),latestBody=byId("tabela-ultimas-doacoes");
    if(latestBody)latestBody.innerHTML=latest.length?latest.map(function(d){var source=d.origem==="PIX_MANUAL"?"PIX · Registro manual":"Mercado Pago · "+String(d.tipo||"ÚNICA").toLowerCase();return "<tr><th scope=\"row\">"+escapeHtml(formatDate(d.data))+"</th><td>"+escapeHtml(d.doadorNome||"Doador sem identificação")+"</td><td>"+escapeHtml(formatCurrency(d.valor))+"</td><td>"+escapeHtml(source)+"</td><td><span class=\"selo "+statusClass(d.status)+"\">"+escapeHtml(formatDonationStatus(d.status))+"</span></td></tr>";}).join(""):"<tr><td colspan=\"5\">Ainda não há doações registradas.</td></tr>";
    document.querySelectorAll(".nota-dev").forEach(function(n){n.hidden=true;});
  }

  async function loadAdminSolicitations() {
    var items = await api.request("/adm/solicitacoes");
    var body = tableBody("tabela-solicitacoes");
    var currentYear = dateParts(new Date()).year;
    var byStateYear = function (state) { return items.filter(function (item) {
      var analyzed = item.analise && dateParts(item.analise.data);
      return item.status === state && analyzed && analyzed.year === currentYear;
    }).length; };
    var pending = items.filter(function (item) { return item.status === "PENDENTE"; });
    var waitDays = pending.map(function (item) { var p = dateParts(item.dataSolicitacao); return p ? Math.max(0, Math.floor((Date.now() - new Date(item.dataSolicitacao).getTime()) / 86400000)) : null; }).filter(function (days) { return days !== null; });
    var stats = { "solicitacoes-pendentes": pending.length, "solicitacoes-aprovadas-ano": byStateYear("APROVADA"), "solicitacoes-recusadas-ano": byStateYear("RECUSADA"),
      "solicitacoes-espera-media": waitDays.length ? (waitDays.reduce(function (sum, days) { return sum + days; }, 0) / waitDays.length).toFixed(1) : "0" };
    Object.keys(stats).forEach(function (id) { if (byId(id)) byId(id).textContent = String(stats[id]); });
    if (!body) return;
    body.innerHTML = items.map(function (item) {
      var child = item.beneficiario || {}, responsible = item.responsavel || {};
      var date = formatDate(item.dataSolicitacao);
      var age = child.dataNascimento ? Math.max(0, new Date().getFullYear() - Number(String(child.dataNascimento).slice(0, 4))) + " anos" : "—";
      var row = document.createElement("tr");
      row.dataset.id = item.id;
      row.dataset.status = String(item.status || "").toLowerCase();
      row.dataset.search = (child.nome + " " + responsible.nome).toLocaleLowerCase("pt-BR");
      row.innerHTML = "<th scope=\"row\">" + escapeHtml(date) + "</th><td>" + escapeHtml(child.nome) + "</td><td>" + escapeHtml(age) + "</td><td>" + escapeHtml(responsible.nome) + "</td><td><span class=\"selo " + statusClass(item.status) + "\">" + escapeHtml(formatStatus(item.status)) + "</span></td><td><button class=\"btn-link api-view-solicitacao\" type=\"button\">" + (item.status === "PENDENTE" ? "Analisar" : "Ver") + "</button></td>";
      return row.outerHTML;
    }).join("");
    document.querySelectorAll('input[name="filtro-sol"]').forEach(function (radio) {
      if (radio.value === "reprovada") radio.value = "recusada";
    });
    setFilter("tabela-solicitacoes", "filtro-sol", "status", "busca-sol", "search", "contagem-sol", " solicitação", " solicitações");
    document.querySelectorAll(".nota-dev").forEach(function (notice) { notice.hidden = true; });
    var table = byId("tabela-solicitacoes");
    table.addEventListener("click", function (event) {
      var button = event.target.closest(".api-view-solicitacao");
      if (!button) return;
      event.preventDefault(); event.stopImmediatePropagation();
      var row = button.closest("tr"); selectedSolicitationId = row.dataset.id;
      var item = items.find(function (candidate) { return candidate.id === selectedSolicitationId; });
      var child = item.beneficiario || {}, responsible = item.responsavel || {};
      var set = function (id, v) { if (byId(id)) byId(id).textContent = v || "—"; };
      set("sol-titulo", child.nome || "Solicitação"); set("s-recebida", formatDate(item.dataSolicitacao));
      set("s-crianca", child.nome); set("s-nascimento", formatDate(child.dataNascimento)); set("s-escola", "Não informado no formulário");
      set("s-responsavel", (responsible.nome || "") + (responsible.parentesco ? " (" + responsible.parentesco + ")" : ""));
      set("s-contato", responsible.telefone); set("s-bairro", "Não informado no formulário");
      set("s-estado", formatStatus(item.status)); set("s-motivo", item.motivo);
      if (byId("acoes-analise")) byId("acoes-analise").hidden = item.status !== "PENDENTE";
      if (byId("campo-analise")) byId("campo-analise").hidden = item.status !== "PENDENTE";
      byId("detalhe-solicitacao").hidden = false;
      byId("detalhe-solicitacao").focus();
    }, true);
    var approve = byId("aprovar-sol");
    if (approve) approve.addEventListener("click", async function (event) {
      event.stopImmediatePropagation();
      if (!selectedSolicitationId || !window.confirm("Aprovar e cadastrar esta solicitação?")) return;
      try { await api.request("/adm/solicitacoes/" + selectedSolicitationId + "/aprovar", { method: "PUT" }); status("sol", "Solicitação aprovada e beneficiário cadastrado."); location.reload(); }
      catch (error) { showError("status-sol", error); }
    }, true);
    var reject = byId("reprovar-sol");
    if (reject) reject.addEventListener("click", async function (event) {
      event.stopImmediatePropagation();
      var reason = value("observacao");
      if (!reason || !selectedSolicitationId) { status("sol", "Informe o motivo da recusa.", true); return; }
      try { await api.request("/adm/solicitacoes/" + selectedSolicitationId + "/recusar", { method: "PUT", body: { justificativaRecusa: reason } }); status("sol", "Solicitação recusada."); location.reload(); }
      catch (error) { showError("status-sol", error); }
    }, true);
  }

  async function loadAdminVolunteers(users, projects) {
    var results = await Promise.all([api.request("/adm/voluntarios"), api.request("/adm/doacoes")]);
    var items = results[0], donations = results[1], body = tableBody("tabela-voluntarios");
    var count = function (state) { return items.filter(function (item) { return item.status === state; }).length; };
    [ ["voluntarios-pendentes","PENDENTE"], ["voluntarios-aprovados","APROVADA"], ["voluntarios-recusados","RECUSADA"], ["voluntarios-encerrados","ENCERRADA"] ].forEach(function (pair) { if (byId(pair[0])) byId(pair[0]).textContent = String(count(pair[1])); });
    if (!body) return;
    body.innerHTML = items.map(function (item) {
      var details = mapAdminApplicant(item, users, projects);
      var row = document.createElement("tr");
      row.dataset.id = item.id; row.dataset.status = String(item.status || "").toLowerCase();
      row.dataset.search = [details.user.nome, details.user.email, details.project.nome, item.observacao].join(" ").toLocaleLowerCase("pt-BR");
      row.innerHTML = "<th scope=\"row\">" + escapeHtml(formatDate(item.dataInscricao)) + "</th><td>" + escapeHtml(details.user.nome || details.user.email || "Usuário") + "</td><td>" + escapeHtml(details.project.nome || "Projeto") + "</td><td>" + escapeHtml(item.observacao || "—") + "</td><td><span class=\"selo " + statusClass(item.status) + "\">" + escapeHtml(formatStatus(item.status)) + "</span></td><td><button class=\"btn-link api-view-voluntario\" type=\"button\">" + (item.status === "PENDENTE" ? "Analisar" : "Ver") + "</button></td>";
      return row.outerHTML;
    }).join("");
    setFilter("tabela-voluntarios", "filtro-vol", "status", "busca-vol", "search", "contagem-vol", " candidatura", " candidaturas");
    document.querySelectorAll(".nota-dev").forEach(function (notice) { notice.hidden = true; });
    byId("tabela-voluntarios").addEventListener("click", function (event) {
      var button = event.target.closest(".api-view-voluntario"); if (!button) return;
      event.preventDefault(); event.stopImmediatePropagation();
      var row = button.closest("tr"); selectedVolunteerId = row.dataset.id;
      currentVolunteer = items.find(function (entry) { return entry.id === selectedVolunteerId; });
      var details = mapAdminApplicant(currentVolunteer, users, projects);
      var set = function (id, v) { if (byId(id)) byId(id).textContent = v || "—"; };
      set("vol-titulo", details.user.nome || "Candidatura"); set("v-enviada", formatDate(currentVolunteer.dataInscricao));
      set("v-contato", [details.user.email, details.user.telefone].filter(Boolean).join(" · "));
      set("v-areas", details.project.nome); set("v-disponibilidade", currentVolunteer.observacao || "Não informada");
      var donorRecords = donations.filter(function (d) { return d.doadorId === currentVolunteer.usuarioId && isDonationPaid(d); });
      set("v-doacoes", donorRecords.length + " doação(ões) concluída(s) · " + formatCurrency(donorRecords.reduce(function (sum,d) { return sum + Number(d.valor || 0); },0)));
      set("v-estado", formatStatus(currentVolunteer.status)); set("v-mensagem", currentVolunteer.observacao);
      if (byId("acoes-vol")) byId("acoes-vol").hidden = currentVolunteer.status !== "PENDENTE";
      byId("detalhe-voluntario").hidden = false;
      byId("detalhe-voluntario").focus();
    }, true);
    var approve = byId("aprovar-vol");
    if (approve) approve.addEventListener("click", async function (event) {
      event.stopImmediatePropagation(); if (!selectedVolunteerId) return;
      try { await api.request("/adm/voluntarios/" + selectedVolunteerId + "/aprovar", { method: "PUT" }); status("vol", "Candidatura aprovada."); location.reload(); }
      catch (error) { showError("status-vol", error); }
    }, true);
    var reject = byId("recusar-vol");
    if (reject) reject.addEventListener("click", async function (event) {
      event.stopImmediatePropagation(); var reason = value("obs-vol");
      if (!reason || !selectedVolunteerId) { status("vol", "Informe o motivo da recusa.", true); return; }
      try { await api.request("/adm/voluntarios/" + selectedVolunteerId + "/recusar", { method: "PUT", body: { justificativaRecusa: reason } }); status("vol", "Candidatura recusada."); location.reload(); }
      catch (error) { showError("status-vol", error); }
    }, true);
  }

  async function loadAdminProjects() {
    var items = await api.request("/adm/projetos");
    var body = tableBody("tabela-projetos");
    if (!body) return;
    function render() {
      body.innerHTML = items.map(function (item, index) {
        var state = item.ativo ? "Ativo" : "Oculto";
        var action = item.ativo ? "Desativar" : "Publicar";
        return "<tr data-id=\"" + escapeHtml(item.id) + "\"><th scope=\"row\">" + (index + 1) + "</th><td>" + escapeHtml(item.nome) + "</td><td>" + escapeHtml(item.categoria || "—") + "</td><td><span class=\"selo " + (item.ativo ? "selo-ok" : "selo-neutro") + "\">" + state + "</span></td><td class=\"acoes-celula\"><a href=\"projeto.html?slug=" + encodeURIComponent(item.slug || item.id) + "\" target=\"_blank\" rel=\"noopener\">Ver</a> <button class=\"btn-link api-edit-project\" type=\"button\">Editar</button> <button class=\"btn-link api-toggle-project\" type=\"button\">" + action + "</button></td></tr>";
      }).join("");
    }
    render();
    document.querySelectorAll(".nota-dev").forEach(function (notice) { notice.hidden = true; });
    bindSubmit("form-editor-projeto", async function () {
      var bodyData = {
        nome: value("p-titulo"), categoria: value("p-tipo"), ordem: Number(value("p-ordem") || 99),
        resumo: value("p-resumo"), descricao: value("p-descricao"), imagemAlt: value("p-alt"),
        ativo: byId("p-ativo").checked
      };
      var file = byId("p-foto") && byId("p-foto").files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 2 MB.");
        bodyData.imagemUrl = await new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onload = function () {
            var image = new Image();
            image.onload = function () {
              var scale = Math.min(1, 1000 / image.width);
              var canvas = document.createElement("canvas"); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
              canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL("image/jpeg", 0.82));
            };
            image.onerror = reject; image.src = reader.result;
          };
          reader.onerror = reject; reader.readAsDataURL(file);
        });
      }
      await api.request(editingProjectId ? "/adm/projetos/" + editingProjectId : "/adm/projetos", {
        method: editingProjectId ? "PUT" : "POST", body: bodyData
      });
      status("projeto", "Projeto salvo e publicado na listagem do site.");
      location.reload();
    }, "status-projeto");
    var table = byId("tabela-projetos");
    table.addEventListener("click", async function (event) {
      var edit = event.target.closest(".api-edit-project");
      var toggle = event.target.closest(".api-toggle-project");
      if (!edit && !toggle) return;
      event.preventDefault(); event.stopImmediatePropagation();
      var row = event.target.closest("tr"); var item = items.find(function (project) { return project.id === row.dataset.id; });
      if (edit) {
        editingProjectId = item.id;
        byId("p-titulo").value = item.nome || ""; byId("p-tipo").value = item.categoria || "";
        byId("p-ordem").value = item.ordem || 1; byId("p-resumo").value = item.resumo || "";
        byId("p-descricao").value = item.descricao || ""; byId("p-alt").value = item.imagemAlt || "";
        byId("p-ativo").checked = item.ativo; byId("p-foto").value = "";
        byId("titulo-editor").textContent = "Editar projeto"; byId("form-projeto").hidden = false;
        byId("p-titulo").focus();
      } else {
        try {
          await api.request("/adm/projetos/" + item.id, { method: "PUT", body: { ativo: !item.ativo } });
          status("lista-projeto", item.ativo ? "Projeto retirado do site." : "Projeto publicado."); location.reload();
        } catch (error) { showError("status-lista-projeto", error); }
      }
    }, true);
  }

  async function loadAdminDonations() {
    var [donations, plans, projects] = await Promise.all([api.request("/adm/doacoes"), api.request("/adm/planos"), api.request("/adm/projetos")]);
    var table=byId("tabela-admin-doacoes"), body=tableBody("tabela-admin-doacoes"), years=Array.from(new Set(donations.map(function(d){var p=dateParts(d.data);return p&&p.year;}).filter(Boolean))).sort();
    var year=byId("filtro-doacoes-ano"), month=byId("filtro-doacoes-mes"), projectMap=new Map(projects.map(function(p){return[p.id,p];}));
    if(year){year.innerHTML='<option value="">Todos os anos</option>'+years.map(function(y){return '<option value="'+y+'">'+y+'</option>';}).join("");if(years.length&&!new URLSearchParams(location.search).get("doadorId"))year.value=String(years[years.length-1]);}
    if(month)month.innerHTML='<option value="">Todos os meses</option>'+Array.from({length:12},function(_,i){return '<option value="'+(i+1)+'">'+monthLabel(2026,i+1,false)+'</option>';}).join("");
    var projectSelect=byId("manual-destino");if(projectSelect)projectSelect.innerHTML='<option value="">Onde for mais necessário</option>'+projects.map(function(p){return '<option value="'+escapeHtml(p.id)+'">'+escapeHtml(p.nome)+'</option>';}).join("");
    var dateInput=byId("manual-data");if(dateInput&&!dateInput.value)dateInput.value=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    var donorId=new URLSearchParams(location.search).get("doadorId")||"",exportRows=[];
    function filterStatus(item){var f=(document.querySelector('input[name="filtro"]:checked')||{}).value||"todas",s=String(item.status||"").toUpperCase();return f==="todas"||(f==="pago"&&isDonationPaid(item))||(f==="aguardando"&&s==="PENDENTE")||(f==="outras"&&["FALHOU","ESTORNADA","CANCELADO"].indexOf(s)>=0);}
    function inPeriod(item){var p=dateParts(item.data);return (!year||!year.value||(p&&String(p.year)===year.value))&&(!month||!month.value||(p&&String(p.month)===month.value))&&(!donorId||item.doadorId===donorId);}
    function render(){
      var term=value("busca").toLocaleLowerCase("pt-BR"), period=donations.filter(inPeriod), visible=period.filter(function(d){return filterStatus(d)&&(!term||String(d.doadorNome||"").toLocaleLowerCase("pt-BR").indexOf(term)>=0);});exportRows=visible.slice();
      if(body)body.innerHTML=visible.length?visible.slice().sort(function(a,b){return new Date(b.data||0)-new Date(a.data||0);}).map(function(d){
        var state=String(d.status||"").toLowerCase(), project=d.projetoId?(projectMap.get(d.projetoId)||{}).nome||"Projeto indisponível":"Onde for mais necessário";
        var pay={PIX:"PIX",CARTAO:"Cartão",BOLETO:"Boleto",OUTRO:"Outro"}[d.formaPagamento]||"—", source=d.origem==="PIX_MANUAL"?"PIX · Registro manual":"Mercado Pago · "+(String(d.tipo||"UNICA").toLowerCase()==="mensal"?"mensal":pay);
        return '<tr data-situacao="'+escapeHtml(state)+'" data-doador="'+escapeHtml(String(d.doadorNome||"").toLocaleLowerCase("pt-BR"))+'"><th scope="row">'+escapeHtml(formatDate(d.data))+'</th><td>'+escapeHtml(d.doadorNome||"Doador sem identificação")+'</td><td>'+escapeHtml(formatCurrency(d.valor))+'</td><td>'+escapeHtml(source)+'</td><td>'+escapeHtml(project)+'</td><td>'+escapeHtml(d.observacao||"—")+'</td><td><span class="selo '+statusClass(d.status)+'">'+escapeHtml(formatDonationStatus(d.status))+'</span></td></tr>';
      }).join(""):'<tr><td colspan="7">Nenhuma doação encontrada para este filtro.</td></tr>';
      var paid=period.filter(isDonationPaid), pending=period.filter(function(d){return String(d.status).toUpperCase()==="PENDENTE";}), put=function(id,t){if(byId(id))byId(id).textContent=t;};
      put("doacoes-total-recebido",formatCurrency(paid.reduce(function(a,d){return a+Number(d.valor||0);},0)));
      put("doacoes-total-pendente",formatCurrency(pending.reduce(function(a,d){return a+Number(d.valor||0);},0)));
      put("doacoes-total-contagem",String(period.length));put("doacoes-planos-ativos",String(plans.filter(function(p){return p.status==="ATIVO"&&(!donorId||p.doadorId===donorId);}).length));
      var count=byId("contagem-doacoes");if(count)count.textContent=visible.length+(visible.length===1?" doação":" doações");
      var empty=byId("lista-vazia");if(empty)empty.hidden=visible.length>0;
      var buckets=new Map();period.filter(filterStatus).forEach(function(d){var p=dateParts(d.data);if(!p)return;var key=p.key,label=monthLabel(p.year,p.month,true)+(year&&year.value?"":"/"+p.year);if(year&&year.value&&month&&month.value){key=p.dateKey;label=String(p.day);}if(!buckets.has(key))buckets.set(key,{label:label,total:0});buckets.get(key).total+=Number(d.valor||0);});
      var bars=Array.from(buckets.entries()).sort(function(a,b){return a[0].localeCompare(b[0]);}).map(function(e){return e[1];});
      if(year&&year.value&&month&&month.value){var y=Number(year.value),m=Number(month.value),days=new Date(y,m,0).getDate();bars=Array.from({length:days},function(_,i){var d=i+1,key=y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");return buckets.get(key)||{label:String(d),total:0};});}
      else if(year&&year.value)bars=Array.from({length:12},function(_,i){var m=i+1;return buckets.get(year.value+"-"+String(m).padStart(2,"0"))||{label:monthLabel(year.value,m,true),total:0};});
      renderDonationBars(byId("grafico-doacoes"),bars,"Valores de doações por período");
      var note=byId("grafico-doacoes-nota");if(note)note.textContent=period.length+" doação(ões) no período selecionado; o gráfico respeita o filtro de situação.";
    }
    if(table){Array.prototype.forEach.call(document.querySelectorAll('input[name="filtro"]'),function(i){i.addEventListener("change",render);});[year,month,byId("busca")].forEach(function(i){if(i)i.addEventListener(i===byId("busca")?"input":"change",render);});render();}
    var exportarPdf=byId("exportar-pdf");if(exportarPdf)exportarPdf.addEventListener("click",function(event){event.preventDefault();event.stopImmediatePropagation();imprimirTabelaPdf(table,"Relatório de doações", "status-exportar");},true);
    var form=byId("form-doacao-manual");if(form)form.addEventListener("submit",function(event){
      event.preventDefault();event.stopImmediatePropagation();if(!form.reportValidity())return;
      var raw=value("manual-valor").replace(/[^0-9,.-]/g,"");if(raw.indexOf(",")>=0)raw=raw.replace(/\./g,"").replace(",",".");var amount=Number(raw);
      if(!Number.isFinite(amount)||amount<=0){status("manual","Informe um valor maior que zero.",true);return;}
      api.request("/adm/doacoes",{method:"POST",body:{doadorNome:value("manual-doador"),valor:amount,data:value("manual-data"),projetoId:value("manual-destino")||null,observacao:value("manual-obs")||null}}).then(function(){status("manual","Doação PIX registrada no banco de dados.");location.reload();}).catch(function(error){showError("manual",error);});
    },true);
    document.querySelectorAll(".nota-dev").forEach(function(n){n.hidden=true;});
  }

  async function loadAdminUsers(users) {
    var body = tableBody("tabela-admins");
    if (!body) return;
    var admins = users.filter(function (user) { return user.tipo === "ADMIN"; });
    var actor = api.usuario() || {};
    var isPrincipal = admins.some(function (user) { return user.id === actor.id && user.principal; });
    body.innerHTML = admins.map(function (user) {
      var current = (api.usuario() || {}).id === user.id;
      return "<tr data-id=\"" + escapeHtml(user.id) + "\"><th scope=\"row\">" + escapeHtml(user.nome) + (current ? " <span class=\"selo selo-neutro\">você</span>" : "") + "</th><td>" + escapeHtml(user.email) + "</td><td>" + escapeHtml(user.cargo || "—") + "</td><td>" + (user.principal ? "ADM principal" : "Administrador") + "</td><td>—</td><td><span class=\"selo " + (user.ativo ? "selo-ok" : "selo-neutro") + "\">" + (user.ativo ? "Ativo" : "Inativo") + "</span></td><td>" + (isPrincipal && !user.principal ? "<button class=\"btn-link api-demote\" type=\"button\">Rebaixar</button>" : "—") + "</td></tr>";
    }).join("");
    var form = byId("form-novo-admin");
    var openForm = byId("abrir-admin");
    if (openForm && !isPrincipal) {
      openForm.hidden = true;
      status("lista-admin", "A criação de novos administradores é exclusiva do administrador principal.");
    }
    if (form) {
      if (!isPrincipal) form.closest("section").hidden = true;
      form.addEventListener("submit", function (event) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (!form.reportValidity()) return;
        api.request("/adm/usuarios", { method: "POST", body: {
          nome: value("a-nome"), email: value("a-email"), telefone: value("a-telefone"),
          cargo: value("a-cargo"), senha: value("a-senha")
        }}).then(function () { status("admin", "Administrador criado. Entregue a senha inicial diretamente à pessoa."); location.reload(); })
          .catch(function (error) { showError("admin", error); });
      }, true);
    }
    body.addEventListener("click", async function (event) {
      var button = event.target.closest(".api-demote"); if (!button) return;
      event.preventDefault(); event.stopImmediatePropagation();
      var row = button.closest("tr");
      if (!window.confirm("Remover o perfil de administrador desta pessoa?")) return;
      try { await api.request("/adm/usuarios/" + row.dataset.id + "/rebaixar", { method: "PUT" }); status("lista-admin", "Perfil de administrador removido."); location.reload(); }
      catch (error) { showError("status-lista-admin", error); }
    }, true);
    document.querySelectorAll(".nota-dev").forEach(function (notice) { notice.hidden = true; });
  }

  async function loadAdminBeneficiaries() {
    var [items, projects]=await Promise.all([api.request("/adm/beneficiarios"),api.request("/adm/projetos")]), projectMap=new Map(projects.map(function(p){return[p.id,p.nome];}));
    var body=tableBody("tabela-criancas");
    ["form-crianca","abrir-crianca"].forEach(function(id){var n=byId(id);if(n){if(id==="form-crianca")n.hidden=true;else n.hidden=true;}});
    var put=function(id,t){if(byId(id))byId(id).textContent=t;};
    put("beneficiarios-total",String(items.length));put("beneficiarios-ativos",String(items.filter(function(x){return x.ativo;}).length));put("beneficiarios-inativos",String(items.filter(function(x){return !x.ativo;}).length));
    put("beneficiarios-projetos",String(items.reduce(function(n,x){return n+(x.projetoIds||[]).length;},0)));
    if(body)body.innerHTML=items.map(function(child){var r=child.responsavel||{},names=(child.projetoIds||[]).map(function(id){return projectMap.get(id);}).filter(Boolean),state=child.ativo?"ativa":"inativa",search=[child.nome,r.nome,r.email,r.telefone,names.join(" ")].join(" ").toLocaleLowerCase("pt-BR");
      return '<tr data-id="'+escapeHtml(child.id)+'" data-status="'+state+'" data-search="'+escapeHtml(search)+'"><th scope="row">'+escapeHtml(child.nome)+'</th><td>'+escapeHtml(formatLocalDate(child.dataNascimento))+'</td><td>'+escapeHtml(r.nome||"—")+'</td><td>'+escapeHtml(names.join(", ")||"—")+'</td><td><span class="selo '+(child.ativo?"selo-ok":"selo-neutro")+'">'+(child.ativo?"Ativo":"Inativo")+'</span></td><td><button class="btn-link api-beneficiary-detail" type="button">Detalhes</button></td></tr>';
    }).join("");
    setFilter("tabela-criancas","filtro-crianca","status","busca-crianca","search","contagem-criancas"," beneficiário"," beneficiários");
    if(body)body.addEventListener("click",function(event){var btn=event.target.closest(".api-beneficiary-detail");if(!btn)return;var row=btn.closest("tr"),child=items.find(function(x){return x.id===row.dataset.id;});if(!child)return;var r=child.responsavel||{},names=(child.projetoIds||[]).map(function(id){return projectMap.get(id);}).filter(Boolean);
      put("crianca-titulo",child.nome);put("k-nascimento",formatLocalDate(child.dataNascimento));put("k-responsavel",[r.nome,r.parentesco,r.telefone,r.email].filter(Boolean).join(" · "));
      put("k-projetos",names.join(", ")||"Nenhum projeto vinculado");put("k-entrada",formatLocalDate(child.dataEntrada));put("k-saida",formatLocalDate(child.dataSaida));put("k-motivo",child.motivoSaida||"—");put("k-estado",child.ativo?"Ativo":"Inativo");
      if(byId("detalhe-crianca")){byId("detalhe-crianca").hidden=false;byId("detalhe-crianca").focus();}
    },true);
    var form=byId("form-nova-crianca");if(form)form.closest("section").hidden=true;
    document.querySelectorAll(".nota-dev").forEach(function(n){n.hidden=true;});
  }

  async function loadAdminResponsibles() {
    var [beneficiaries,requests]=await Promise.all([api.request("/adm/beneficiarios"),api.request("/adm/solicitacoes")]), unique=new Map();
    function keyFor(r){return String(r.email||r.telefone||r.nome||"").trim().toLocaleLowerCase("pt-BR");}
    function add(r,child,date,isRequest){if(!r||!r.nome)return;var key=keyFor(r);if(!key)return;if(!unique.has(key))unique.set(key,{responsible:r,children:new Map(),dates:[],requests:0});var entry=unique.get(key);if(child){var childKey=child.split(" · ")[0].replace(/ \(ativo\)| \(inativo\)/g,"").toLocaleLowerCase("pt-BR");if(!entry.children.has(childKey))entry.children.set(childKey,child);}if(date)entry.dates.push(date);if(isRequest)entry.requests++;}
    beneficiaries.forEach(function(b){add(b.responsavel,b.nome+(b.ativo?" (ativo)":" (inativo)"),b.dataEntrada,false);});
    requests.forEach(function(x){var c=x.beneficiario||{},label=(c.nome||"Solicitação")+" · "+formatStatus(x.status);add(x.responsavel,label,x.dataSolicitacao,true);});
    var entries=Array.from(unique.values()),body=tableBody("tabela-responsaveis"),put=function(id,t){if(byId(id))byId(id).textContent=t;};
    put("responsaveis-total",String(entries.length));put("responsaveis-beneficiarios",String(beneficiaries.length));put("responsaveis-varias",String(entries.filter(function(e){return e.children.size>1;}).length));put("responsaveis-solicitacoes",String(entries.reduce(function(n,e){return n+e.requests;},0)));
    if(body)body.innerHTML=entries.map(function(e){var r=e.responsible,group=[e.children.size>1?"varias":"",r.email?"com-email":"sem-email"].filter(Boolean).join(" "),search=[r.nome,r.email,r.telefone,r.parentesco,Array.from(e.children.values()).join(" ")].join(" ").toLocaleLowerCase("pt-BR");
      return '<tr data-key="'+escapeHtml(keyFor(r))+'" data-grupo="'+group+'" data-search="'+escapeHtml(search)+'"><th scope="row">'+escapeHtml(r.nome)+'</th><td>'+escapeHtml(r.parentesco||"—")+'</td><td>'+escapeHtml(r.telefone||"—")+'</td><td>'+e.children.size+'</td><td>'+e.requests+'</td><td><button class="btn-link api-responsible-detail" type="button">Detalhes</button></td></tr>';
    }).join("");
    function filter(){var picked=(document.querySelector('input[name="filtro-resp"]:checked')||{}).value||"todos",term=value("busca-resp").toLocaleLowerCase("pt-BR"),visible=0;
      if(body)Array.from(body.querySelectorAll("tr")).forEach(function(row){var groups=(row.dataset.grupo||"").split(" "),text=row.dataset.search||"",show=(picked==="todos"||groups.indexOf(picked)>=0)&&(!term||text.indexOf(term)>=0);row.hidden=!show;if(show)visible++;});
      var count=byId("contagem-resp"),empty=byId("resp-vazio");if(count)count.textContent=visible+(visible===1?" responsável":" responsáveis");if(empty)empty.hidden=visible>0;
    }
    document.querySelectorAll('input[name="filtro-resp"]').forEach(function(i){i.addEventListener("change",filter);});if(byId("busca-resp"))byId("busca-resp").addEventListener("input",filter);filter();
    if(body)body.addEventListener("click",function(event){var btn=event.target.closest(".api-responsible-detail");if(!btn)return;var row=btn.closest("tr"),entry=unique.get(row.dataset.key);if(!entry)return;var r=entry.responsible;
      put("resp-titulo",r.nome);put("r-d-parentesco",r.parentesco||"—");put("r-d-cpf","Não armazenado no sistema");put("r-d-telefone",r.telefone||"—");put("r-d-email",r.email||"—");put("r-d-endereco","Não armazenado no sistema");put("r-d-criancas",Array.from(entry.children.values()).join(", ")||"—");put("r-d-desde",entry.dates.length?formatLocalDate(entry.dates.sort()[0]):"—");put("r-d-obs",entry.requests+" solicitação(ões) e "+entry.children.size+" beneficiário(s) associado(s)");
      if(byId("detalhe-resp")){byId("detalhe-resp").hidden=false;byId("detalhe-resp").focus();}
    },true);
    var form=byId("form-novo-responsavel");if(form)form.closest("section").hidden=true;
    document.querySelectorAll(".nota-dev").forEach(function(n){n.hidden=true;});
  }

  async function loadAdminDonors(users) {
    var [donations,plans,volunteers,projects]=await Promise.all([api.request("/adm/doacoes"),api.request("/adm/planos"),api.request("/adm/voluntarios"),api.request("/adm/projetos")]);
    var registered=users.filter(function(u){return u.tipo==="COMUM";}),rows=[],manual=new Map(),body=tableBody("tabela-doadores"),projectMap=new Map(projects.map(function(p){return[p.id,p.nome];}));
    registered.forEach(function(user){var ds=donations.filter(function(d){return d.doadorId===user.id;}),ps=plans.filter(function(p){return p.doadorId===user.id;}),vs=volunteers.filter(function(v){return v.usuarioId===user.id;}),paid=ds.filter(isDonationPaid),active=ps.filter(function(p){return p.status==="ATIVO";});
      rows.push({key:user.id,user:user,donations:ds,paid:paid,plans:ps,activePlans:active,volunteers:vs,total:paid.reduce(function(a,d){return a+Number(d.valor||0);},0),manual:false});
    });
    donations.filter(function(d){return !d.doadorId&&d.doadorNome;}).forEach(function(d){var k=String(d.doadorNome).trim().toLocaleLowerCase("pt-BR");if(!manual.has(k))manual.set(k,[]);manual.get(k).push(d);});
    manual.forEach(function(ds,k){var paid=ds.filter(isDonationPaid);rows.push({key:"manual:"+k,user:{id:null,nome:ds[0].doadorNome,email:"",telefone:"",ativo:true},donations:ds,paid:paid,plans:[],activePlans:[],volunteers:[],total:paid.reduce(function(a,d){return a+Number(d.valor||0);},0),manual:true});});
    rows.sort(function(a,b){return String(a.user.nome).localeCompare(String(b.user.nome),"pt-BR");});
    var withDonations=rows.filter(function(r){return r.paid.length>0;}).length,withPlans=registered.filter(function(u){return plans.some(function(p){return p.doadorId===u.id&&p.status==="ATIVO";});}).length;
    var put=function(id,t){if(byId(id))byId(id).textContent=t;};put("doadores-total-contas",String(registered.length));put("doadores-com-doacao",String(withDonations));put("doadores-plano-ativo",String(withPlans));put("doadores-inativos",String(registered.filter(function(u){return !u.ativo;}).length));
    if(body)body.innerHTML=rows.map(function(r){var u=r.user,group=[r.paid.length?"doou":"",r.activePlans.length?"mensal":"",!r.manual&&!u.ativo?"inativo":""].filter(Boolean).join(" "),search=[u.nome,u.email,u.telefone].join(" ").toLocaleLowerCase("pt-BR");
      return '<tr data-key="'+escapeHtml(r.key)+'" data-grupo="'+group+'" data-busca="'+escapeHtml(search)+'"><th scope="row">'+escapeHtml(u.nome)+'</th><td>'+escapeHtml([u.email,u.telefone].filter(Boolean).join(" · ")||"—")+'</td><td>'+r.paid.length+'</td><td>'+escapeHtml(formatCurrency(r.total))+'</td><td><span class="selo '+(!r.manual&&u.ativo?"selo-ok":"selo-neutro")+'">'+(r.manual?"Sem conta":u.ativo?"Ativo":"Inativo")+'</span></td><td><button class="btn-link api-donor-detail" type="button">Detalhes</button></td></tr>';
    }).join("");
    function filter(){var picked=(document.querySelector('input[name="filtro-doador"]:checked')||{}).value||"todos",term=value("busca-doador").toLocaleLowerCase("pt-BR"),visible=0;
      if(body)Array.from(body.querySelectorAll("tr")).forEach(function(row){var groups=(row.dataset.grupo||"").split(" "),show=(picked==="todos"||groups.indexOf(picked)>=0)&&(!term||(row.dataset.busca||"").indexOf(term)>=0);row.hidden=!show;if(show)visible++;});
      var count=byId("contagem-doadores"),empty=byId("doadores-vazio");if(count)count.textContent=visible+(visible===1?" doador":" doadores");if(empty)empty.hidden=visible>0;
    }
    document.querySelectorAll('input[name="filtro-doador"]').forEach(function(i){i.addEventListener("change",filter);});if(byId("busca-doador"))byId("busca-doador").addEventListener("input",filter);filter();
    var exportButton=byId("exportar-doadores");if(exportButton)exportButton.addEventListener("click",function(event){event.preventDefault();event.stopImmediatePropagation();imprimirTabelaPdf(byId("tabela-doadores"),"Relatório de doadores","status-exportar-doadores");},true);
    if(body)body.addEventListener("click",function(event){var btn=event.target.closest(".api-donor-detail");if(!btn)return;var row=btn.closest("tr"),r=rows.find(function(x){return x.key===row.dataset.key;});if(!r)return;var u=r.user,vol=r.volunteers.map(function(v){var project=projectMap.get(v.projetoId);return formatStatus(v.status)+(project?" · "+project:" ");}).join("; ")||"Não se candidatou";
      put("detalhe-nome",u.nome);put("d-email",u.email||"Não informado neste registro");put("d-telefone",u.telefone||"Não informado neste registro");put("d-cpf","Não disponibilizado pelo painel");
      put("d-desde",r.manual?"Doador sem conta no site":formatDate(u.dataCadastro));put("d-doacoes",String(r.paid.length));put("d-total",formatCurrency(r.total));
      put("d-mensal",r.activePlans.length?r.activePlans.map(function(p){return formatCurrency(p.valorMensal)+"/mês · "+formatStatus(p.status);}).join("; "):"Sem plano ativo");put("d-voluntariado",vol);put("d-situacao",r.manual?"Registro de doação avulsa":u.ativo?"Conta ativa":"Conta inativa");
      var link=byId("ver-doacoes-doador");if(link)link.href=r.manual?"admin-doacoes.html":"admin-doacoes.html?doadorId="+encodeURIComponent(u.id);
      if(byId("status-doador"))byId("status-doador").textContent="";if(byId("detalhe-doador")){byId("detalhe-doador").hidden=false;byId("detalhe-doador").focus();}
    },true);
    document.querySelectorAll(".nota-dev").forEach(function(n){n.hidden=true;});
  }

  async function boot() {
    onLoginOrSignup();
    onPasswordRecovery();
    onSolicitation();
    onProfile();
    onDonation();
    onVolunteer();
    onDonationHistory();
    document.querySelectorAll(".conta-sair").forEach(function (link) {
      link.addEventListener("click", function () { api.limparSessao(); }, true);
    });

    if (byId("form-perfil") || (byId("form-doacao") && !byId("doador-email"))) await fillProfile();
    if (byId("form-doacao")) {
      if (byId("doador-email")) {
        try { var publicProjects = await getProjects(); window.ONG_PROJECTS = publicProjects; setProjectOptions(byId("destino"), publicProjects); }
        catch (_) { status("doacao", "Não foi possível carregar os projetos agora.", true); }
        var monthlyChoice = document.querySelector('input[name="frequencia"][value="mensal"]');
        if (monthlyChoice) monthlyChoice.closest("label").hidden = true;
      } else await prepareDonation();
    }
    if (byId("form-voluntario")) await loadMyVolunteering();
    if (byId("tabela-doacoes")) await loadDonations();
    if (byId("destino")) getProjects().then(function (projects) { window.ONG_PROJECTS = projects; setProjectOptions(byId("destino"), projects); }).catch(function () {});

    if (!document.body.classList.contains("admin")) return;
    var users = await authorizeAdmin();
    if (!users) return;
    var pageProjects = [];
    if (byId("tabela-projetos") || byId("tabela-voluntarios") || byId("form-voluntario")) {
      try { pageProjects = await getProjects(); } catch (_) { pageProjects = []; }
    }
    if (byId("dashboard-sauda")) await loadAdminDashboard(users);
    if (byId("tabela-admins")) await loadAdminUsers(users);
    if (byId("tabela-solicitacoes")) await loadAdminSolicitations();
    if (byId("tabela-voluntarios")) await loadAdminVolunteers(users, pageProjects);
    if (byId("tabela-projetos")) await loadAdminProjects();
    if (byId("tabela-admin-doacoes")) await loadAdminDonations();
    if (byId("tabela-criancas")) await loadAdminBeneficiaries();
    if (byId("tabela-responsaveis")) await loadAdminResponsibles();
    if (byId("tabela-doadores")) await loadAdminDonors(users);

    document.querySelectorAll(".admin-sair").forEach(function (logout) {
      logout.addEventListener("click", function () { api.limparSessao(); }, true);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}());
