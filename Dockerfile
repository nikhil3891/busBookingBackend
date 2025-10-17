# ✅ Use lightweight Node.js image
FROM node:22-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files first
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of code
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]
