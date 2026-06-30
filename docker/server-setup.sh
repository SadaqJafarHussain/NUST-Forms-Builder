#!/bin/bash
# ============================================================
# NUST Forms Builder — Server Initial Setup & Hardening
# Run ONCE on a fresh Ubuntu 22.04/24.04 VPS as root.
# ============================================================
set -euo pipefail

echo "======================================================"
echo "  NUST Forms Builder — Server Setup"
echo "======================================================"

# ── 1. System update ─────────────────────────────────────
apt-get update -y && apt-get upgrade -y
apt-get install -y ufw curl git

# ── 2. Firewall: allow SSH, HTTP, HTTPS only ─────────────
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (Caddy redirects to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw allow 443/udp   # HTTP/3 (QUIC)
ufw --force enable
echo "Firewall configured."

# ── 3. Install Docker (no build tools, runtime only) ─────
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "Docker installed."
else
  echo "Docker already installed."
fi

# ── 4. Harden Docker daemon ──────────────────────────────
# Never expose the Docker socket over TCP — keep it Unix socket only.
# This prevents crypto miners from hijacking the daemon via port 2375/2376.
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "hosts": ["unix:///var/run/docker.sock"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "no-new-privileges": true
}
EOF
systemctl restart docker
echo "Docker daemon hardened (socket-only, no TCP)."

# ── 5. Create deploy directory ───────────────────────────
mkdir -p /opt/nust-forms
echo "Deploy directory: /opt/nust-forms"

echo ""
echo "======================================================"
echo "  Setup complete."
echo ""
echo "  Next steps:"
echo "  1. Copy docker/docker-compose.prod.yml to /opt/nust-forms/"
echo "  2. Copy docker/.env.prod.example to /opt/nust-forms/.env.prod"
echo "     and fill in all values"
echo "  3. Copy docker/Caddyfile to /opt/nust-forms/"
echo "  4. Run: cd /opt/nust-forms && docker compose -f docker-compose.prod.yml up -d"
echo "======================================================"
