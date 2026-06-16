# Use node Alpine image for lightweight build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build Vite frontend and compile the backend server using esbuild
RUN npm run build

# --- Production Environment ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Expose port (Internal container port)
EXPOSE 3000

# Start command
CMD ["npm", "start"]
