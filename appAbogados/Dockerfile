FROM node:alpine

WORKDIR /usr/src/app

COPY package*.json index.js ./
COPY public ./public     
COPY scripts ./scripts
COPY assets ./assets

RUN npm install

EXPOSE 8080

CMD ["node", "index.js"]
