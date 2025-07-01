# encryptx-frontend/Dockerfile

# Stage 1: Build the application
FROM node:slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY pnpm-lock.yaml ./
COPY package.json ./
RUN pnpm install

# Copy the rest of the source code and build the app
COPY . .
RUN pnpm run build

# Stage 2: Create the production image
FROM node:latest

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only what's needed for runtime
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install only production dependencies
RUN pnpm install --prod

EXPOSE 3000

# Start the Next.js production server
CMD ["pnpm", "start"]