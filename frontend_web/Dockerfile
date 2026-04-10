# Multi-stage Dockerfile for Quasar Frontend
# Stage 1: Build stage
FROM node:22-alpine AS builder

# Install pnpm globally (optional, for compatibility)
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --ignore-scripts

# Copy application files
COPY . .

# Run quasar prepare to generate necessary files
RUN npx quasar prepare

# Build the application for production
RUN npm run build

# Stage 2: Production server (Nginx)
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist/spa /usr/share/nginx/html

# Copy custom nginx configuration (optional)
# COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Stage 3: Development stage
FROM node:22-alpine AS development

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev)
RUN npm ci --ignore-scripts

# Copy application files
COPY . .

# Run quasar prepare
RUN npx quasar prepare

# Expose port 9000
EXPOSE 9000

# Default command for development
CMD ["npm", "run", "dev", "--", "--port", "9000"]
