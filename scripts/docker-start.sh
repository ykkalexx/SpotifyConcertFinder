#!/bin/bash

GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Starting services with Docker...${NC}"

docker-compose up --build -d

echo -e "${GREEN}Services started successfully!${NC}"