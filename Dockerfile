FROM node:9 as builder

ADD . /eos-voter
WORKDIR /eos-voter
RUN npm i
RUN npm run build


FROM nginx

RUN mkdir -p /www/eos-voter
COPY --from=builder /eos-voter/build /www/eos-voter/build

EXPOSE 8080
