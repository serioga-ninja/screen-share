FROM node:6

LABEL author="Serioga"

ENV NODE_ENV=local

COPY . /var/www
WORKDIR /var/www/projects/client

RUN npm install

VOLUME ["/var/www"]

EXPOSE 3000

ENTRYPOINT ["npm", "start"]
