FROM node:22

RUN apt-get update && apt-get install -y python3 python3-pip python3-venv --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN cd apps/web && npm install && npm run build

RUN cd apps/api && npm install && npx prisma generate && npm run build

EXPOSE 3000

WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && exec node /app/apps/api/dist/src/main"]
