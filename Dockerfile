# Use the official Node image as a base
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

# Start the Nuxt app
CMD ["npm", "run", "start"]
