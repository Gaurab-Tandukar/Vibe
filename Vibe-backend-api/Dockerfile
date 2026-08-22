# ---- Stage 1: install deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 2: runtime ----
FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p uploads/attachments uploads/avatars uploads/banners uploads/groupAvatars
EXPOSE 3000
CMD ["node", "server.js"]