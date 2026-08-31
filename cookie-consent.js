/*!
 * cookie-consent.js — bandeau + panneau de préférences (version propre)
 * Collecte raisonnable uniquement. Pas de tracking invasif.
 */
(function () {
  "use strict";

  var defaultConfig = {
    cookieName: "site_cookie_consent",
    cookieDays: 180,
    position: "bottom",
    locale: {
      title: "Cookies & confidentialité",
      description: "Nous utilisons des cookies pour le fonctionnement du site et des mesures d'audience. Choisissez ce que vous acceptez.",
      acceptAll: "Tout accepter",
      necessaryOnly: "Nécessaires seulement",
      configure: "Configurer",
      savePrefs: "Enregistrer mes choix",
      back: "Retour",
      panelTitle: "Préférences de cookies",
      panelDescription: "Activez ou désactivez chaque catégorie. Les cookies nécessaires sont obligatoires.",
      ipLabel: "Masquer mon IP (ne garder que les 3 premiers chiffres)",
      ipDesc: "Si coché, seule une version partielle de l'IP sera stockée.",
      categories: {
        necessary: {
          label: "Nécessaires",
          desc: "Indispensables au fonctionnement (session, sécurité, langue)."
        },
        analytics: {
          label: "Analytiques",
          desc: "Mesure d'audience : pages vues, temps passé, appareil, navigateur, clics, profondeur de scroll."
        },
        preferences: {
          label: "Préférences",
          desc: "Mémorise vos choix d'affichage et de personnalisation."
        },
        marketing: {
          label: "Marketing",
          desc: "Publicités et contenus personnalisés (désactivé par défaut recommandé)."
        }
      }
    },
    theme: {
      bg: "#171512",
      surface: "#221f1b",
      text: "#f1ece3",
      textMuted: "#b7ada0",
      accent: "#c98f4a",
      accentText: "#171512",
      border: "#3a352e",
      radius: "10px",
      font: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    }
  };

  function deepMerge(base, override) {
    if (!override) return base;
    var out = {};
    for (var k in base) {
      if (override[k] && typeof override[k] === "object" && !Array.isArray(override[k]) && typeof base[k] === "object") {
        out[k] = deepMerge(base[k], override[k]);
      } else {
        out[k] = override[k] !== undefined ? override[k] : base[k];
      }
    }
    return out;
  }

  var cfg = deepMerge(defaultConfig, window.CookieConsentConfig || {});
  var L = cfg.locale;

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + "=" + encodeURIComponent(JSON.stringify(value)) +
      ";expires=" + d.toUTCString() + ";path=/;SameSite=Lax";
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
    if (!match) return null;
    try { return JSON.parse(decodeURIComponent(match[1])); } catch (e) { return null; }
  }

  window.getCookieConsent = function () {
    return getCookie(cfg.cookieName);
  };

  function emitConsent(consent) {
    window.dispatchEvent(new CustomEvent("cookieConsentUpdated", { detail: consent }));
  }

  function injectStyles() {
    var t = cfg.theme;
    var css = `
      .cc-root, .cc-root * { box-sizing: border-box; }
      .cc-root {
        --cc-bg: ${t.bg}; --cc-surface: ${t.surface}; --cc-text: ${t.text};
        --cc-text-muted: ${t.textMuted}; --cc-accent: ${t.accent}; --cc-accent-text: ${t.accentText};
        --cc-border: ${t.border}; --cc-radius: ${t.radius}; --cc-font: ${t.font};
        position: fixed; left: 0; right: 0; z-index: 999999;
        ${cfg.position === "top" ? "top: 0;" : "bottom: 0;"}
        font-family: var(--cc-font);
        animation: cc-slide-in .35s ease-out;
      }
      @keyframes cc-slide-in {
        from { transform: translateY(${cfg.position === "top" ? "-100%" : "100%"}); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .cc-banner {
        background: var(--cc-bg); color: var(--cc-text);
        border-top: 1px solid var(--cc-border);
        padding: 18px 22px; display: flex; gap: 18px; align-items: center;
        flex-wrap: wrap; max-width: 1100px; margin: 0 auto;
      }
      .cc-text { flex: 1 1 300px; min-width: 220px; }
      .cc-text h2 { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
      .cc-text p { font-size: 13.5px; line-height: 1.45; margin: 0; color: var(--cc-text-muted); max-width: 60ch; }
      .cc-actions { display: flex; gap: 10px; flex-wrap: wrap; flex-shrink: 0; }
      .cc-btn {
        font-family: var(--cc-font); font-size: 13.5px; font-weight: 500;
        padding: 10px 16px; border-radius: var(--cc-radius); cursor: pointer;
        border: 1px solid var(--cc-border); background: transparent; color: var(--cc-text);
        transition: filter .15s ease, transform .1s ease; white-space: nowrap;
      }
      .cc-btn:hover { filter: brightness(1.15); }
      .cc-btn:active { transform: scale(.97); }
      .cc-btn-primary { background: var(--cc-accent); color: var(--cc-accent-text); border-color: var(--cc-accent); }
      .cc-btn-ghost { background: transparent; }

      .cc-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.72);
        z-index: 999998; display: flex; align-items: center; justify-content: center;
        padding: 16px; font-family: var(--cc-font);
      }
      .cc-panel {
        background: var(--cc-surface); color: var(--cc-text); border: 1px solid var(--cc-border);
        border-radius: calc(var(--cc-radius) + 4px); max-width: 460px; width: 100%;
        max-height: 88vh; overflow-y: auto; padding: 22px;
      }
      .cc-panel h2 { font-size: 17px; margin: 0 0 6px; }
      .cc-panel > p { font-size: 13px; color: var(--cc-text-muted); line-height: 1.45; margin: 0 0 16px; }

      .cc-cat {
        border-top: 1px solid var(--cc-border); padding: 0;
      }
      .cc-cat:first-of-type { border-top: none; }
      .cc-cat-header {
        display: flex; justify-content: space-between; align-items: center;
        gap: 12px; padding: 12px 0; cursor: pointer; user-select: none;
      }
      .cc-cat-header:hover .cc-cat-label { color: var(--cc-accent); }
      .cc-cat-label { font-size: 14px; font-weight: 600; margin: 0; transition: color .15s; }
      .cc-cat-arrow {
        width: 18px; height: 18px; flex-shrink: 0;
        transition: transform .2s ease; color: var(--cc-text-muted);
      }
      .cc-cat.open .cc-cat-arrow { transform: rotate(180deg); }
      .cc-cat-body {
        display: none; padding: 0 0 12px 0;
      }
      .cc-cat.open .cc-cat-body { display: block; }
      .cc-cat-desc { font-size: 12.5px; color: var(--cc-text-muted); line-height: 1.4; margin: 0 0 8px; }

      .cc-switch { position: relative; width: 42px; height: 24px; flex-shrink: 0; }
      .cc-switch input { opacity: 0; width: 0; height: 0; }
      .cc-slider {
        position: absolute; inset: 0; background: var(--cc-border); border-radius: 999px;
        cursor: pointer; transition: background .15s ease;
      }
      .cc-slider::before {
        content: ""; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px;
        background: var(--cc-text); border-radius: 50%; transition: transform .15s ease;
      }
      .cc-switch input:checked + .cc-slider { background: var(--cc-accent); }
      .cc-switch input:checked + .cc-slider::before { transform: translateX(18px); background: var(--cc-accent-text); }
      .cc-switch input:disabled + .cc-slider { opacity: .45; cursor: not-allowed; }

      .cc-ip-row {
        margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--cc-border);
        font-size: 12px; color: var(--cc-text-muted);
      }
      .cc-ip-row label { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }
      .cc-ip-row input { margin-top: 2px; }
      .cc-ip-row small { display: block; margin-top: 2px; opacity: .85; }

      .cc-panel-actions { display: flex; justify-content: space-between; gap: 10px; margin-top: 18px; }

      @media (max-width: 520px) {
        .cc-banner { padding: 14px; }
        .cc-actions { width: 100%; }
        .cc-btn { flex: 1 1 auto; }
      }
    `;
    var style = document.createElement("style");
    style.setAttribute("data-cc-style", "");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildBanner() {
    var root = document.createElement("div");
    root.className = "cc-root";
    root.innerHTML =
      '<div class="cc-banner" role="dialog" aria-live="polite" aria-label="' + L.title + '">' +
        '<div class="cc-text"><h2>' + L.title + '</h2><p>' + L.description + '</p></div>' +
        '<div class="cc-actions">' +
          '<button type="button" class="cc-btn cc-btn-ghost" data-cc="configure">' + L.configure + '</button>' +
          '<button type="button" class="cc-btn" data-cc="necessary">' + L.necessaryOnly + '</button>' +
          '<button type="button" class="cc-btn cc-btn-primary" data-cc="acceptAll">' + L.acceptAll + '</button>' +
        '</div>' +
      '</div>';
    return root;
  }

  function buildPanel(currentState) {
    var overlay = document.createElement("div");
    overlay.className = "cc-overlay";

    var keys = ["necessary", "analytics", "preferences", "marketing"];
    var rows = keys.map(function (key) {
      var cat = L.categories[key];
      var checked = currentState[key] ? "checked" : "";
      var disabled = key === "necessary" ? "disabled" : "";
      var openClass = key === "necessary" ? " open" : "";
      return (
        '<div class="cc-cat' + openClass + '" data-cat="' + key + '">' +
          '<div class="cc-cat-header">' +
            '<p class="cc-cat-label">' + cat.label + '</p>' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<label class="cc-switch" onclick="event.stopPropagation()">' +
                '<input type="checkbox" data-cc-cat="' + key + '" ' + checked + ' ' + disabled + '>' +
                '<span class="cc-slider"></span>' +
              '</label>' +
              '<svg class="cc-cat-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
            '</div>' +
          '</div>' +
          '<div class="cc-cat-body"><p class="cc-cat-desc">' + cat.desc + '</p></div>' +
        '</div>'
      );
    }).join("");

    var ipChecked = currentState.ip_partial !== false ? "checked" : "";

    overlay.innerHTML =
      '<div class="cc-panel" role="dialog" aria-modal="true" aria-label="' + L.panelTitle + '">' +
        '<h2>' + L.panelTitle + '</h2>' +
        '<p>' + L.panelDescription + '</p>' +
        rows +
        '<div class="cc-ip-row">' +
          '<label>' +
            '<input type="checkbox" data-cc-ip ' + ipChecked + '>' +
            '<span>' + L.ipLabel + '<small>' + L.ipDesc + '</small></span>' +
          '</label>' +
        '</div>' +
        '<div class="cc-panel-actions">' +
          '<button type="button" class="cc-btn cc-btn-ghost" data-cc="back">' + L.back + '</button>' +
          '<button type="button" class="cc-btn cc-btn-primary" data-cc="save">' + L.savePrefs + '</button>' +
        '</div>' +
      '</div>';
    return overlay;
  }

  function init() {
    var existing = getCookie(cfg.cookieName);
    if (existing) {
      emitConsent(existing);
      return;
    }

    injectStyles();
    var banner = buildBanner();
    document.body.appendChild(banner);

    function finalize(consent) {
      setCookie(cfg.cookieName, consent, cfg.cookieDays);
      emitConsent(consent);
      banner.remove();
      var overlay = document.querySelector(".cc-overlay");
      if (overlay) overlay.remove();
    }

    banner.addEventListener("click", function (e) {
      var action = e.target.getAttribute("data-cc");
      if (!action) return;

      if (action === "acceptAll") {
        finalize({ necessary: true, analytics: true, preferences: true, marketing: true, ip_partial: true });
      } else if (action === "necessary") {
        finalize({ necessary: true, analytics: false, preferences: false, marketing: false, ip_partial: true });
      } else if (action === "configure") {
        var current = { necessary: true, analytics: false, preferences: false, marketing: false, ip_partial: true };
        var overlay = buildPanel(current);
        document.body.appendChild(overlay);

        // toggle expand
        overlay.querySelectorAll(".cc-cat-header").forEach(function (header) {
          header.addEventListener("click", function () {
            header.parentElement.classList.toggle("open");
          });
        });

        overlay.addEventListener("click", function (ev) {
          var a = ev.target.getAttribute("data-cc");
          if (a === "back") {
            overlay.remove();
          } else if (a === "save") {
            var state = { necessary: true };
            overlay.querySelectorAll("[data-cc-cat]").forEach(function (input) {
              state[input.getAttribute("data-cc-cat")] = input.checked;
            });
            var ipBox = overlay.querySelector("[data-cc-ip]");
            state.ip_partial = ipBox ? ipBox.checked : true;
            finalize(state);
          }
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
