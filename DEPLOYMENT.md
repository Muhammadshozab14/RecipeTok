# Deploying Food Video Service to Azure App Service

This guide will walk you through deploying the FastAPI backend to Azure App Service.

## Prerequisites

- Azure account with an active subscription
- Azure CLI installed ([Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- Docker installed (if using container deployment)
- Git installed
- Python 3.10+ (for local testing)

## Azure Resources Setup

### 1. Azure Storage Account (for video storage)

```bash
# Create resource group
az group create --name food-video-rg --location eastus

# Create storage account
az storage account create \
  --name foodvideostorage \
  --resource-group food-video-rg \
  --location eastus \
  --sku Standard_LRS

# Get storage connection string
az storage account show-connection-string \
  --name foodvideostorage \
  --resource-group food-video-rg \
  --query connectionString \
  --output tsv

# Create blob container
az storage container create \
  --name videos \
  --account-name foodvideostorage \
  --public-access off
```

### 2. Azure Cosmos DB (for database)

```bash
# Create Cosmos DB account (Serverless mode recommended for development)
az cosmosdb create \
  --name food-video-cosmos \
  --resource-group food-video-rg \
  --default-consistency-level Session \
  --locations regionName=eastus failoverPriority=0 \
  --capabilities EnableServerless

# Get Cosmos DB keys
az cosmosdb keys list \
  --name food-video-cosmos \
  --resource-group food-video-rg \
  --type keys
```

### 3. Azure App Service Plan

```bash
# Create App Service Plan (Linux)
az appservice plan create \
  --name food-video-plan \
  --resource-group food-video-rg \
  --sku B1 \
  --is-linux
```

### 4. Azure App Service

```bash
# Create Web App
az webapp create \
  --name food-video-api \
  --resource-group food-video-rg \
  --plan food-video-plan \
  --runtime "PYTHON:3.11"
```

## Configuration

### Method 1: Using Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your App Service
3. Go to **Configuration** > **Application settings**
4. Add the following environment variables:

```
AZURE_STORAGE_CONNECTION_STRING=<your_storage_connection_string>
AZURE_STORAGE_ACCOUNT_NAME=<your_storage_account_name>
AZURE_STORAGE_ACCOUNT_KEY=<your_storage_account_key>
BLOB_CONTAINER=videos
SAS_EXPIRY_MINUTES=60

COSMOS_ENDPOINT=<your_cosmos_endpoint>
COSMOS_KEY=<your_cosmos_key>
COSMOS_DATABASE=videosdb
COSMOS_CONTAINER=videos

SECRET_KEY=<generate_a_strong_secret_key>
ACCESS_TOKEN_EXPIRE_MINUTES=1440

SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### Method 2: Using Azure CLI

```bash
# Set application settings
az webapp config appsettings set \
  --name food-video-api \
  --resource-group food-video-rg \
  --settings \
    AZURE_STORAGE_CONNECTION_STRING="<your_connection_string>" \
    AZURE_STORAGE_ACCOUNT_NAME="<your_account_name>" \
    AZURE_STORAGE_ACCOUNT_KEY="<your_account_key>" \
    BLOB_CONTAINER="videos" \
    SAS_EXPIRY_MINUTES="60" \
    COSMOS_ENDPOINT="<your_cosmos_endpoint>" \
    COSMOS_KEY="<your_cosmos_key>" \
    COSMOS_DATABASE="videosdb" \
    COSMOS_CONTAINER="videos" \
    SECRET_KEY="<your_secret_key>" \
    ACCESS_TOKEN_EXPIRE_MINUTES="1440" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true"
```

### Generate Secret Key

```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Deployment Methods

### Method 1: Deploy using Azure CLI (Local Git)

```bash
# Enable local git deployment
az webapp deployment source config-local-git \
  --name food-video-api \
  --resource-group food-video-rg

# Get deployment URL
DEPLOYMENT_URL=$(az webapp deployment source show \
  --name food-video-api \
  --resource-group food-video-rg \
  --query url \
  --output tsv)

# Add remote and push
git remote add azure $DEPLOYMENT_URL
git push azure master
```

### Method 2: Deploy using VS Code

1. Install the [Azure App Service extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azureappservice)
2. Sign in to Azure
3. Right-click on your App Service in the Azure extension
4. Select "Deploy to Web App"
5. Choose your project folder

### Method 3: Deploy using GitHub Actions (CI/CD)

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
    
    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'food-video-api'
        package: .
        startup-command: 'uvicorn app.main:app --host 0.0.0.0 --port 8000'
```

Set up Azure credentials secret in GitHub:
```bash
az ad sp create-for-rbac --name "food-video-github" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/food-video-rg \
  --sdk-auth
```

### Method 4: Deploy using Docker Container

#### Build and Push to Azure Container Registry

```bash
# Create Azure Container Registry
az acr create \
  --name recipetokregistry \
  --resource-group food-video-rg \
  --sku Basic \
  --admin-enabled true

# Login to ACR
az acr login --name recipetokregistry

# Build and push image
az acr build --registry recipetokregistry --image food-video-api:latest .

# Update App Service to use container
az webapp config container set \
  --name food-video-api \
  --resource-group food-video-rg \
  --docker-custom-image-name recipetokregistry.azurecr.io/food-video-api:latest \
  --docker-registry-server-url https://recipetokregistry.azurecr.io
```

#### Or use Docker Hub

```bash
# Build image
docker build -t yourusername/food-video-api:latest .

# Push to Docker Hub
docker push yourusername/food-video-api:latest

# Configure App Service to use Docker Hub image
az webapp config container set \
  --name food-video-api \
  --resource-group food-video-rg \
  --docker-custom-image-name yourusername/food-video-api:latest \
  --docker-registry-server-url https://index.docker.io/v1 \
  --docker-registry-server-user yourusername \
  --docker-registry-server-password yourpassword
```

### Method 5: Deploy using ZIP Deploy

```bash
# Install dependencies locally
pip install -r requirements.txt -t .

# Create deployment package (exclude unnecessary files)
zip -r deploy.zip . -x "*.git*" -x "*__pycache__*" -x "*.env*" -x "*frontend*"

# Deploy using Azure CLI
az webapp deployment source config-zip \
  --name food-video-api \
  --resource-group food-video-rg \
  --src deploy.zip
```

## Post-Deployment Configuration

### 1. Configure Startup Command

```bash
az webapp config set \
  --name food-video-api \
  --resource-group food-video-rg \
  --startup-file "uvicorn app.main:app --host 0.0.0.0 --port 8000"
```

### 2. Enable Always On (for free tier, this is disabled)

```bash
az webapp config set \
  --name food-video-api \
  --resource-group food-video-rg \
  --always-on true
```

### 3. Configure CORS (if needed)

Update `app/main.py` to allow your frontend domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Set up Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name food-video-api \
  --resource-group food-video-rg \
  --hostname api.yourdomain.com

# Configure SSL certificate
az webapp config ssl bind \
  --name food-video-api \
  --resource-group food-video-rg \
  --certificate-name your-certificate-name \
  --ssl-type SNI
```

## Monitoring and Logging

### Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app food-video-insights \
  --location eastus \
  --resource-group food-video-rg

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app food-video-insights \
  --resource-group food-video-rg \
  --query instrumentationKey \
  --output tsv)

# Add to App Service settings
az webapp config appsettings set \
  --name food-video-api \
  --resource-group food-video-rg \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY
```

### View Logs

```bash
# Stream logs
az webapp log tail \
  --name food-video-api \
  --resource-group food-video-rg

# Download logs
az webapp log download \
  --name food-video-api \
  --resource-group food-video-rg \
  --log-file logs.zip
```

## Scaling

### Scale Up (Change App Service Plan)

```bash
az appservice plan update \
  --name food-video-plan \
  --resource-group food-video-rg \
  --sku P1V2
```

### Scale Out (Add Instances)

```bash
az appservice plan update \
  --name food-video-plan \
  --resource-group food-video-rg \
  --number-of-workers 3
```

### Auto-scaling

1. Go to Azure Portal
2. Navigate to your App Service Plan
3. Go to **Scale out (App Service plan)**
4. Enable **Custom autoscale**
5. Configure rules based on CPU/Memory metrics

## Troubleshooting

### Common Issues

#### 1. Application Not Starting

Check logs:
```bash
az webapp log tail --name food-video-api --resource-group food-video-rg
```

Common causes:
- Missing environment variables
- Incorrect startup command
- Python version mismatch

#### 2. Module Import Errors

Ensure `requirements.txt` is properly deployed and dependencies are installed:
```bash
# Check if SCM_DO_BUILD_DURING_DEPLOYMENT is set to true
az webapp config appsettings list \
  --name food-video-api \
  --resource-group food-video-rg \
  --query "[?name=='SCM_DO_BUILD_DURING_DEPLOYMENT']"
```

#### 3. Database Connection Issues

Verify Cosmos DB credentials:
```bash
# Test connection from App Service
az webapp ssh --name food-video-api --resource-group food-video-rg
# Then test connection in Python shell
```

#### 4. Storage Connection Issues

Verify storage account credentials and container exists:
```bash
az storage container list \
  --account-name foodvideostorage \
  --account-key <your-key>
```

### Enable Detailed Error Messages

```bash
az webapp config set \
  --name food-video-api \
  --resource-group food-video-rg \
  --detailed-error-logging-enabled true \
  --http-logging-enabled true
```

## Health Check

### Test Deployment

```bash
# Get App Service URL
APP_URL=$(az webapp show \
  --name food-video-api \
  --resource-group food-video-rg \
  --query defaultHostName \
  --output tsv)

# Test health endpoint
curl https://$APP_URL/health

# Test API docs
curl https://$APP_URL/docs
```

## Security Best Practices

1. **Use Key Vault for Secrets**:
```bash
# Create Key Vault
az keyvault create \
  --name food-video-vault \
  --resource-group food-video-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name food-video-vault \
  --name cosmos-key \
  --value <your-cosmos-key>

# Reference in App Service
az webapp config appsettings set \
  --name food-video-api \
  --resource-group food-video-rg \
  --settings \
    COSMOS_KEY="@Microsoft.KeyVault(SecretUri=https://food-video-vault.vault.azure.net/secrets/cosmos-key/)"
```

2. **Enable HTTPS Only**:
```bash
az webapp update \
  --name food-video-api \
  --resource-group food-video-rg \
  --https-only true
```

3. **Configure IP Restrictions** (if needed):
```bash
az webapp config access-restriction add \
  --name food-video-api \
  --resource-group food-video-rg \
  --rule-name "AllowSpecificIP" \
  --action Allow \
  --ip-address "1.2.3.4/32" \
  --priority 100
```

## Cost Optimization

1. **Use Serverless Cosmos DB** for development
2. **Use Basic App Service Plan** for low traffic
3. **Enable auto-shutdown** for dev/test environments
4. **Use Azure Storage hot tier** for frequently accessed videos
5. **Monitor costs** in Azure Cost Management

## Cleanup

To delete all resources:

```bash
az group delete --name food-video-rg --yes --no-wait
```

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)

## Support

For deployment issues, check:
- [Azure App Service Logs](https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs)
- [Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)

