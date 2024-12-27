#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Setting up SpotifyConcert project...${NC}"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}MySQL is not installed. Installing...${NC}"
    brew install mysql
    brew services start mysql
    
    # Secure MySQL installation
    echo -e "${GREEN}Securing MySQL installation...${NC}"
    mysql_secure_installation
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Installing...${NC}"
    brew install node
fi

# Create database
echo -e "${GREEN}Creating database...${NC}"
mysql -u root -e "CREATE DATABASE IF NOT EXISTS spotifyconcert_db;"

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
cd src/server && npm install

# Create .env if it doesn't exist
if [ ! -f "src/server/.env" ]; then
    echo -e "${GREEN}Creating .env file...${NC}"
    cat > src/server/.env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=spotifyconcert_db
DB_PORT=3306
PORT=3000
NODE_ENV=development

SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/v1/spotify/callback
EOF
fi

# Go to discord-bot directory and setup node
cd ../discord-bot && npm install
echo -e "${GREEN}Setting up Discord Bot...${NC}"

# create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${GREEN}Creating .env file...${NC}"
    cat > .env << EOF
DISCORD_TOKEN=
CLIENT_ID=
BACKEND_URL=http://localhost:3000/api/v1
EOF
fi

echo -e "${GREEN}Setup complete!${NC}"