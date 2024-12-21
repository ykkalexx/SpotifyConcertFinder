#!/bin/bash

GREENGREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

if ! pg_isready > /dev/null; then
    echo -e "${RED}PostgreSQL is not running. Starting...${NC}"
    brew services start postgresql@14
fi

cd src/server

echo -e "${GREEN}Starting server...${NC}"
npm run start