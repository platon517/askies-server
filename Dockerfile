FROM node:12-alpine
WORKDIR /app
COPY package.json /app/package.json
RUN apk --no-cache add --virtual builds-deps build-base python
RUN npm install
COPY . /app
EXPOSE 8080 
USER node
CMD ["node", "index.js"]
