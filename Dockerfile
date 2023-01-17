FROM node:18

WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY *.js     ./
COPY ./resources   ./

RUN mkdir -p ./logs

RUN npm install

RUN npm ci --only=production

COPY . .

EXPOSE 3000

### Exec application
ENTRYPOINT npm start
