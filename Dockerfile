# Imatge per autoallotjar Capitalist Game (build estàtica servida per nginx).
#
#   docker build -t capitalist-game .
#   docker run -d --restart unless-stopped -p 8080:80 capitalist-game
#
# Per servir-lo sota un subcamí en comptes de l'arrel:
#   docker build --build-arg BASE_PATH=/elteu-subcami/ -t capitalist-game .

# Etapa 1 — build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Per defecte, servim a l'arrel del host (no sota /capitalist-game/).
ARG BASE_PATH=/
ENV BASE_PATH=$BASE_PATH
RUN npm run build

# Etapa 2 — servir
FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /var/www/capitalist-game
EXPOSE 80
