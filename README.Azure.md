# Bundle Admin Frontend - Azure Static Web Apps Deployment Guide

This guide covers building, running locally with Docker, and deploying the React frontend to **Azure Static Web Apps**.

## Prerequisites

- Node.js 20+ installed
- Azure CLI installed (`az`)
- Azure subscription
- (Optional) Docker Desktop for local containerized testing

---

## Quick Start (Local Development)

### Option 1: Run with npm (Recommended for development)

```bash
cd src/frontend

# Install dependencies
npm install

# Update public/config.js with your backend URL
# Edit public/config.js: API_URL: 'http://localhost:3001'

# Start development server
npm run dev
```

### Option 2: Run with Docker (Local testing)

```bash
cd src/frontend

# Build Docker image
docker build -t bundleseeding-frontend:latest .

# Run container
docker run -d \
  --name bundleseeding-frontend \
  -p 8080:80 \
  -e "API_URL=http://localhost:3001" \
  bundleseeding-frontend:latest

# Open http://localhost:8080
```

---

## Environment Configuration

The frontend uses `config.js` for runtime configuration:

```javascript
// public/config.js
window.APP_CONFIG = {
  API_URL: 'https://your-backend-api.azurecontainerapps.io',
};
```

| Environment | API_URL Value |
|-------------|---------------|
| Local Development | `http://localhost:3001` |
| Production (Azure) | `https://bundleseeding-api.xxx.azurecontainerapps.io` |

---

## Deploy to Azure Static Web Apps

### Step 1: Login to Azure

```bash
az login
```

### Step 2: Create Resource Group (if needed)

```bash
az group create \
  --name rg-faheem-bundleseeding \
  --location eastus
```

### Step 3: Create Azure Static Web App

```bash
az staticwebapp create \
  --name bundleseeding-frontend \
  --resource-group rg-faheem-bundleseeding \
  --location eastus2 \
  --sku Free
```

### Step 4: Build the Frontend

```bash
cd src/frontend

# Install dependencies
npm ci

# Update config.js with production API URL before building
cat > public/config.js << 'EOF'
window.APP_CONFIG = {
  API_URL: 'https://bundleseeding-api.your-domain.azurecontainerapps.io',
};
EOF

# Build for production
npm run build
```

### Step 5: Deploy Using Azure CLI

```bash
# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name bundleseeding-frontend \
  --resource-group rg-faheem-bundleseeding \
  --query "properties.apiKey" -o tsv)

# Install SWA CLI (if not installed)
npm install -g @azure/static-web-apps-cli

# Deploy
cd src/frontend
swa deploy ./dist \
  --deployment-token $DEPLOYMENT_TOKEN \
  --env production
```

### Step 6: Get Application URL

```bash
az staticwebapp show \
  --name bundleseeding-frontend \
  --resource-group rg-faheem-bundleseeding \
  --query "defaultHostname" -o tsv
```

---

## CI/CD with GitHub Actions (Recommended)

### Step 1: Get Deployment Token

```bash
az staticwebapp secrets list \
  --name bundleseeding-frontend \
  --resource-group rg-faheem-bundleseeding \
  --query "properties.apiKey" -o tsv
```

### Step 2: Add Secret to GitHub

1. Go to your GitHub repository → Settings → Secrets → Actions
2. Add new secret: `AZURE_STATIC_WEB_APPS_API_TOKEN` with the token value
3. Add new secret: `BACKEND_API_URL` with your backend URL

### Step 3: Create GitHub Actions Workflow

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Azure Static Web Apps

on:
  push:
    branches:
      - main
    paths:
      - 'src/frontend/**'
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main
    paths:
      - 'src/frontend/**'

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: src/frontend/package-lock.json

      - name: Install dependencies
        working-directory: src/frontend
        run: npm ci

      - name: Configure API URL
        working-directory: src/frontend
        run: |
          cat > public/config.js << 'EOF'
          window.APP_CONFIG = {
            API_URL: '${{ secrets.BACKEND_API_URL }}',
          };
          EOF

      - name: Build
        working-directory: src/frontend
        run: npm run build

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "src/frontend"
          output_location: "dist"
          skip_app_build: true

  close_pull_request:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close PR Environment
    steps:
      - name: Close Pull Request
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

---

## Alternative: Link GitHub Repository Directly

Azure Static Web Apps can auto-deploy from GitHub:

```bash
az staticwebapp create \
  --name bundleseeding-frontend \
  --resource-group rg-faheem-bundleseeding \
  --location eastus2 \
  --source https://github.com/YOUR_ORG/faheem-bundle-management \
  --branch main \
  --app-location "src/frontend" \
  --output-location "dist" \
  --login-with-github
```

This will:
1. Create the Static Web App
2. Set up GitHub Actions automatically
3. Deploy on every push to main

---

## Configuration Files

### staticwebapp.config.json

This file (already created) configures:
- SPA navigation fallback to `index.html`
- Cache headers for static assets
- Security headers

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/config.js", "/*.ico", "/*.svg"]
  }
}
```

---

## Useful Commands

### Static Web App Management

```bash
# List all static web apps
az staticwebapp list --resource-group rg-faheem-bundleseeding -o table

# Show app details
az staticwebapp show \
  --name bundleseeding-frontend \
  --resource-group rg-faheem-bundleseeding

# Get deployment environments
az staticwebapp environment list \
  --name bundleseeding-frontend \
  --resource-group rg-faheem-bundleseeding

# Delete static web app
az staticwebapp delete \
  --name bundleseeding-frontend \
  --resource-group rg-faheem-bundleseeding
```

### Custom Domain (Optional)

```bash
# Add custom domain
az staticwebapp hostname set \
  --name bundleseeding-frontend \
  --resource-group rg-faheem-bundleseeding \
  --hostname www.yourdomain.com

# List hostnames
az staticwebapp hostname list \
  --name bundleseeding-frontend \
  --resource-group rg-faheem-bundleseeding
```

---

## Troubleshooting

### CORS Issues

The backend already has CORS configured to `AllowAll`. If you still see CORS errors:

1. Verify `API_URL` in `config.js` is correct
2. Check backend is running and accessible
3. Ensure the backend URL uses HTTPS in production

### 404 on Page Refresh

The `staticwebapp.config.json` handles SPA routing. If issues persist:

1. Verify the file is in the `src/frontend` directory
2. Check it's included in the build output (`dist/`)
3. Verify the `navigationFallback` configuration

### Config.js Not Updating

`config.js` is cached aggressively by browsers. The config sets `no-cache` headers, but you may need to:

```bash
# Hard refresh in browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Build Failures

```bash
# Clear cache and rebuild
cd src/frontend
rm -rf node_modules dist
npm ci
npm run build
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Azure                                       │
│                                                                          │
│   ┌───────────────────────────┐      ┌───────────────────────────┐      │
│   │  Azure Static Web Apps    │      │  Azure Container Apps     │      │
│   │                           │      │                           │      │
│   │  bundleseeding-frontend   │─────▶│  bundleseeding-api        │      │
│   │  (React SPA)              │ API  │  (.NET 10 API)            │      │
│   │                           │      │                           │      │
│   │  - Global CDN             │      │  - Auto-scaling           │      │
│   │  - Free SSL               │      │  - Managed identity       │      │
│   │  - Auto CI/CD             │      │                           │      │
│   └───────────────────────────┘      └───────────────────────────┘      │
│              │                                    │                      │
└──────────────┼────────────────────────────────────┼──────────────────────┘
               │                                    │
               ▼                                    ▼
         Users (Browser)                    Azure SQL Database
```

---

## Cost Comparison

| Service | Tier | Cost |
|---------|------|------|
| Azure Static Web Apps | Free | $0/month |
| Azure Static Web Apps | Standard | ~$9/month |
| Azure Container Apps | Consumption | Pay per use |

Static Web Apps Free tier includes:
- 100 GB bandwidth/month
- 2 custom domains
- Free SSL certificates
- Global CDN
