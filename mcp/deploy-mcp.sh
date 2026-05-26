#!/bin/bash
# deploy-mcp.sh
# Deploys the Bumi Watch MCP Server to Google Cloud Run
# Run this from the root of the bumiwatch project

set -e

PROJECT_ID="bumi-watch-496402"
REGION="asia-southeast1"
SERVICE_NAME="bumiwatch-mcp"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🌿 Deploying Bumi Watch MCP Server to Cloud Run..."
echo "   Project: $PROJECT_ID"
echo "   Region:  $REGION"
echo ""

# Step 1 — Build and push Docker image
echo "📦 Building Docker image..."
gcloud builds submit \
  --tag $IMAGE \
  --project $PROJECT_ID \
  -f mcp/Dockerfile \
  .

echo "✅ Image built: $IMAGE"
echo ""

# Step 2 — Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "ELASTIC_URL=$ELASTIC_URL,ELASTIC_API_KEY=$ELASTIC_API_KEY" \
  --project $PROJECT_ID

echo ""
echo "✅ MCP Server deployed!"
echo ""
echo "Next steps:"
echo "1. Copy the Cloud Run URL above"
echo "2. Go to Agent Builder → your agent → Tools"
echo "3. Update the Elastic Bumi Watch MCP endpoint to: <cloud-run-url>/sse"
echo "4. Save and redeploy the agent"
