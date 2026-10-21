(function () {
  "use strict";

  var STORAGE = {
    consent: "dd.consent.v1",
    leads: "dd.leads.v1",
    presave: "dd.presave.v1"
  };

  var defaultConsent = {
    necessary: true,
    media: false,
    marketing: false,
    analytics: false,
    contrast: false,
    motion: "system",
    updatedAt: null
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function consent() {
    return Object.assign({}, defaultConsent, read(STORAGE.consent, {}));
  }

  function applyPrefs(state) {
    document.documentElement.dataset.contrast = state.contrast ? "high" : "default";
    document.documentElement.dataset.motion = state.motion === "reduce" ? "reduce" : "system";
  }

  function toast(message) {
    var node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.textContent = message;
    document.body.appendChild(node);
    window.setTimeout(function () {
      node.remove();
    }, 4200);
  }

  function initNav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector("#menu");
    if (!header || !toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    window.addEventListener("scroll", function () {
      header.classList.toggle("is-compact", window.scrollY > 12);
    }, { passive: true });
  }

  function initReveal() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".reveal").forEach(function (node, index) {
      node.style.animationDelay = Math.min(index * 70, 280) + "ms";
    });
  }

  function initCounters() {
    var nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length || !("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = Number(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var start = performance.now();
        function tick(now) {
          var progress = Math.min((now - start) / 900, 1);
          el.textContent = Math.round(target * progress).toLocaleString("pt-BR") + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    }, { threshold: 0.6 });
    nodes.forEach(function (node) { observer.observe(node); });
  }

  function bannerTemplate() {
    return (
      '<div class="cookie-banner" id="cookie-banner" hidden>' +
        '<p><strong>Privacidade da pista.</strong> Este site guarda escolhas só neste navegador. Mídia do YouTube e mensagens de campanha esperam a sua permissão.</p>' +
        '<div class="actions">' +
          '<button class="btn btn-ink" type="button" data-consent="all">Aceitar tudo</button>' +
          '<button class="btn btn-ghost" type="button" data-consent="essential">Só o essencial</button>' +
          '<button class="btn btn-ghost" type="button" data-open-prefs>Configurar</button>' +
        "</div>" +
      "</div>"
    );
  }

  function dialogTemplate() {
    return (
      '<dialog id="prefs-dialog" aria-labelledby="prefs-title">' +
        '<form class="dialog-body" id="prefs-form">' +
          '<h2 id="prefs-title">Pedidos e permissões</h2>' +
          '<p>As chaves abaixo controlam cookies locais, mídia incorporada e o jeito de ler o site. Nada disso é enviado a um servidor nesta versão.</p>' +
          '<div class="switch"><span><strong>Essenciais</strong><br>Lembram esta escolha e o briefing salvo no navegador.</span><input type="checkbox" checked disabled></div>' +
          '<div class="switch"><span><strong>Mídia</strong><br>Libera o player do YouTube dentro do site.</span><input name="media" type="checkbox"></div>' +
          '<div class="switch"><span><strong>Campanhas</strong><br>Guarda interesse na LP e permite textos de divulgação prontos para copiar.</span><input name="marketing" type="checkbox"></div>' +
          '<div class="switch"><span><strong>Medição</strong><br>Reservado. Nenhum analytics de terceiro está instalado.</span><input name="analytics" type="checkbox"></div>' +
          '<div class="switch"><span><strong>Alto contraste</strong></span><input name="contrast" type="checkbox"></div>' +
          '<div class="switch"><span><strong>Reduzir movimento</strong></span><input name="motion" type="checkbox"></div>' +
          '<div class="actions">' +
            '<button class="btn btn-ink" type="submit">Salvar permissões</button>' +
            '<button class="btn btn-ghost" type="button" data-export>Exportar meus dados</button>' +
            '<button class="btn btn-ghost" type="button" data-erase>Apagar dados locais</button>' +
            '<button class="btn btn-ghost" type="button" data-close-prefs>Fechar</button>' +
          "</div>" +
          '<p class="meta"><a href="privacidade.html">Ler a política completa</a></p>' +
        "</form>" +
      "</dialog>"
    );
  }

  function ensurePrivacyUi() {
    if (!document.getElementById("cookie-banner")) {
      document.body.insertAdjacentHTML("beforeend", bannerTemplate());
    }
    if (!document.getElementById("prefs-dialog")) {
      document.body.insertAdjacentHTML("beforeend", dialogTemplate());
    }
  }

  function fillPrefsForm(state) {
    var form = document.getElementById("prefs-form");
    if (!form) return;
    form.media.checked = Boolean(state.media);
    form.marketing.checked = Boolean(state.marketing);
    form.analytics.checked = Boolean(state.analytics);
    form.contrast.checked = Boolean(state.contrast);
    form.motion.checked = state.motion === "reduce";
  }

  function openPrefs() {
    var dialog = document.getElementById("prefs-dialog");
    fillPrefsForm(consent());
    if (dialog && typeof dialog.showModal === "function") dialog.showModal();
  }

  function saveConsent(next) {
    next.necessary = true;
    next.updatedAt = new Date().toISOString();
    write(STORAGE.consent, next);
    applyPrefs(next);
    var banner = document.getElementById("cookie-banner");
    if (banner) banner.hidden = true;
    document.dispatchEvent(new CustomEvent("dd:consent", { detail: next }));
  }

  function initPrivacy() {
    ensurePrivacyUi();
    var state = consent();
    applyPrefs(state);
    var banner = document.getElementById("cookie-banner");
    if (!state.updatedAt && banner) banner.hidden = false;

    document.addEventListener("click", function (event) {
      var target = event.target.closest("[data-consent], [data-open-prefs], [data-close-prefs], [data-export], [data-erase]");
      if (!target) return;
      if (target.hasAttribute("data-open-prefs")) {
        openPrefs();
        return;
      }
      if (target.hasAttribute("data-close-prefs")) {
        document.getElementById("prefs-dialog").close();
        return;
      }
      if (target.hasAttribute("data-export")) {
        exportData();
        return;
      }
      if (target.hasAttribute("data-erase")) {
        localStorage.removeItem(STORAGE.consent);
        localStorage.removeItem(STORAGE.leads);
        localStorage.removeItem(STORAGE.presave);
        applyPrefs(defaultConsent);
        toast("Dados locais apagados neste navegador.");
        var dialog = document.getElementById("prefs-dialog");
        if (dialog && dialog.open) dialog.close();
        if (banner) banner.hidden = false;
        return;
      }
      var mode = target.getAttribute("data-consent");
      if (mode === "all") {
        saveConsent({ necessary: true, media: true, marketing: true, analytics: true, contrast: state.contrast, motion: state.motion });
        toast("Permissões aceitas.");
      }
      if (mode === "essential") {
        saveConsent({ necessary: true, media: false, marketing: false, analytics: false, contrast: false, motion: "system" });
        toast("Ficou só o essencial.");
      }
    });

    var form = document.getElementById("prefs-form");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var current = consent();
      saveConsent({
        necessary: true,
        media: form.media.checked,
        marketing: form.marketing.checked,
        analytics: form.analytics.checked,
        contrast: form.contrast.checked,
        motion: form.motion.checked ? "reduce" : "system"
      });
      document.getElementById("prefs-dialog").close();
      toast("Configurações salvas neste navegador.");
      current = consent();
      fillStaticToggles(current);
    });

    fillStaticToggles(state);
    initStaticPrefs(state);
  }

  function fillStaticToggles(state) {
    document.querySelectorAll("[data-bind-consent]").forEach(function (input) {
      var key = input.getAttribute("data-bind-consent");
      if (key === "motion") input.checked = state.motion === "reduce";
      else input.checked = Boolean(state[key]);
    });
    var stamp = document.querySelector("[data-consent-stamp]");
    if (stamp) stamp.textContent = state.updatedAt ? new Date(state.updatedAt).toLocaleString("pt-BR") : "ainda sem escolha salva";
  }

  function initStaticPrefs() {
    var form = document.getElementById("privacy-form");
    if (!form) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      saveConsent({
        necessary: true,
        media: form.media.checked,
        marketing: form.marketing.checked,
        analytics: form.analytics.checked,
        contrast: form.contrast.checked,
        motion: form.motion.checked ? "reduce" : "system"
      });
      toast("Política aplicada neste navegador.");
    });
  }

  function exportData() {
    var blob = new Blob([JSON.stringify({
      consent: read(STORAGE.consent, null),
      leads: read(STORAGE.leads, []),
      presave: read(STORAGE.presave, [])
    }, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "dados-dj-diplomata.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function fieldError(input, message) {
    var holder = input.parentElement.querySelector(".error");
    if (!holder) {
      holder = document.createElement("span");
      holder.className = "error";
      input.parentElement.appendChild(holder);
    }
    holder.textContent = message || "";
    input.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function initForms() {
    var booking = document.getElementById("booking-form");
    if (booking) {
      booking.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = new FormData(booking);
        var nome = String(data.get("nome") || "").trim();
        var email = String(data.get("email") || "").trim();
        var tipo = String(data.get("tipo") || "");
        var mensagem = String(data.get("mensagem") || "").trim();
        var ok = true;
        ok = fieldError(booking.nome, nome.length < 2 ? "Diz seu nome." : "") && ok;
        ok = fieldError(booking.email, validateEmail(email) ? "" : "E-mail inválido.") && ok;
        ok = fieldError(booking.tipo, tipo ? "" : "Escolhe o tipo de data.") && ok;
        ok = fieldError(booking.mensagem, mensagem.length < 12 ? "Conta um pouco da festa." : "") && ok;
        ok = fieldError(booking.consent, booking.consent.checked ? "" : "Precisa autorizar o uso deste briefing.") && ok;
        if (!ok) return;

        var lead = {
          nome: nome,
          email: email,
          telefone: String(data.get("telefone") || "").trim(),
          cidade: String(data.get("cidade") || "").trim(),
          tipo: tipo,
          data: String(data.get("data") || ""),
          mensagem: mensagem,
          createdAt: new Date().toISOString()
        };
        var leads = read(STORAGE.leads, []);
        leads.push(lead);
        write(STORAGE.leads, leads);
        var brief = [
          "Booking DJ Diplomata",
          "Nome: " + lead.nome,
          "E-mail: " + lead.email,
          "Telefone: " + (lead.telefone || "não informado"),
          "Cidade: " + (lead.cidade || "Curitiba e região"),
          "Tipo: " + lead.tipo,
          "Data: " + (lead.data || "a combinar"),
          "Briefing: " + lead.mensagem
        ].join("\n");
        var status = document.getElementById("booking-status");
        status.hidden = false;
        status.querySelector("pre").textContent = brief;
        booking.reset();
        toast("Briefing salvo neste navegador. Copia e envia no Instagram.");
      });
    }

    var presave = document.getElementById("presave-form");
    if (presave) {
      presave.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = new FormData(presave);
        var nome = String(data.get("nome") || "").trim();
        var email = String(data.get("email") || "").trim();
        var state = consent();
        var ok = fieldError(presave.nome, nome.length < 2 ? "Como a gente te chama?" : "");
        ok = fieldError(presave.email, validateEmail(email) ? "" : "E-mail inválido.") && ok;
        ok = fieldError(presave.consent, presave.consent.checked ? "" : "Confirma o aviso da LP.") && ok;
        if (!state.marketing) {
          toast("Ativa a permissão de campanhas para entrar na lista da LP.");
          openPrefs();
          return;
        }
        if (!ok) return;
        var list = read(STORAGE.presave, []);
        list.push({
          nome: nome,
          email: email,
          cidade: String(data.get("cidade") || "").trim(),
          createdAt: new Date().toISOString()
        });
        write(STORAGE.presave, list);
        presave.reset();
        var note = document.getElementById("presave-status");
        note.hidden = false;
        note.textContent = "Você está na lista local da LP Credenciais. Quando houver domínio e servidor, este contato precisa ser reenviado ao artista.";
        toast("Interesse na LP registrado neste navegador.");
      });
    }
  }

  function initCopy() {
    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-copy]");
      if (!button) return;
      var state = consent();
      if (button.hasAttribute("data-needs-marketing") && !state.marketing) {
        toast("Ativa a permissão de campanhas para copiar material de divulgação.");
        openPrefs();
        return;
      }
      var selector = button.getAttribute("data-copy");
      var node = document.querySelector(selector);
      var text = node ? node.textContent.trim() : button.getAttribute("data-copy-text");
      if (!text) return;
      navigator.clipboard.writeText(text).then(function () {
        toast("Texto copiado.");
      }).catch(function () {
        toast("Não foi possível copiar. Seleciona o texto manualmente.");
      });
    });
  }

  function initFilters() {
    var bar = document.querySelector("[data-filter-bar]");
    if (!bar) return;
    var cards = document.querySelectorAll("[data-status]");
    bar.addEventListener("click", function (event) {
      var chip = event.target.closest("[data-filter]");
      if (!chip) return;
      bar.querySelectorAll("[data-filter]").forEach(function (item) {
        item.setAttribute("aria-pressed", item === chip ? "true" : "false");
      });
      var value = chip.getAttribute("data-filter");
      cards.forEach(function (card) {
        card.hidden = value !== "todos" && card.getAttribute("data-status") !== value;
      });
    });
  }

  function initMedia() {
    function mount(frame) {
      var id = frame.getAttribute("data-youtube");
      if (!id || frame.querySelector("iframe")) return;
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?rel=0";
      iframe.title = frame.getAttribute("data-title") || "Set de DJ Diplomata";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      frame.textContent = "";
      frame.appendChild(iframe);
    }

    document.querySelectorAll(".media-frame").forEach(function (frame) {
      var button = frame.querySelector("button");
      if (!button) return;
      button.addEventListener("click", function () {
        var state = consent();
        if (!state.media) {
          toast("Para ver o set aqui, libera a permissão de mídia.");
          openPrefs();
          return;
        }
        if (!frame.getAttribute("data-youtube")) {
          toast("Ainda não há link oficial de set para incorporar.");
          return;
        }
        mount(frame);
      });
    });

    document.addEventListener("dd:consent", function (event) {
      if (!event.detail.media) return;
      document.querySelectorAll(".media-frame[data-autoplay-on-consent]").forEach(mount);
    });
  }

  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach(function (group) {
      var buttons = group.querySelectorAll("[data-tab]");
      var panels = group.querySelectorAll("[data-panel]");
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          var name = button.getAttribute("data-tab");
          buttons.forEach(function (item) {
            item.setAttribute("aria-selected", item === button ? "true" : "false");
          });
          panels.forEach(function (panel) {
            panel.hidden = panel.getAttribute("data-panel") !== name;
          });
        });
      });
    });
  }

  function initLightbox() {
    var dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.innerHTML = '<form method="dialog" class="lightbox-body"><button class="btn btn-ghost" value="close">Fechar</button><img alt=""><p class="lightbox-cap"></p></form>';
    document.body.appendChild(dialog);
    var img = dialog.querySelector("img");
    var cap = dialog.querySelector(".lightbox-cap");
    document.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-lightbox]");
      if (!btn) return;
      var source = btn.getAttribute("data-full");
      var inner = btn.querySelector("img");
      img.src = source || (inner ? inner.src : "");
      img.alt = btn.getAttribute("data-caption") || "";
      cap.textContent = btn.getAttribute("data-caption") || "";
      if (typeof dialog.showModal === "function") dialog.showModal();
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
  }

  function initTracks() {
    var list = document.querySelector("[data-tracks]");
    if (!list) return;
    var note = document.querySelector("[data-track-note]");
    list.addEventListener("click", function (event) {
      var item = event.target.closest("[data-note]");
      if (!item) return;
      list.querySelectorAll("[data-note]").forEach(function (el) {
        var on = el === item;
        el.classList.toggle("is-on", on);
        el.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (note) note.textContent = item.getAttribute("data-note");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveal();
    initCounters();
    initPrivacy();
    initForms();
    initCopy();
    initFilters();
    initMedia();
    initTabs();
    initLightbox();
    initTracks();
  });
})();
