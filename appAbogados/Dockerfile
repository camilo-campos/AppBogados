FROM node:alpine
WORKDIR /usr/src/app
COPY package*.json index.js ./
COPY ./appABogados /usr/src/app
RUN npm install
EXPOSE 8080
CMD ["node", "index.js"]