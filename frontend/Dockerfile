FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Development command (can be overridden)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 