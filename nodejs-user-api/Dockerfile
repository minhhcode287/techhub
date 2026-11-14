# ==========================================
# TechHub User API - Backend Dockerfile
# Node.js 20 LTS Alpine Image
# ==========================================
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Install curl/wget for health check
RUN apk add --no-cache wget

# Copy package manifests first to leverage Docker layer caching
COPY package.json ./

# Install production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy the rest of the application source code
COPY . .

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend port
EXPOSE 5000

# Health check to ensure server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application using npm start (which runs node src/server.js)
CMD ["node", "src/server.js"]
