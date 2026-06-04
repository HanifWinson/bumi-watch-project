FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY agent/ ./agent/
COPY config/ ./config/
COPY utils/ ./utils/

ENV PORT=3001
EXPOSE 3001

CMD ["node", "agent/index.js"]
