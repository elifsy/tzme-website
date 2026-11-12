#!/usr/bin/env bash
set -euo pipefail
umask 0027
cd /opt/tzme/app
set -a
source /etc/tzme/backend.env
set +a
: "${TZME_DB_PASSWORD:?Set TZME_DB_PASSWORD in /etc/tzme/backend.env}"
if [[ "$TZME_DB_PASSWORD" == REPLACE_WITH_CLOUD_DATABASE_PASSWORD ]]; then
    echo 'Replace the example database password before starting.' >&2
    exit 1
fi
[[ -f /var/www/tzme/index.html ]] || { echo 'Frontend index.html is missing.' >&2; exit 1; }
exec > >(tee -a /var/log/tzme/backend.log) 2>&1
exec /usr/bin/java -Xms256m -Xmx1536m -XX:+ExitOnOutOfMemoryError \
    -jar /opt/tzme/app/tzme-cms-1.0.0.jar
