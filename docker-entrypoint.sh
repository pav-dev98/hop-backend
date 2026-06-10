#!/bin/sh
set -e

# Sincroniza el schema de Prisma con la base de datos. Se usa `db push` en
# lugar de `migrate deploy` porque el proyecto aún no tiene carpeta de
# migraciones versionadas; crea/actualiza las tablas según schema.prisma.
echo "▶ Aplicando schema a la base de datos (prisma db push)..."
npx prisma db push --skip-generate --accept-data-loss

# Seed opcional, controlado por la variable SEED_ON_START.
if [ "$SEED_ON_START" = "true" ]; then
  echo "▶ Cargando datos de prueba (seed)..."
  npm run db:seed || echo "⚠ Seed falló o ya estaba cargado; continuando."
fi

echo "▶ Iniciando aplicación..."
exec "$@"
