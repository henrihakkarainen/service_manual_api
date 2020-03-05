#! Dockerfile
FROM node:slim

WORKDIR /opt/api

COPY ./api/package*.json ./
RUN npm install

COPY ./api .
EXPOSE 3000

CMD ["npm", "run", "start"]