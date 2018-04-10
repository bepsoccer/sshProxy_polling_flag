FROM node:alpine
WORKDIR /var/poller
COPY /src/package*.json ./
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python && \
  npm install node-gyp -g &&\
  npm install && \
  apk del native-deps
COPY /src/. ./
CMD [ "npm", "start" ]