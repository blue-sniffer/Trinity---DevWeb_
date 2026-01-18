# Trinity CI/CD Pipeline Setup Guide

## Overview

This project implements a complete CI/CD pipeline using GitHub Actions and AWS for both development and production environments. The pipeline includes:

- **Continuous Integration (CI)**: Automated testing, linting, and build verification
- **Continuous Deployment (CD)**: Automated deployment to AWS ECS for dev and prod
- **Security**: All sensitive variables are stored securely in GitHub Secrets and AWS Secrets Manager

## Architecture

```
GitHub Repository (blue-sniffer/Trinity---DevWeb_)
        ↓
GitHub Actions CI Pipeline (.github/workflows/ci.yml)
        ↓
Test Backend | Build Frontend | Docker Build
        ↓
GitHub Actions Deploy Pipeline (.github/workflows/deploy.yml)
        ↓ (if on main or develop)
AWS ECR (Elastic Container Registry)
        ↓
AWS ECS (Elastic Container Service)
        ↓
Dev/Prod Environments
```

## Pipeline Stages

### 1. Continuous Integration (CI) - Triggers on Push & Pull Requests

The CI pipeline runs on every push and pull request to verify code quality:

#### Backend Tests (`backend-tests` job)
- Sets up PostgreSQL test database
- Installs Python dependencies
- Runs Django checks
- Executes unit tests with coverage
- Uploads coverage reports to Codecov

#### Frontend Build (`frontend-build` job)
- Sets up Node.js environment
- Installs npm dependencies
- Builds the React application
- Verifies build output

#### Docker Build (`docker-build` job)
- Builds backend Docker image
- Builds frontend Docker image
- Validates Docker builds (no push yet)

### 2. Continuous Deployment (CD) - Triggers on Push to main/develop

The deployment pipeline runs automatically when code is pushed to main (production) or develop (staging):

```
develop branch → Deploy to DEV environment (lower resource allocation)
main branch → Deploy to PROD environment (higher resource allocation)
```

#### Deployment Steps:
1. Configure AWS credentials (environment-specific)
2. Login to ECR (Amazon's Docker registry)
3. Build Docker images with commit SHA tag
4. Push images to ECR
5. Update ECS task definitions
6. Deploy to ECS services
7. Wait for service stability

## Environment Setup

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **GitHub Account** with repository access
3. **AWS CLI** installed locally (for initial setup)
4. **Docker** and **Docker Compose** for local testing

### Step 1: AWS Setup

#### 1.1 Create AWS Account Structure

Create the following resources in your AWS account:

**ECR Repositories:**
```bash
aws ecr create-repository --repository-name trinity-backend-dev --region us-east-1
aws ecr create-repository --repository-name trinity-backend-prod --region us-east-1
aws ecr create-repository --repository-name trinity-frontend-dev --region us-east-1
aws ecr create-repository --repository-name trinity-frontend-prod --region us-east-1
```

**RDS Database (PostgreSQL):**
- Create dev and prod RDS instances
- Configure security groups to allow ECS access
- Create databases and users

**ECS Clusters:**
```bash
aws ecs create-cluster --cluster-name trinity-dev --region us-east-1
aws ecs create-cluster --cluster-name trinity-prod --region us-east-1
```

**CloudWatch Log Groups:**
```bash
aws logs create-log-group --log-group-name /ecs/trinity-backend-dev
aws logs create-log-group --log-group-name /ecs/trinity-backend-prod
aws logs create-log-group --log-group-name /ecs/trinity-frontend-dev
aws logs create-log-group --log-group-name /ecs/trinity-frontend-prod
```

#### 1.2 Create IAM Roles

Run the provided script to create IAM roles:

```bash
cd infra/aws-iam
chmod +x create-iam-roles.sh
./create-iam-roles.sh YOUR_AWS_ACCOUNT_ID us-east-1
```

This script creates:
- `ecsTaskExecutionRole` - Allows ECS to pull images and access secrets
- `ecsTaskRole` - Allows containers to access AWS resources
- `github-actions-trinity` user - For GitHub Actions access to AWS

#### 1.3 Create AWS Secrets

Use AWS Secrets Manager to store sensitive variables:

**Development Secrets:**
```bash
aws secretsmanager create-secret \
  --name trinity/backend/dev/SECRET_KEY \
  --secret-string "your-dev-secret-key" \
  --region us-east-1

aws secretsmanager create-secret \
  --name trinity/backend/dev/DATABASE_URL \
  --secret-string "postgresql://user:password@host:5432/trinity_dev" \
  --region us-east-1

aws secretsmanager create-secret \
  --name trinity/backend/dev/DATABASE_PASSWORD \
  --secret-string "your-db-password" \
  --region us-east-1
```

**Production Secrets:**
```bash
aws secretsmanager create-secret \
  --name trinity/backend/prod/SECRET_KEY \
  --secret-string "your-prod-secret-key" \
  --region us-east-1

aws secretsmanager create-secret \
  --name trinity/backend/prod/DATABASE_URL \
  --secret-string "postgresql://user:password@host:5432/trinity_prod" \
  --region us-east-1

aws secretsmanager create-secret \
  --name trinity/backend/prod/DATABASE_PASSWORD \
  --secret-string "your-db-password" \
  --region us-east-1
```

### Step 2: GitHub Setup

#### 2.1 Create GitHub Environments

1. Go to **Settings** → **Environments** in your GitHub repository
2. Create two environments: `dev` and `prod`
3. Set protection rules if desired (require approvals for production)

#### 2.2 Add GitHub Secrets

For **dev** environment (Settings → Secrets → Development):
```
AWS_ACCESS_KEY_ID_dev: <IAM user access key>
AWS_SECRET_ACCESS_KEY_dev: <IAM user secret key>
REACT_APP_API_URL_dev: https://api-dev.trinity-app.com/api
```

For **prod** environment (Settings → Secrets → Production):
```
AWS_ACCESS_KEY_ID_prod: <IAM user access key>
AWS_SECRET_ACCESS_KEY_prod: <IAM user secret key>
REACT_APP_API_URL_prod: https://api.trinity-app.com/api
```

For **repository** (Settings → Secrets → Repository):
```
CODECOV_TOKEN: <your codecov token> (optional, for coverage reports)
```

## Workflow Files

### CI Workflow: `.github/workflows/ci.yml`

Runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

Jobs:
- `backend-tests`: Tests Django backend with PostgreSQL
- `frontend-build`: Builds React frontend
- `docker-build`: Builds Docker images

### Deploy Workflow: `.github/workflows/deploy.yml`

Runs on:
- Push to `develop` branch → Deploy to **dev**
- Push to `main` branch → Deploy to **prod**
- Manual trigger via `workflow_dispatch`

Jobs:
- `deploy`: Single job that handles deployment based on branch/environment

## Task Definitions

ECS Task Definitions are stored in `infra/ecs/`:

- `task-definition-backend-dev.json`
- `task-definition-backend-prod.json`
- `task-definition-frontend-dev.json`
- `task-definition-frontend-prod.json`

### Key Features:
- **Fargate Launch Type**: Serverless container deployment
- **Environment-Specific Resources**: Dev has 512 CPU + 1GB RAM, Prod has 1024 CPU + 2GB RAM
- **Secrets Integration**: Pulls sensitive vars from Secrets Manager
- **CloudWatch Logging**: All logs go to CloudWatch Log Groups
- **Resource Tagging**: Images tagged with commit SHA and `latest`

## Security Best Practices

### 1. Secret Management

✅ **DO:**
- Store all secrets in GitHub Secrets or AWS Secrets Manager
- Use environment-specific secrets
- Rotate credentials regularly
- Use IAM roles with minimum required permissions

❌ **DON'T:**
- Commit secrets to the repository
- Use hardcoded credentials
- Share access keys between environments
- Store secrets in environment files

### 2. IAM Permissions

The GitHub Actions user has only these permissions:
- Push images to specific ECR repositories
- Update specific ECS services
- Access Secrets Manager for specific secret paths
- Assume specific IAM roles

### 3. Network Security

- Database only accessible from ECS tasks
- API behind ALB/NLB with security groups
- HTTPS enforced in production
- HSTS headers enabled in production

### 4. Container Security

- Base images kept up to date
- No root user in containers
- Read-only filesystems where possible
- Resource limits enforced

## Local Testing

### Test Locally with Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Run backend tests
docker-compose exec backend python -m pytest api/tests.py

# Stop services
docker-compose down
```

### Test CI Pipeline Locally

```bash
# Use act to run GitHub Actions locally
act --secret-files <secret-file> push
```

## Troubleshooting

### Pipeline Failures

**Backend tests failing:**
- Check database connection string in Secrets
- Verify PostgreSQL is running in test
- Check Python dependencies in requirements.txt

**Frontend build failing:**
- Check Node.js version compatibility
- Verify npm dependencies
- Check REACT_APP_* environment variables

**Docker build failing:**
- Ensure Dockerfile syntax is correct
- Check all dependencies are available
- Verify base images are accessible

**ECS deployment failing:**
- Check task definition syntax
- Verify IAM permissions
- Confirm ECS cluster exists
- Check CloudWatch logs in AWS Console

### Checking Logs

**GitHub Actions Logs:**
1. Go to **Actions** tab in GitHub
2. Click on workflow run
3. Expand job to see logs

**AWS CloudWatch Logs:**
1. Go to CloudWatch → Log Groups
2. Select appropriate log group (e.g., `/ecs/trinity-backend-prod`)
3. View log streams and events

**ECS Logs:**
1. Go to ECS → Clusters
2. Select cluster → Tasks
3. Click task → Container details → View logs in CloudWatch

## Configuration Files

### Environment Variables

- `.env.dev`: Non-sensitive dev configuration
- `.env.prod`: Non-sensitive prod configuration
- `backend/backend/env_config.py`: Python environment config loader

Environment variables are loaded via:
1. GitHub Secrets (sensitive)
2. AWS Secrets Manager (sensitive backend only)
3. Environment files above (non-sensitive)
4. Task definition environment section (non-sensitive)

### Docker Configuration

- `backend/Dockerfile`: Backend container setup
- `frontend/Dockerfile`: Frontend container setup
- `docker-compose.yml`: Local development orchestration

### IAM Configuration

- `infra/aws-iam/github-actions-policy.json`: GitHub Actions permissions
- `infra/aws-iam/ecs-task-execution-role-policy.json`: ECS execution role
- `infra/aws-iam/ecs-task-role-policy.json`: ECS task role
- `infra/aws-iam/create-iam-roles.sh`: Automated role creation

## Deployment Examples

### Manual Deployment

To manually trigger a deployment from your local machine:

```bash
git push origin develop  # Deploys to dev
git push origin main     # Deploys to prod
```

Or use GitHub Actions UI:
1. Go to Actions tab
2. Click "Deploy to AWS" workflow
3. Click "Run workflow"
4. Select branch

### Rollback

To rollback to a previous version:

1. In AWS ECS Console:
   - Go to Cluster → Service
   - Click "Update service"
   - Select previous task definition version
   - Click "Update"

2. Or via AWS CLI:
```bash
aws ecs update-service \
  --cluster trinity-prod \
  --service trinity-backend-prod \
  --task-definition trinity-backend-prod:N \
  --force-new-deployment
```

## Monitoring

### CloudWatch Monitoring

1. Create dashboards for key metrics
2. Set up alarms for error rates, CPU, memory
3. Configure SNS notifications

### Application Monitoring

Consider integrating:
- **Sentry**: Error tracking
- **DataDog**: APM and monitoring
- **ELK Stack**: Centralized logging

## Next Steps

1. ✅ Review and customize this setup for your specific needs
2. ✅ Set up AWS infrastructure following Step 1 above
3. ✅ Add GitHub Secrets following Step 2 above
4. ✅ Test CI pipeline with a test commit
5. ✅ Test CD pipeline with a deployment
6. ✅ Set up monitoring and alerting
7. ✅ Document team runbooks for common operations

## Support & Maintenance

### Regular Maintenance

- Update base Docker images monthly
- Rotate AWS credentials quarterly
- Review and update IAM policies annually
- Monitor and optimize costs

### Team Access

- Share access through AWS IAM roles
- Use GitHub teams for code review
- Document deployment procedures
- Create runbooks for incidents

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Documentation](https://docs.docker.com/)
- [Django Deployment Guide](https://docs.djangoproject.com/en/stable/howto/deployment/)
