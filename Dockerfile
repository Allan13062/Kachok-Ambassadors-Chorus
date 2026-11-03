# ---- Build stage: builds the React site and bundles the server ----
FROM node:22-alpine AS builder
WORKDIR /app

# "npm install" (not "npm ci"): package-lock.json is out of sync with package.json
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN npm install --omit=dev

EXPOSE 3000
CMD ["npm", "start"]
