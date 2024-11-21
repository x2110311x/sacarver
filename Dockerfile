FROM node:latest

# Create the app directory
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

RUN apt-get update && apt-get install -y \
build-essential \ 
libcairo2-dev \
libpango1.0-dev \
libjpeg-dev \
libgif-dev \
librsvg2-dev \
libtool \
autoconf \
automake \
&& rm -rf /var/lib/apt/lists/*


# Install npm packages
COPY package.json /usr/src/bot
COPY package-lock.json /usr/src/bot
RUN npm install

# Copy bot files
COPY . /usr/src/bot

# Start bot!
CMD ["npm", "run", "start"]