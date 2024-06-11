FROM node:alpine
WORKDIR /usr/src/app
COPY package*.json index.js ./
COPY ./appABogados ./
RUN npm install
EXPOSE 8080
CMD ["node", "index.js"]