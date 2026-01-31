# Development Dockerfile
FROM node:18-alpine AS development
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Expose ports for Next.js and CMS proxy
EXPOSE 3000 8081

# Start development server with CMS
CMD ["npm", "run", "dev:cms"]

# Production Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Copy source
COPY . .

# Build
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/content ./content

EXPOSE 3000
CMD [ "npm", "run", "start" ]