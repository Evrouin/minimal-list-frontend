# Use the official Node image as a base
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of your app
COPY . .

# Build the app for production
RUN npm run build

# Expose the port your app runs on
EXPOSE 3000

# Start the Nuxt app
CMD ["npm", "run", "start"]
