# Use Node.js 22 Alpine image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p public/uploads/logos public/uploads/buyers public/uploads/products public/uploads/attachments public/uploads/messages logs temp
RUN chown -R node:node /app
RUN chmod -R 777 public/uploads logs temp
USER node

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health || exit 1

# Start application
CMD ["npm", "start"]