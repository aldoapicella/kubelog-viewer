# --- build stage ---------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build 

# --- runtime stage -------------------------------------------------
FROM nginx:1.27-alpine    
COPY --from=builder /app/dist /usr/share/nginx/html
# optional: tweak /etc/nginx/conf.d/default.conf for SPA fallback
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://127.0.0.1 || exit 1
