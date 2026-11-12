#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Use sudo bash install-files.sh /absolute/release/directory' >&2; exit 1; }
release=$(realpath "${1:?Pass the extracted release directory}")
config="$release/deployment"
for item in "$release/frontend/index.html" "$release/backend/tzme-cms-1.0.0.jar" "$config/tzme-tmux"; do
    [[ -f "$item" ]] || { echo "Missing $item" >&2; exit 1; }
done
[[ -d "$release/uploads" ]] || { echo 'Missing uploads directory.' >&2; exit 1; }
for item in /etc/tzme/backend.env /var/www/tzme/index.html /opt/tzme/app/tzme-cms-1.0.0.jar; do
    [[ ! -e "$item" ]] || { echo "Existing installation at $item. Use the update procedure instead." >&2; exit 1; }
done
if ! id tzme >/dev/null 2>&1; then adduser --system --group --no-create-home tzme; fi
install -d -o root -g tzme -m 750 /etc/tzme
install -d -m 755 /opt/tzme/app /opt/tzme/bin /var/www/tzme
install -d -o tzme -g tzme -m 750 /var/lib/tzme/uploads /var/log/tzme
touch /var/log/tzme/backend.log /var/log/tzme/nginx-access.log /var/log/tzme/nginx-error.log
chown tzme:tzme /var/log/tzme/backend.log /var/log/tzme/nginx-access.log /var/log/tzme/nginx-error.log
chmod 640 /var/log/tzme/backend.log /var/log/tzme/nginx-access.log /var/log/tzme/nginx-error.log
install -d -o root -g root -m 700 /var/backups/tzme /etc/tzme/certs
install -d -o www-data -g www-data -m 700 /var/lib/nginx/body /var/lib/nginx/proxy
cp -a "$release/frontend/." /var/www/tzme/
chown -R root:root /var/www/tzme
chmod -R u=rwX,go=rX /var/www/tzme
install -o root -g root -m 644 "$release/backend/tzme-cms-1.0.0.jar" /opt/tzme/app/tzme-cms-1.0.0.jar
cp -a "$release/uploads/." /var/lib/tzme/uploads/
chown -R tzme:tzme /var/lib/tzme/uploads
chmod -R u=rwX,g=rX,o= /var/lib/tzme/uploads
for item in backend.sh frontend.sh; do install -m 755 "$config/$item" "/opt/tzme/bin/$item"; done
install -m 755 "$config/tzme-tmux" /usr/local/sbin/tzme-tmux
for item in nginx.conf nginx-routes.conf nginx-https.conf nginx-local.conf tmux.conf; do
    install -o root -g tzme -m 640 "$config/$item" "/etc/tzme/$item"
done
install -o root -g tzme -m 640 "$config/nginx-local.conf" /etc/tzme/nginx-site.conf
install -o root -g tzme -m 640 "$config/backend.env.example" /etc/tzme/backend.env
install -m 644 "$config/tzme-tmux.service" /etc/systemd/system/tzme-tmux.service
install -m 644 "$config/logrotate.conf" /etc/logrotate.d/tzme
echo 'Files installed. Next: import current SQL into an empty database and edit /etc/tzme/backend.env.'
echo 'No database import, DNS change, service start, or public listener was performed.'
