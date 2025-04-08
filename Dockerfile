FROM node:22.14.0

WORKDIR /usr/src/app
COPY package*.json ./
COPY seed.js ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "npm", "start" ]
