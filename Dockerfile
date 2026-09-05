# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install backend dependencies
COPY api/package*.json ./api/
RUN cd api && npm ci --omit=dev

# Copy backend source
COPY api/ ./api/

# Copy built frontend
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Create data directory
RUN mkdir -p api/data

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

WORKDIR /app/api
CMD ["node", "server.js"]
