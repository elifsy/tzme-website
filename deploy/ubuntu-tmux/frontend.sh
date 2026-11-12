#!/usr/bin/env bash
set -euo pipefail
/usr/sbin/nginx -t -c /etc/tzme/nginx.conf
exec /usr/sbin/nginx -c /etc/tzme/nginx.conf -g 'daemon off;'
