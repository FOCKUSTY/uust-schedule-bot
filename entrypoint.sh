#!/bin/sh
set -e
npx prisma migrate deploy --schema ./src/database/schema.prisma
exec node dist/telegram/start.js