# CI/CD Pipeline Deployment Checklist

Complete this checklist to set up the CI/CD pipeline for Trinity project.

## Phase 1: AWS Infrastructure Setup

- [ ] **Create AWS Account** (if not already done)
  - Account ID: `_________________`
  - Region: `us-east-1`

- [ ] **Create ECR Repositories**
  ```bash
  aws ecr create-repository --repository-name trinity-backend-dev
  aws ecr create-repository --repository-name trinity-backend-prod
  aws ecr create-repository --repository-name trinity-frontend-dev
  aws ecr create-repository --repository-name trinity-frontend-prod
  ```

- [ ] **Create RDS Databases**
  - [ ] Dev PostgreSQL instance
    - Endpoint: `_________________`
    - Database name: `trinity_dev`
    - Admin user: `trinity_admin`
  - [ ] Prod PostgreSQL instance
    - Endpoint: `_________________`
    - Database name: `trinity_prod`
    - Admin user: `trinity_admin`

- [ ] **Create ECS Clusters**
  ```bash
  aws ecs create-cluster --cluster-name trinity-dev
  aws ecs create-cluster --cluster-name trinity-prod
  ```

- [ ] **Create CloudWatch Log Groups**
  ```bash
  aws logs create-log-group --log-group-name /ecs/trinity-backend-dev
  aws logs create-log-group --log-group-name /ecs/trinity-backend-prod
  aws logs create-log-group --log-group-name /ecs/trinity-frontend-dev
  aws logs create-log-group --log-group-name /ecs/trinity-frontend-prod
  ```

## Phase 2: IAM Setup

- [ ] **Create IAM Roles**
  ```bash
  cd infra/aws-iam
  chmod +x create-iam-roles.sh
  ./create-iam-roles.sh YOUR_AWS_ACCOUNT_ID us-east-1
  ```

- [ ] **Create GitHub Actions IAM Users**
  - [ ] `github-actions-trinity-dev`
    - Access Key ID: `_________________`
    - Secret Access Key: `_________________` (save securely!)
  - [ ] `github-actions-trinity-prod`
    - Access Key ID: `_________________`
    - Secret Access Key: `_________________` (save securely!)

- [ ] **Attach IAM Policies**
  - [ ] Dev user has dev ECR/ECS access
  - [ ] Prod user has prod ECR/ECS access
  - [ ] Both can access respective Secrets Manager secrets

## Phase 3: AWS Secrets Manager Setup

- [ ] **Create Development Secrets**
  ```bash
  aws secretsmanager create-secret --name trinity/backend/dev/SECRET_KEY --secret-string "YOUR_SECRET"
  aws secretsmanager create-secret --name trinity/backend/dev/DATABASE_URL --secret-string "postgresql://..."
  aws secretsmanager create-secret --name trinity/backend/dev/DATABASE_PASSWORD --secret-string "PASSWORD"
  ```
  - [ ] SECRET_KEY created: `_________________`
  - [ ] DATABASE_URL created: `_________________`
  - [ ] DATABASE_PASSWORD created: `_________________`

- [ ] **Create Production Secrets**
  ```bash
  aws secretsmanager create-secret --name trinity/backend/prod/SECRET_KEY --secret-string "YOUR_SECRET"
  aws secretsmanager create-secret --name trinity/backend/prod/DATABASE_URL --secret-string "postgresql://..."
  aws secretsmanager create-secret --name trinity/backend/prod/DATABASE_PASSWORD --secret-string "PASSWORD"
  ```
  - [ ] SECRET_KEY created: `_________________`
  - [ ] DATABASE_URL created: `_________________`
  - [ ] DATABASE_PASSWORD created: `_________________`

## Phase 4: GitHub Configuration

- [ ] **Create GitHub Environments**
  - [ ] Go to Settings → Environments
  - [ ] Create `dev` environment
  - [ ] Create `prod` environment
  - [ ] (Optional) Enable required reviews for prod deployments

- [ ] **Add GitHub Secrets - Dev Environment**
  - [ ] `AWS_ACCESS_KEY_ID_dev`: `AKIA...`
  - [ ] `AWS_SECRET_ACCESS_KEY_dev`: `wJal...`
  - [ ] `REACT_APP_API_URL_dev`: `https://api-dev.trinity-app.com/api`

- [ ] **Add GitHub Secrets - Prod Environment**
  - [ ] `AWS_ACCESS_KEY_ID_prod`: `AKIA...`
  - [ ] `AWS_SECRET_ACCESS_KEY_prod`: `wJal...`
  - [ ] `REACT_APP_API_URL_prod`: `https://api.trinity-app.com/api`

- [ ] **Add GitHub Secrets - Repository (Optional)**
  - [ ] `CODECOV_TOKEN`: (from codecov.io)

## Phase 5: Application Configuration

- [ ] **Update Task Definitions**
  - [ ] Replace `ACCOUNT_ID` with your AWS account ID in all task definitions
    - [ ] `infra/ecs/task-definition-backend-dev.json`
    - [ ] `infra/ecs/task-definition-backend-prod.json`
    - [ ] `infra/ecs/task-definition-frontend-dev.json`
    - [ ] `infra/ecs/task-definition-frontend-prod.json`

- [ ] **Update Environment Files**
  - [ ] `.env.dev` - Update hosts and URLs
    - Dev domain: `_________________`
  - [ ] `.env.prod` - Update hosts and URLs
    - Prod domain: `_________________`

- [ ] **Update Django Settings**
  - [ ] Verify `backend/backend/env_config.py` is correct
  - [ ] Update settings.py to use env_config

## Phase 6: ECS Services Setup

- [ ] **Create ECS Task Definitions**
  ```bash
  # For dev
  aws ecs register-task-definition --cli-input-json file://infra/ecs/task-definition-backend-dev.json
  aws ecs register-task-definition --cli-input-json file://infra/ecs/task-definition-frontend-dev.json
  
  # For prod
  aws ecs register-task-definition --cli-input-json file://infra/ecs/task-definition-backend-prod.json
  aws ecs register-task-definition --cli-input-json file://infra/ecs/task-definition-frontend-prod.json
  ```

- [ ] **Create ECS Services**
  - [ ] trinity-backend-dev service (port 8000)
  - [ ] trinity-frontend-dev service (port 3000)
  - [ ] trinity-backend-prod service (port 8000)
  - [ ] trinity-frontend-prod service (port 3000)

- [ ] **Configure Load Balancers (ALB/NLB)**
  - [ ] Dev backend load balancer
  - [ ] Dev frontend load balancer
  - [ ] Prod backend load balancer
  - [ ] Prod frontend load balancer

- [ ] **Configure Route 53 DNS**
  - [ ] `api-dev.trinity-app.com` → Dev backend ALB
  - [ ] `dev.trinity-app.com` → Dev frontend ALB
  - [ ] `api.trinity-app.com` → Prod backend ALB
  - [ ] `trinity-app.com` → Prod frontend ALB
  - [ ] `www.trinity-app.com` → Prod frontend ALB

## Phase 7: Testing & Verification

- [ ] **Test CI Pipeline**
  - [ ] Push to develop branch
  - [ ] Verify GitHub Actions runs CI jobs
  - [ ] Confirm backend tests pass
  - [ ] Confirm frontend builds successfully
  - [ ] Check coverage reports uploaded

- [ ] **Test Dev Deployment**
  - [ ] Push to develop branch
  - [ ] Verify CD pipeline starts
  - [ ] Confirm Docker images built
  - [ ] Confirm images pushed to ECR
  - [ ] Verify ECS services updated
  - [ ] Check application running at dev URL
  - [ ] Test API endpoints working

- [ ] **Test Prod Deployment**
  - [ ] Push to main branch
  - [ ] Verify CD pipeline starts
  - [ ] Confirm Docker images built
  - [ ] Confirm images pushed to ECR
  - [ ] Verify ECS services updated
  - [ ] Check application running at prod URL
  - [ ] Test API endpoints working

- [ ] **Verify Secrets Handling**
  - [ ] No secrets in GitHub Actions logs
  - [ ] Backend can access database via Secrets Manager
  - [ ] Frontend gets correct API URL
  - [ ] Django SECRET_KEY loaded from Secrets Manager

- [ ] **Test Rollback**
  - [ ] Deploy to dev
  - [ ] Deploy previous version to dev
  - [ ] Verify rollback works
  - [ ] Document rollback procedure

## Phase 8: Monitoring & Documentation

- [ ] **Set Up CloudWatch Monitoring**
  - [ ] Create dashboard for dev environment
  - [ ] Create dashboard for prod environment
  - [ ] Add alarms for CPU > 80%
  - [ ] Add alarms for memory > 80%
  - [ ] Add alarms for error rate > 5%

- [ ] **Configure Notifications**
  - [ ] SNS topic for dev alerts
  - [ ] SNS topic for prod alerts
  - [ ] Email notifications for failures
  - [ ] (Optional) Slack integration

- [ ] **Document Setup**
  - [ ] Team has read CI_CD_SETUP_GUIDE.md
  - [ ] Team has read GITHUB_SECRETS_SETUP.md
  - [ ] Deployment procedures documented
  - [ ] Rollback procedures documented
  - [ ] Runbooks created for common issues

- [ ] **Create Team Access**
  - [ ] Dev team can deploy to dev
  - [ ] Release manager can deploy to prod
  - [ ] Ops team has AWS console access
  - [ ] Monitoring/alerting configured

## Phase 9: Post-Deployment

- [ ] **Security Review**
  - [ ] Verify no secrets in code
  - [ ] Check IAM policies are minimal
  - [ ] Confirm security groups configured
  - [ ] Enable S3 encryption for artifacts

- [ ] **Performance Optimization**
  - [ ] Check container startup times
  - [ ] Optimize database queries
  - [ ] Configure caching
  - [ ] Set up CDN if needed

- [ ] **Cost Optimization**
  - [ ] Review AWS costs
  - [ ] Optimize ECS resources
  - [ ] Use spot instances if applicable
  - [ ] Set up budget alerts

- [ ] **Maintenance Schedule**
  - [ ] Weekly: Check CloudWatch logs
  - [ ] Monthly: Review costs and optimize
  - [ ] Quarterly: Rotate credentials
  - [ ] Quarterly: Update base images
  - [ ] Yearly: Review IAM policies

## Rollback Procedure

If something goes wrong:

1. **Identify Issue**
   - Check CloudWatch logs
   - Review GitHub Actions logs
   - Check ECS task status

2. **Stop New Deployments**
   - Pause CI/CD pipeline if needed
   - Fix the issue in code

3. **Rollback Current Deployment**
   ```bash
   aws ecs update-service \
     --cluster trinity-prod \
     --service trinity-backend-prod \
     --task-definition trinity-backend-prod:PREVIOUS_VERSION \
     --force-new-deployment
   ```

4. **Verify Rollback**
   - Check ECS tasks updated
   - Test application endpoints
   - Monitor CloudWatch logs

5. **Post-Mortem**
   - Document what went wrong
   - Update procedures
   - Add tests to prevent recurrence

## Notes

- **AWS Account ID**: `_________________`
- **GitHub Repository**: `blue-sniffer/Trinity---DevWeb_`
- **Dev Domain**: `_________________`
- **Prod Domain**: `_________________`
- **AWS Region**: `us-east-1`
- **Contact**: `_________________`
- **Slack Channel**: `_________________`

## Completion Date

- **Started**: `_________________`
- **Completed**: `_________________`
- **Verified by**: `_________________`

---

## Quick Links

- [CI/CD Setup Guide](./CI_CD_SETUP_GUIDE.md)
- [GitHub Secrets Setup](./GITHUB_SECRETS_SETUP.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
