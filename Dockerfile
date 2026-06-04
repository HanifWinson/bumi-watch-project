# Dockerfile for Bumi Watch MCP Server
# Deploys to Google Cloud Run

FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy MCP server and shared files
COPY agent/ ./agent/
COPY config/ ./config/
COPY utils/ ./utils/

# Cloud Run uses PORT env variable
ENV PORT=3001
EXPOSE 3001

CMD ["node", "mcp/server.js"]
