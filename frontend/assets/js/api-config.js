/* Em produção, o site e a API usam o mesmo domínio. Localmente, o Live Server
   continua encaminhando as chamadas para a API Spring em localhost:8080. */
(function () {
  "use strict";
  var localHost = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  var defaultApi = localHost && window.location.port !== "8080"
    ? "http://localhost:8080"
    : window.location.origin;
  window.ONG_API_BASE_URL = window.ONG_API_BASE_URL || defaultApi;
}());
