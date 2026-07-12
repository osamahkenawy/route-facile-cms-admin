FROM node:20

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy source code
COPY . .

# Set environment variables for build
ENV CI=false
ENV REACT_APP_API_KEY=Le3dyU.zI&\`y+N^^
ENV REACT_APP_NODE_HOST=https://apis.autostrad.com/api/v1/
ENV REACT_APP_FILE_SERVER=https://files.autostrad.com/
ENV REACT_APP_LOCAL_ENCRYPTION_KEY=5C724CE55C702828F3F74B555F594366

# Build the app
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port
EXPOSE 3031

# Serve the build folder
CMD ["serve", "-s", "build", "-l", "3031"]