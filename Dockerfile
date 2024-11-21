FROM node:latest

# Create the app directory
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# Install npm packages
COPY package.json /usr/src/bot
RUN npm install

# Copy bot files
COPY . /usr/src/bot

# Start bot!
CMD ["npm", "run", "start"]