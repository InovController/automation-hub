#!/bin/bash
# Rodado automaticamente pelo GitHub Actions a cada git push na master
set -e

APP_DIR="/opt/automation-hub"

echo "[deploy] Iniciando deploy - $(date)"

cd $APP_DIR

# Pegar últimas alterações sem perder .env e data/
git fetch origin master
git reset --hard origin/master

# Build do frontend
echo "[deploy] Build do frontend..."
cd $APP_DIR/apps/web
npm install --prefer-offline
npm run build

# Build da API
echo "[deploy] Build da API..."
cd $APP_DIR/apps/api
npm install --prefer-offline
npm run build
npx prisma generate
npx prisma migrate deploy

# Reinicia o serviço
echo "[deploy] Reiniciando serviço..."
sudo systemctl restart automation-hub

# Aguarda o serviço iniciar
sleep 3
sudo systemctl is-active --quiet automation-hub && \
  echo "[deploy] Serviço online!" || \
  (echo "[deploy] ERRO: serviço não iniciou!" && sudo journalctl -u automation-hub -n 30 && exit 1)

echo "[deploy] Deploy finalizado - $(date)"
