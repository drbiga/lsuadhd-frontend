FROM node:21 AS build
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build


FROM nginx:1.23.0 AS server
WORKDIR /app
COPY --from=build /app/build /usr/share/nginx/html
COPY ./public ./public
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]
