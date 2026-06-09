#!/bin/sh
set -e

escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\r//g'
}

API_BASE_URL="$(escape_js "${VITE_API_BASE_URL:-}")"
AUTH_USER="$(escape_js "${VITE_API_BASIC_AUTH_USER:-}")"
AUTH_PASSWORD="$(escape_js "${VITE_API_BASIC_AUTH_PASSWORD:-}")"

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  apiBaseUrl: "${API_BASE_URL}",
  apiBasicAuthUser: "${AUTH_USER}",
  apiBasicAuthPassword: "${AUTH_PASSWORD}"
};
EOF

exec nginx -g "daemon off;"
