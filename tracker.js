/*!
 * tracker.js — collecte analytics raisonnable (uniquement si consentement analytics)
 * Données : pageview, temps, referrer, device, navigateur, OS, résolution, langue,
 * timezone, clics (liens/boutons), profondeur de scroll, session.
 * IP partielle optionnelle. Aucun tracking invasif (pas de souris précise, pas d'inputs, etc.)
 *
 * Config via window.TrackerConfig = {
 *   supabaseUrl: "https://xxx.supabase.co",
 *   supabaseKey: "eyJ...",          // anon key
 *   table: "analytics_events",      // optionnel
 *   debug: false
 * }
 */
(function () {
  "use strict";

  var cfg = Object.assign({
    supabaseUrl: "",
    supabaseKey: "",
    table: "analytics_events",
    debug: false
  }, window.TrackerConfig || {});

  var sessionId = null;
  var pageStart = Date.now();
  var maxScroll = 0;
  var consent = null;
  var sent = false;

  function log() {
    if (cfg.debug) console.log.apply(console, ["[tracker]"].concat([].slice.call(arguments)));
  }

  function getSessionId() {
    if (sessionId) return sessionId;
    try {
      sessionId = sessionStorage.getItem("cc_sid");
      if (!sessionId) {
        sessionId = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("cc_sid", sessionId);
      }
    } catch (e) {
      sessionId = "s_" + Date.now();
    }
    return sessionId;
  }

  function getDeviceInfo() {
    var ua = navigator.userAgent;
    var platform = navigator.platform || "";
    var lang = navigator.language || navigator.userLanguage || "";
    var screenW = window.screen ? window.screen.width : 0;
    var screenH = window.screen ? window.screen.height : 0;
    var dpr = window.devicePixelRatio || 1;
    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}

    var browser = "unknown";
    if (/edg/i.test(ua)) browser = "Edge";
    else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
    else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
    else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";
    else if (/msie|trident/i.test(ua)) browser = "IE";

    var os = "unknown";
    if (/windows/i.test(ua)) os = "Windows";
    else if (/macintosh|mac os/i.test(ua)) os = "macOS";
    else if (/linux/i.test(ua) && !/android/i.test(ua)) os = "Linux";
    else if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";

    var deviceType = /mobi|android|iphone|ipad|ipod/i.test(ua) ? "mobile" : "desktop";
    if (/ipad|tablet/i.test(ua)) deviceType = "tablet";

    return {
      browser: browser,
      os: os,
      deviceType: deviceType,
      language: lang,
      timezone: tz,
      screen: screenW + "x" + screenH,
      dpr: dpr,
      platform: platform
    };
  }

  function sendEvent(type, extra) {
    if (!consent || !consent.analytics) return;
    if (!cfg.supabaseUrl || !cfg.supabaseKey) {
      log("Supabase non configuré, event ignoré:", type);
      return;
    }

    var payload = {
      session_id: getSessionId(),
      event_type: type,
      url: location.href,
      path: location.pathname,
      title: document.title || "",
      referrer: document.referrer || "",
      data: Object.assign({}, getDeviceInfo(), extra || {}),
      ip_partial: consent.ip_partial ? true : false,
      created_at: new Date().toISOString()
    };

    // On n'envoie jamais l'IP complète depuis le client.
    // Si tu veux une IP partielle côté serveur, utilise une Edge Function Supabase.

    fetch(cfg.supabaseUrl + "/rest/v1/" + cfg.table, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": cfg.supabaseKey,
        "Authorization": "Bearer " + cfg.supabaseKey,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) log("Erreur envoi", r.status);
      else log("Envoyé:", type);
    }).catch(function (err) {
      log("Fetch error", err);
    });
  }

  function trackPageView() {
    sendEvent("pageview", {
      loadTime: performance && performance.timing ? (performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart) : null
    });
  }

  function trackTimeOnPage() {
    var seconds = Math.round((Date.now() - pageStart) / 1000);
    if (seconds < 2) return;
    sendEvent("time_on_page", { seconds: seconds, maxScroll: maxScroll });
  }

  function trackClick(e) {
    var el = e.target.closest("a, button, [role='button'], input[type='submit'], input[type='button']");
    if (!el) return;
    var tag = el.tagName.toLowerCase();
    var text = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 80);
    var href = el.href || null;
    sendEvent("click", {
      tag: tag,
      text: text,
      href: href,
      x: Math.round(e.clientX),
      y: Math.round(e.clientY)
    });
  }

  function trackScroll() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    var winHeight = window.innerHeight;
    var percent = docHeight > winHeight ? Math.round((scrollTop / (docHeight - winHeight)) * 100) : 100;
    if (percent > maxScroll) maxScroll = percent;
  }

  function start() {
    if (sent) return;
    sent = true;
    log("Tracking démarré");

    trackPageView();

    document.addEventListener("click", trackClick, true);
    window.addEventListener("scroll", trackScroll, { passive: true });

    window.addEventListener("beforeunload", trackTimeOnPage);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") trackTimeOnPage();
    });

    // heartbeat toutes les 30s si la page reste ouverte
    setInterval(function () {
      if (document.visibilityState === "visible") {
        sendEvent("heartbeat", { seconds: Math.round((Date.now() - pageStart) / 1000), maxScroll: maxScroll });
      }
    }, 30000);
  }

  function onConsent(e) {
    consent = e.detail || window.getCookieConsent();
    if (consent && consent.analytics) {
      start();
    } else {
      log("Analytics refusé");
    }
  }

  // écoute le consentement
  window.addEventListener("cookieConsentUpdated", onConsent);

  // si déjà présent au chargement
  if (window.getCookieConsent) {
    var existing = window.getCookieConsent();
    if (existing) {
      consent = existing;
      if (existing.analytics) start();
    }
  }
})();
