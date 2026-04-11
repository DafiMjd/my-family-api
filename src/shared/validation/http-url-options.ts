/**
 * Options passed to express-validator `isURL()` (validator.js).
 * `require_tld: false` allows `localhost`, numeric IPs, single-label hosts (dev / VPS without a domain).
 */
export const HTTP_HTTPS_URL_OPTIONS = {
  protocols: ["http", "https"] as ("http" | "https")[],
  require_protocol: true,
  require_tld: false,
};
