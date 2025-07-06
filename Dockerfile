FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY .env ./
COPY . .

EXPOSE 3000

RUN npm run build

CMD ["npm", "start"]