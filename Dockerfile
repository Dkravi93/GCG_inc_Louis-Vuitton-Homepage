# Multi-stage build for React frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build the React app
RUN npm run build

# Node.js backend stage
FROM node:18-alpine AS backend

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S gcg -u 1001

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy backend source
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create necessary directories
RUN mkdir -p uploads logs
RUN chown -R gcg:nodejs /app

# Switch to non-root user
USER gcg

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]