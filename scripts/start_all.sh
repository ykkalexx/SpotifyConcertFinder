#!/bin/bash

GREENGREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

cd src/server
echo -e "${GREEN}Starting server...${NC}"
npm start

cd src/discord-bot
echo -e "${GREEN}Starting discord bot...${NC}"
npm run dev

echo -e "${GREEN}App is ready to run${NC}"