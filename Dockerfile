# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code to the container
COPY . .

# Expose the port on which your application will run
EXPOSE 3000

# Define the command to run when the container starts
CMD ["yarn", "start"]

# Stage 1: Build the React app
# FROM node:14 AS build

# WORKDIR /usr/src/app

# COPY package*.json yarn.lock ./
# RUN yarn install

# COPY . .
# RUN yarn build

# # Stage 2: Set up Nginx to serve the built app
# FROM nginx:alpine

# COPY --from=build /usr/src/app/build /usr/share/nginx/html

# # Expose the default Nginx port
# EXPOSE 80

# # Start Nginx
# CMD ["nginx", "-g", "daemon off;"]

