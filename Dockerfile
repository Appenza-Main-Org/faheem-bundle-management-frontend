# ══════════════════════════════════════════════════════════════════════════════
# Bundle Admin Frontend - Multi-stage Dockerfile
# ══════════════════════════════════════════════════════════════════════════════

# ┌─────────────────────────────────────────────────────────────────────────────┐
# │ Stage 1: Build                                                              │
# └─────────────────────────────────────────────────────────────────────────────┘
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ┌─────────────────────────────────────────────────────────────────────────────┐
# │ Stage 2: Runtime (nginx)                                                    │
# └─────────────────────────────────────────────────────────────────────────────┘
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy entrypoint script for runtime config injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Use custom entrypoint to inject runtime config
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
