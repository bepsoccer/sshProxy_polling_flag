FROM node:9
WORKDIR /var/poller
COPY /src/package*.json ./
RUN npm install
COPY /src/. ./
CMD [ "npm", "start" ]