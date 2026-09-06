FROM node:20-alpine AS build

WORKDIR /app

COPY server/package*.json ./
RUN npm ci

COPY server/prisma ./prisma
COPY server/prisma.config.ts ./
RUN npx prisma generate

COPY server/tsconfig*.json server/nest-cli.json ./
COPY server/src ./src
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY server/package*.json ./
COPY server/prisma ./prisma
COPY server/prisma.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
