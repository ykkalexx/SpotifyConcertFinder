FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY .env.example .env

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "start"]