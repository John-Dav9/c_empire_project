FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
ENV API_BASE_URL=/api
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/config.template.js /usr/share/nginx/html/config.template.js
COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
