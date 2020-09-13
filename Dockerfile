FROM node

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=8443

EXPOSE 8443

CMD [ "npm", "start" ]