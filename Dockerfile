FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build:directadmin

FROM php:8.3-apache AS runner
RUN docker-php-ext-install pdo_mysql && a2enmod rewrite headers
RUN printf '<Directory /var/www/html>\nAllowOverride All\nRequire all granted\n</Directory>\n' > /etc/apache2/conf-available/tyc.conf && a2enconf tyc
COPY --from=build /app/dist /var/www/html
RUN mkdir -p /var/www/tyc-private && chown www-data:www-data /var/www/tyc-private
EXPOSE 80

FROM runner AS migrate
COPY directadmin /app/directadmin
COPY scripts/php-migrate.php /app/scripts/php-migrate.php
CMD ["php", "/app/scripts/php-migrate.php", "--bootstrap"]
