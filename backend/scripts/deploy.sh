# scripts/deploy.sh
#!/bin/bash

# Exit on first error
set -e

# Check for required environment variables
if [ -z "$DEPLOY_ENV" ]; then
    echo "DEPLOY_ENV is not set"
    exit 1
fi

# Build Docker images
docker-compose -f docker/docker-compose.yml build

# Push to container registry (optional)
# docker-compose push

# Deploy to target environment
case "$DEPLOY_ENV" in
    production)
        echo "Deploying to Production..."
        docker-compose -f docker/docker-compose.yml up -d
        ;;
    staging)
        echo "Deploying to Staging..."
        docker-compose -f docker/docker-compose.yml up -d
        ;;
    *)
        echo "Invalid environment"
        exit 1
        ;;
esac

# Run database migrations
docker-compose exec backend npm run migrate

# Restart services to apply changes
docker-compose restart