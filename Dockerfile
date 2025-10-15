# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production

# Copy source code
COPY . .

# Remove dev dependencies and clean up
RUN yarn install --production && yarn cache clean

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S slex -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=slex:nodejs /app .

# Create necessary directories
RUN mkdir -p public/uploads && chown -R slex:nodejs public/uploads

# Switch to non-root user
USER slex

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "app.js"]
