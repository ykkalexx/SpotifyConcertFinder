#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Setting up SpotifyConcert project...${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Installing...${NC}"
    brew install postgresql@14
    brew services start postgresql@14
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Installing...${NC}"
    brew install node
fi

# Create database
echo -e "${GREEN}Creating database...${NC}"
createdb spotifyconcert_db || true

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
cd src/server && npm install

# Create .env if it doesn't exist
if [ ! -f "src/server/.env" ]; then
    echo -e "${GREEN}Creating .env file...${NC}"
    cp src/server/.env.example src/server/.env
fi

echo -e "${GREEN}Setup complete!${NC}"