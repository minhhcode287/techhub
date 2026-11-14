# ==========================================
# TechHub Client - Frontend Dockerfile
# Multi-stage Build: Node 20 (Build) -> Nginx Alpine (Production)
# ==========================================

# Stage 1: Build React/Vite SPA
FROM node:20-alpine AS build

WORKDIR /app

# Copy package manifests first for optimal caching
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build production bundle
RUN npm run build && \
    if [ ! -d "/dist" ] && [ -d "/app/dist" ]; then cp -r /app/dist /dist; fi

# Stage 2: Serve static files with high-performance Nginx
FROM nginx:alpine AS runner

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from build stage
COPY --from=build /dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Healthcheck for nginx container
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/healthz || exit 1

# Start Nginx server in foreground
CMD ["nginx", "-g", "daemon off;"]
