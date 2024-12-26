#!/bin/bash

GREENGREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

cd src/server

echo -e "${GREEN}Starting server...${NC}"
npm start