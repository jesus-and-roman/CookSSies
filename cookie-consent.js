/*!
 * cookie-consent.js — bandeau de consentement cookies, autonome, sans dépendances.
 * Usage : <script src="cookie-consent.js" defer></script>
 * Optionnel : window.CookieConsentConfig = { ... } AVANT le chargement du script pour personnaliser.
 *
 * Événement émis à chaque choix (accepter tout / nécessaires seulement / config sauvegardée) :
 *   window.addEventListener('cookieConsentUpdated', (e) => {
 *     console.log(e.detail); // { necessary: true, analytics: true/false, marketing: true/false, preferences: true/false }
 *   });
 *
 * Lecture du consentement à tout moment :
 *   window.getCookieConsent() -> objet de consentement ou null si pas encore répondu
 */
(function () {
  "use strict";

  // ---------- Config par défaut (surchargable via window.CookieConsentConfig) ----------
  var defaultConfig = {
    cookieName: "site_cookie_consent",
    cookieDays: 180,
    position: "bottom", // "bottom" | "top"
    locale: {
      title: "On utilise des cookies",
      description:
        "Ce site utilise des cookies pour assurer son fonctionnement, mesurer l'audience et améliorer votre expérience. Vous choisissez ce que vous acceptez.",
      acceptAll: "Tout accepter",
      necessaryOnly: "Nécessaires seulement",
      configure: "Configurer",
      savePrefs: "Enregistrer mes choix",
      back: "Retour",
      panelTitle: "Préférences de cookies",
      panelDescription:
        "Activez ou désactivez chaque catégorie. Les cookies nécessaires ne peuvent pas être désactivés, ils sont essentiels au fonctionnement du site.",
      categories: {
        necessary: {
          label: "Nécessaires",
          desc: "Indispensables au fonctionnement du site (session, sécurité, préférences de langue).",
        },
        analytics: {
          label: "Analytiques",
          desc: "Nous aident à comprendre l'utilisation du site pour l'améliorer (pages vues, temps passé).",
        },
        preferences: {
          label: "Préférences",
          desc: "Retiennent vos choix d'affichage et de personnalisation d'une visite à l'autre.",
        },
        marketing: {
          label: "Marketing",
          desc: "Utilisés pour proposer du contenu ou des publicités pertinentes.",
        },
      },
    },
    // Palette — surchargable, ces valeurs deviennent des CSS custom properties.
    theme: {
      bg: "#171512",
      surface: "#221f1b",
      text: "#f1ece3",
      textMuted: "#b7ada0",
      accent: "#c98f4a",
      accentText: "#171512",
      border: "#3a352e",
      radius: "10px",
      font: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    },
  };

  function deepMerge(base, override) {
    if (!override) return base;
    var out = {};
    for (var k in base) {
      if (
        override[k] &&
        typeof override[k] === "object" &&
        !Array.isArray(override[k]) &&
        typeof base[k] === "object"
      ) {
        out[k] = deepMerge(base[k], override[k]);
      } else {
        out[k] = override[k] !== undefined ? override[k] : base[k];
      }
    }
    return out;
  }

  var cfg = deepMerge(defaultConfig, window.CookieConsentConfig || {});
  var L = cfg.locale;

  // ---------- Utilitaires cookies ----------
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie =
      name + "=" + encodeURIComponent(JSON.stringify(value)) +
      ";expires=" + d.toUTCString() + ";path=/;SameSite=Lax";
  }

  function getCookie(name) {
    var match = document.cookie.match(
      new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
    );
    if (!match) return null;
    try {
      return JSON.parse(decodeURIComponent(match[1]));
    } catch (e) {
      return null;
    }
  }

  window.getCookieConsent = function () {
    return getCookie(cfg.cookieName);
  };

  function emitConsent(consent) {
    window.dispatchEvent(new CustomEvent("cookieConsentUpdated", { detail: consent }));
  }

  // ---------- Styles ----------
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
        animation: cc-slide-in .4s ease-out;
      }
      @keyframes cc-slide-in {
        from { transform: translateY(${cfg.position === "top" ? "-100%" : "100%"}); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .cc-banner {
        background: var(--cc-bg); color: var(--cc-text);
        border-top: 1px solid var(--cc-border);
        padding: 20px 24px; display: flex; gap: 20px; align-items: center;
        flex-wrap: wrap; max-width: 1100px; margin: 0 auto;
      }
      .cc-text { flex: 1 1 320px; min-width: 240px; }
      .cc-text h2 { font-size: 15px; font-weight: 600; margin: 0 0 4px; color: var(--cc-text); }
      .cc-text p { font-size: 13.5px; line-height: 1.5; margin: 0; color: var(--cc-text-muted); max-width: 62ch; }
      .cc-actions { display: flex; gap: 10px; flex-wrap: wrap; flex-shrink: 0; }
      .cc-btn {
        font-family: var(--cc-font); font-size: 13.5px; font-weight: 500;
        padding: 10px 16px; border-radius: var(--cc-radius); cursor: pointer;
        border: 1px solid var(--cc-border); background: transparent; color: var(--cc-text);
        transition: filter .15s ease, transform .1s ease; white-space: nowrap;
      }
      .cc-btn:hover { filter: brightness(1.2); }
      .cc-btn:active { transform: scale(.97); }
      .cc-btn-primary { background: var(--cc-accent); color: var(--cc-accent-text); border-color: var(--cc-accent); }
      .cc-btn-ghost { background: transparent; }

      .cc-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,.55);
        z-index: 999998; display: flex; align-items: center; justify-content: center;
        padding: 20px; font-family: var(--cc-font);
      }
      .cc-panel {
        background: var(--cc-surface); color: var(--cc-text); border: 1px solid var(--cc-border);
        border-radius: calc(var(--cc-radius) + 4px); max-width: 480px; width: 100%;
        max-height: 85vh; overflow-y: auto; padding: 24px;
      }
      .cc-panel h2 { font-size: 17px; margin: 0 0 6px; }
      .cc-panel > p { font-size: 13px; color: var(--cc-text-muted); line-height: 1.5; margin: 0 0 18px; }
      .cc-cat {
        display: flex; justify-content: space-between; align-items: flex-start;
        gap: 14px; padding: 14px 0; border-top: 1px solid var(--cc-border);
      }
      .cc-cat:first-of-type { border-top: none; }
      .cc-cat-label { font-size: 14px; font-weight: 600; margin: 0 0 3px; }
      .cc-cat-desc { font-size: 12.5px; color: var(--cc-text-muted); line-height: 1.45; margin: 0; }
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
      .cc-switch input:disabled + .cc-slider { opacity: .5; cursor: not-allowed; }
      .cc-panel-actions { display: flex; justify-content: space-between; gap: 10px; margin-top: 20px; }
      @media (max-width: 520px) {
        .cc-banner { padding: 16px; }
        .cc-actions { width: 100%; }
        .cc-btn { flex: 1 1 auto; }
      }
    `;
    var style = document.createElement("style");
    style.setAttribute("data-cc-style", "");
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ---------- Construction du bandeau ----------
  function buildBanner() {
    var root = document.createElement("div");
    root.className = "cc-root";
    root.innerHTML =
      '<div class="cc-banner" role="dialog" aria-live="polite" aria-label="' + L.title + '">' +
        '<div class="cc-text"><h2>' + L.title + "</h2><p>" + L.description + "</p></div>" +
        '<div class="cc-actions">' +
          '<button type="button" class="cc-btn cc-btn-ghost" data-cc="configure">' + L.configure + "</button>" +
          '<button type="button" class="cc-btn" data-cc="necessary">' + L.necessaryOnly + "</button>" +
          '<button type="button" class="cc-btn cc-btn-primary" data-cc="acceptAll">' + L.acceptAll + "</button>" +
        "</div>" +
      "</div>";
    return root;
  }

  function buildPanel(currentState) {
    var overlay = document.createElement("div");
    overlay.className = "cc-overlay";

    var keys = ["necessary", "analytics", "preferences", "marketing"];
    var rows = keys
      .map(function (key) {
        var cat = L.categories[key];
        var checked = currentState[key] ? "checked" : "";
        var disabled = key === "necessary" ? "disabled" : "";
        return (
          '<div class="cc-cat">' +
            '<div><p class="cc-cat-label">' + cat.label + "</p>" +
            '<p class="cc-cat-desc">' + cat.desc + "</p></div>" +
            '<label class="cc-switch">' +
              '<input type="checkbox" data-cc-cat="' + key + '" ' + checked + " " + disabled + ">" +
              '<span class="cc-slider"></span>' +
            "</label>" +
          "</div>"
        );
      })
      .join("");

    overlay.innerHTML =
      '<div class="cc-panel" role="dialog" aria-modal="true" aria-label="' + L.panelTitle + '">' +
        "<h2>" + L.panelTitle + "</h2>" +
        "<p>" + L.panelDescription + "</p>" +
        rows +
        '<div class="cc-panel-actions">' +
          '<button type="button" class="cc-btn cc-btn-ghost" data-cc="back">' + L.back + "</button>" +
          '<button type="button" class="cc-btn cc-btn-primary" data-cc="save">' + L.savePrefs + "</button>" +
        "</div>" +
      "</div>";
    return overlay;
  }

  // ---------- Logique principale ----------
  function init() {
    var existing = getCookie(cfg.cookieName);
    if (existing) {
      emitConsent(existing); // permet à ta page de configurer les scripts au chargement
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
        finalize({ necessary: true, analytics: true, preferences: true, marketing: true });
      } else if (action === "necessary") {
        finalize({ necessary: true, analytics: false, preferences: false, marketing: false });
      } else if (action === "configure") {
        var overlay = buildPanel({ necessary: true, analytics: false, preferences: false, marketing: false });
        document.body.appendChild(overlay);

        overlay.addEventListener("click", function (ev) {
          var a = ev.target.getAttribute("data-cc");
          if (a === "back") {
            overlay.remove();
          } else if (a === "save") {
            var state = { necessary: true };
            overlay.querySelectorAll("[data-cc-cat]").forEach(function (input) {
              state[input.getAttribute("data-cc-cat")] = input.checked;
            });
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
