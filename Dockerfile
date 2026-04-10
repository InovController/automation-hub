FROM node:22

WORKDIR /app

COPY . .

RUN cd apps/web && npm install && npm run build

RUN cd apps/api && npm install && npm run build && npx prisma generate

EXPOSE 3000

WORKDIR /app/apps/api
CMD ["node", "dist/main"]
