#!/bin/bash

# Formbricks VPS Deployment Script
# Run this on your Hostinger VPS

set -e

echo "=========================================="
echo "  Formbricks VPS Deployment Script"
echo "=========================================="

# Update system
echo "[1/7] Updating system..."
apt update && apt upgrade -y

# Install Node.js 18
echo "[2/7] Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install pnpm
echo "[3/7] Installing pnpm..."
npm install -g pnpm

# Install Docker
echo "[4/7] Installing Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
echo "[5/7] Installing Docker Compose..."
apt install -y docker-compose-plugin

# Install nginx and certbot
echo "[6/7] Installing Nginx and Certbot..."
apt install -y nginx certbot python3-certbot-nginx

# Install PM2
echo "[7/7] Installing PM2..."
npm install -g pm2

# Create app directory
mkdir -p /var/www/formbricks

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Upload your project to /var/www/formbricks"
echo "2. Configure your .env file"
echo "3. Run: cd /var/www/formbricks && pnpm install && pnpm build"
echo "4. Start with: pm2 start 'pnpm start' --name formbricks"
echo ""

# Show versions
echo "Installed versions:"
node --version
pnpm --version
docker --version
nginx -v
