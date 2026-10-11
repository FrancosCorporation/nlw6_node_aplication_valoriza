FROM node:24-alpine AS build

WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine

WORKDIR /app
RUN apk add --no-cache libstdc++ \
    && mkdir -p /app/database \
    && chmod 700 /app/database \
    && chown node:node /app/database
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
USER node

CMD ["node", "dist/server.js"]
