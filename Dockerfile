# Use an official Node.js runtime as a parent image
FROM node:25.2.1

RUN \
    --mount=type=cache,target=/root/.npm \
    npm install -g npm@latest

# Set the working directory to /app
WORKDIR /app

# Start the application
CMD ["tail", "-f", "/dev/null"]