# Dockerfile for Bumi Watch MCP Server
# Deploys to Google Cloud Run

FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy MCP server and shared files
COPY mcp/server.js ./mcp/
COPY config/elastic.js ./config/
COPY utils/helpers.js ./utils/

# Cloud Run uses PORT env variable
ENV PORT=8080
EXPOSE 8080

CMD ["node", "mcp/server.js"]
