FROM node:alpine

WORKDIR /usr/src/app

COPY package*.json index.js ./
COPY public ./public     
COPY scripts ./scripts

RUN npm install

EXPOSE 8080

CMD ["node", "index.js"]
