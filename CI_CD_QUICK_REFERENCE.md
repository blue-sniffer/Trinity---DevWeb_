# CI/CD Quick Reference

## File Locations

```
.github/workflows/
├── ci.yml                          # Runs tests, builds on every push/PR
└── deploy.yml                      # Deploys to AWS on develop/main push

infra/
├── ecs/                            # ECS task definitions
│   ├── task-definition-backend-dev.json
│   ├── task-definition-backend-prod.json
│   ├── task-definition-frontend-dev.json
│   └── task-definition-frontend-prod.json
└── aws-iam/                        # IAM policies and role setup
    ├── github-actions-policy.json
    ├── ecs-task-execution-role-policy.json
    ├── ecs-task-role-policy.json
    └── create-iam-roles.sh
```

## Documentation Files

| File | Purpose |
|------|---------|
| [CI_CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md) | Complete setup and architecture guide |
| [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) | How to configure GitHub Secrets |
| [CI_CD_DEPLOYMENT_CHECKLIST.md](./CI_CD_DEPLOYMENT_CHECKLIST.md) | Step-by-step implementation checklist |
| [CI_CD_IMPLEMENTATION_SUMMARY.md](./CI_CD_IMPLEMENTATION_SUMMARY.md) | Overview of what was implemented |

## Environment Variables

### Non-Sensitive Config (in repository)
- `.env.dev` - Development settings
- `.env.prod` - Production settings

### Sensitive (GitHub Secrets)
```
Dev Environment:
- AWS_ACCESS_KEY_ID_dev
- AWS_SECRET_ACCESS_KEY_dev
- REACT_APP_API_URL_dev

Prod Environment:
- AWS_ACCESS_KEY_ID_prod
- AWS_SECRET_ACCESS_KEY_prod
- REACT_APP_API_URL_prod
```

### Sensitive (AWS Secrets Manager)
```
trinity/backend/dev/SECRET_KEY
trinity/backend/dev/DATABASE_URL
trinity/backend/dev/DATABASE_PASSWORD
trinity/backend/prod/SECRET_KEY
trinity/backend/prod/DATABASE_URL
trinity/backend/prod/DATABASE_PASSWORD
```

## Deployment Flow

```
Push to develop → CI tests/builds → CD deploys to DEV
       ↓
   Tests pass?
       ↓ YES
   Deploy to dev ECS
       ↓
   Verified working?
       ↓ YES
   Create PR to main
       ↓
   Code review + approve
       ↓
   Merge to main → CI tests/builds → CD deploys to PROD
```

## Quick Commands

### AWS Setup
```bash
# Create ECR repositories
aws ecr create-repository --repository-name trinity-backend-dev
aws ecr create-repository --repository-name trinity-backend-prod
aws ecr create-repository --repository-name trinity-frontend-dev
aws ecr create-repository --repository-name trinity-frontend-prod

# Create IAM roles
cd infra/aws-iam
./create-iam-roles.sh YOUR_AWS_ACCOUNT_ID us-east-1

# Create Secrets Manager entries
aws secretsmanager create-secret \
  --name trinity/backend/dev/SECRET_KEY \
  --secret-string "your-secret-key"
```

### GitHub Actions
```bash
# View workflow status
gh run list --workflow ci.yml
gh run list --workflow deploy.yml

# View specific run logs
gh run view RUN_ID

# List secrets
gh secret list
```

### Local Testing
```bash
# Build and run locally
docker-compose build
docker-compose up

# Run tests locally
docker-compose exec backend python -m pytest api/tests.py
```

### AWS ECS Management
```bash
# View running tasks
aws ecs list-tasks --cluster trinity-dev --service trinity-backend-dev

# View task logs
aws logs tail /ecs/trinity-backend-dev --follow

# Trigger deployment
aws ecs update-service \
  --cluster trinity-dev \
  --service trinity-backend-dev \
  --force-new-deployment

# Rollback to previous version
aws ecs update-service \
  --cluster trinity-dev \
  --service trinity-backend-dev \
  --task-definition trinity-backend-dev:PREVIOUS_VERSION \
  --force-new-deployment
```

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| CI tests failing | Check backend/requirements.txt, verify database setup |
| Frontend build failing | Check frontend/package.json, verify Node.js version |
| Deployment failing | Check AWS credentials in GitHub Secrets |
| Container won't start | Check CloudWatch logs, verify Secrets Manager entries |
| Database connection error | Check DATABASE_URL in Secrets Manager |
| API URL wrong in frontend | Update REACT_APP_API_URL in GitHub Secrets |

## Monitoring

### CloudWatch Logs
```bash
# View backend logs
aws logs tail /ecs/trinity-backend-prod --follow

# View frontend logs
aws logs tail /ecs/trinity-frontend-prod --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /ecs/trinity-backend-prod \
  --filter-pattern "ERROR"
```

### GitHub Actions Dashboard
- Go to Actions tab in GitHub
- View workflow runs
- Click on failed runs for details
- Check both CI and Deploy workflows

## Getting Started (5 Steps)

1. **Read the docs**
   - Start with [CI_CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md)

2. **Set up AWS**
   - Follow Phase 1-3 in [CI_CD_DEPLOYMENT_CHECKLIST.md](./CI_CD_DEPLOYMENT_CHECKLIST.md)

3. **Configure GitHub**
   - Follow Phase 4 in checklist
   - Add all required secrets

4. **Test locally**
   - Run `docker-compose up`
   - Verify backend and frontend work

5. **Verify pipeline**
   - Push test commit to develop
   - Watch GitHub Actions run
   - Check deployment to dev environment

## Important Notes

⚠️ **Must Do:**
- Replace `ACCOUNT_ID` in task definitions with your AWS account ID
- Create all secrets in AWS Secrets Manager
- Add all secrets to GitHub Environments
- Update domain names in `.env.dev` and `.env.prod`

🔒 **Security:**
- Never commit secrets to git
- Rotate credentials every 90 days
- Use IAM roles instead of root credentials
- Enable MFA on AWS account

📊 **Monitoring:**
- Check CloudWatch dashboards regularly
- Set up alerts for errors and resource usage
- Review logs for anomalies
- Monitor AWS costs

## Support

For detailed information:
1. See troubleshooting section in [CI_CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md)
2. Check GitHub Actions logs
3. Review AWS CloudWatch logs
4. Consult AWS documentation

---

**Last Updated**: January 18, 2026  
**Status**: ✅ Ready for deployment
