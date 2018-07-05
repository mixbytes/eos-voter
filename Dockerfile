FROM node:9.11-alpine as builder

WORKDIR /app
COPY . .
RUN npm i
RUN npm run build

FROM nginx:1.15.1-alpine
COPY --from=builder /app/build /var/www
