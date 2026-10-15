FROM node:lts

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
fontconfig \
fonts-dejavu-core \
fonts-liberation \
&& rm -rf /var/lib/apt/lists/*

# Install npm packages
COPY package.json /usr/src/bot
RUN npm install

ARG GIT_COMMIT=unknown
ENV GIT_COMMIT=${GIT_COMMIT}

# Copy bot files
COPY . /usr/src/bot

# Install custom fonts system-wide and refresh font cache
RUN mkdir -p /usr/local/share/fonts/custom && \
    cp -r /usr/src/bot/assets/fonts/* /usr/local/share/fonts/custom/ 2>/dev/null || true && \
    fc-cache -f -v

# Start bot!
CMD ["npm", "run", "start"]