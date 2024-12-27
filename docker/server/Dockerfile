FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Copy environment template but don't copy actual .env
COPY .env.example ./

# Build TypeScript
RUN npm run build

EXPOSE 3000

# Use environment variables from docker-compose
CMD ["npm", "start"]