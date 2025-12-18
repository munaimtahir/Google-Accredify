#!/bin/sh
set -eu

SSL_DIR="/etc/nginx/ssl"
CERT="${SSL_DIR}/fullchain.pem"
KEY="${SSL_DIR}/privkey.pem"

if [ ! -f "$CERT" ] || [ ! -f "$KEY" ]; then
  mkdir -p "$SSL_DIR"
  # Generate a self-signed certificate so HTTPS can work out-of-the-box for IP-based deployments.
  # Replace by mounting real certs into /etc/nginx/ssl for production.
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout "$KEY" \
    -out "$CERT" \
    -subj "/CN=localhost" >/dev/null 2>&1
fi

exec "$@"


