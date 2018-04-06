FROM node:9
RUN apt-get update && apt-get install -y cron
WORKDIR /var/poller
COPY /src/package*.json ./
RUN npm install
COPY /src/. ./
COPY poller-cron /etc/cron.d/poller-cron
RUN chmod 0644 /etc/cron.d/poller-cron
CMD touch /var/log/cron.log && cron && tail -f /var/log/cron.log