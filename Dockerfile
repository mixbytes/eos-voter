FROM nginx

WORKDIR /

RUN apt-get update
RUN apt-get install -y npm curl
RUN npm install npm@latest -g
RUN curl -LO https://nodejs.org/dist/v8.10.0/node-v8.10.0-linux-x64.tar.xz
RUN tar -C /usr/local --strip-components 1 -xJf node-v8.10.0-linux-x64.tar.xz

ADD . /eos-voter

WORKDIR /eos-voter
RUN PATH="$PATH:/usr/local/bin" npm i
RUN PATH="$PATH:/usr/local/bin" npm run build

RUN mkdir -p /www/eos-voter

RUN cp -r /eos-voter/build /www/landing/build

EXPOSE 8080
