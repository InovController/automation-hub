FROM node:22

WORKDIR /app

COPY . .

RUN cd apps/web && npm install && npm run build

RUN cd apps/api && npm install && npx prisma generate && npm run build && ls -la /app/apps/api/dist/

EXPOSE 3000

COPY apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/apps/api
CMD ["/entrypoint.sh"]
