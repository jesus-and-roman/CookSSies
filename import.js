
/*!
 * import.js — helper d'intégration rapide
 * Place ce fichier + cookie-consent.js + tracker.js dans ton site.
 *
 * Usage minimal :
 *
 * <script>
 *   window.CookieConsentConfig = { ... }; // optionnel
 *   window.TrackerConfig = {
 *     supabaseUrl: "https://xxxx.supabase.co",
 *     supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // clé anon
 *     table: "analytics_events",
 *     debug: false
 *   };
 * </script>
 * <script src="cookie-consent.js" defer></script>
 * <script src="tracker.js" defer></script>
 */
(function () {
  "use strict";

  // Ce fichier sert surtout de documentation exécutable.
  // Tu n'as rien d'autre à faire : charge juste les deux scripts dans le bon ordre.

  if (typeof window !== "undefined") {
    window.CookieTrackerReady = true;
  }
})();
