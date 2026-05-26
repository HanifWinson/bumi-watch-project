# Dockerfile for Elastic Official MCP Server
# Uses @elastic/mcp-server-elasticsearch v0.3.1 with supergateway for SSE transport

FROM node:20-slim

WORKDIR /app

# Install Elastic's official MCP server and supergateway (stdio → SSE bridge)
RUN npm install -g @elastic/mcp-server-elasticsearch@0.3.1
RUN npm install -g supergateway

# Cloud Run uses PORT env variable
ENV PORT=8080
EXPOSE 8080

# supergateway wraps the stdio-based MCP server and exposes it as SSE
CMD ["supergateway", "--port", "8080", "--stdio", "mcp-server-elasticsearch"]
