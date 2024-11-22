FROM node:19-alpine

# Create the app directory
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

RUN apk add --no-cache --virtual .build-deps make gcc g++ python3

# Install npm packages
COPY package.json /usr/src/bot
RUN npm install
RUN apk del .build-deps

# Copy bot files
COPY . /usr/src/bot

# Start bot!
CMD ["npm", "run", "start"]