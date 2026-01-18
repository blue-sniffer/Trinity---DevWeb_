# GitHub Secrets Configuration Guide

This document outlines all the GitHub Secrets required for the CI/CD pipeline to function properly.

## Location: Settings → Secrets and variables → Actions

## Required Secrets by Environment

### Development Environment (`dev`)

**Environment URL**: `Settings → Environments → dev`

| Secret Name | Value | Example |
|---|---|---|
| `AWS_ACCESS_KEY_ID_dev` | IAM access key for dev AWS user | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY_dev` | IAM secret access key for dev | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `REACT_APP_API_URL_dev` | Frontend API endpoint for dev | `https://api-dev.trinity-app.com/api` |

### Production Environment (`prod`)

**Environment URL**: `Settings → Environments → prod`

| Secret Name | Value | Example |
|---|---|---|
| `AWS_ACCESS_KEY_ID_prod` | IAM access key for prod AWS user | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY_prod` | IAM secret access key for prod | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `REACT_APP_API_URL_prod` | Frontend API endpoint for prod | `https://api.trinity-app.com/api` |

### Repository Secrets (Optional)

**Environment URL**: `Settings → Secrets and variables → Actions` → "Repository secrets"

| Secret Name | Value | Purpose |
|---|---|---|
| `CODECOV_TOKEN` | Token from codecov.io | Upload coverage reports to Codecov |

## How to Add GitHub Secrets

### Via GitHub Web UI

1. Go to your repository
2. Click **Settings**
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** or select an environment first
5. Enter secret name and value
6. Click **Add secret**

### Via GitHub CLI

```bash
# For repository secrets
gh secret set SECRET_NAME --body "secret-value"

# For environment secrets
gh secret set SECRET_NAME --env dev --body "secret-value"
gh secret set SECRET_NAME --env prod --body "secret-value"
```

### Via GitHub API

```bash
curl -X PUT https://api.github.com/repos/blue-sniffer/Trinity---DevWeb_/actions/secrets/SECRET_NAME \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"encrypted_value":"encrypted-secret-value","key_id":"KEY_ID"}'
```

## AWS IAM Setup for Secrets

### Create Development IAM User

```bash
# Create user
aws iam create-user --user-name github-actions-trinity-dev

# Create access key
aws iam create-access-key --user-name github-actions-trinity-dev

# Attach policy (use policy file from infra/aws-iam/github-actions-policy.json)
aws iam put-user-policy \
  --user-name github-actions-trinity-dev \
  --policy-name GitHubActionsPolicy \
  --policy-document file://github-actions-policy.json
```

### Create Production IAM User

```bash
# Create user
aws iam create-user --user-name github-actions-trinity-prod

# Create access key
aws iam create-access-key --user-name github-actions-trinity-prod

# Attach policy
aws iam put-user-policy \
  --user-name github-actions-trinity-prod \
  --policy-name GitHubActionsPolicy \
  --policy-document file://github-actions-policy.json
```

### Save Access Keys Securely

The AWS CLI outputs access keys like this:
```json
{
  "AccessKey": {
    "UserName": "github-actions-trinity-dev",
    "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "Status": "Active",
    "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "CreateDate": "2024-01-18T12:00:00Z"
  }
}
```

⚠️ **Important**: SecretAccessKey is only shown once. Save it immediately to a secure location (password manager, etc.)

## AWS Secrets Manager Secrets

These are stored in **AWS Secrets Manager**, not GitHub. The ECS tasks will pull these at runtime.

### Create Development Secrets

```bash
# Django SECRET_KEY (Generate a strong random string)
aws secretsmanager create-secret \
  --name trinity/backend/dev/SECRET_KEY \
  --secret-string "generate-strong-random-string-here" \
  --region us-east-1

# Database connection URL
aws secretsmanager create-secret \
  --name trinity/backend/dev/DATABASE_URL \
  --secret-string "postgresql://trinity_admin:PASSWORD@trinity-db-dev.rds.amazonaws.com:5432/trinity_dev" \
  --region us-east-1

# Database password
aws secretsmanager create-secret \
  --name trinity/backend/dev/DATABASE_PASSWORD \
  --secret-string "strong-db-password" \
  --region us-east-1
```

### Create Production Secrets

```bash
# Django SECRET_KEY (Generate a strong random string)
aws secretsmanager create-secret \
  --name trinity/backend/prod/SECRET_KEY \
  --secret-string "generate-strong-random-string-here" \
  --region us-east-1

# Database connection URL
aws secretsmanager create-secret \
  --name trinity/backend/prod/DATABASE_URL \
  --secret-string "postgresql://trinity_admin:PASSWORD@trinity-db-prod.rds.amazonaws.com:5432/trinity_prod" \
  --region us-east-1

# Database password
aws secretsmanager create-secret \
  --name trinity/backend/prod/DATABASE_PASSWORD \
  --secret-string "strong-db-password" \
  --region us-east-1
```

### Generate Strong Secret Keys

**Using Python:**
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

**Using OpenSSL:**
```bash
openssl rand -base64 32
```

**Using Python secrets module:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Verify Secrets Setup

### Check GitHub Secrets

```bash
# List repository secrets
gh secret list

# List environment secrets
gh secret list --env dev
gh secret list --env prod
```

### Check AWS Secrets Manager

```bash
# List secrets
aws secretsmanager list-secrets --region us-east-1

# Get secret value (use with caution)
aws secretsmanager get-secret-value \
  --secret-id trinity/backend/dev/SECRET_KEY \
  --region us-east-1
```

## Security Best Practices

✅ **DO:**
- Use strong, randomly generated values
- Rotate credentials every 90 days
- Use different credentials for dev and prod
- Store backup copies in secure location (1Password, LastPass, etc.)
- Enable MFA on AWS account
- Use IAM roles instead of access keys when possible
- Review IAM policies regularly

❌ **DON'T:**
- Commit secrets to git (use `.gitignore`)
- Share secrets via email or Slack
- Use predictable or weak passwords
- Reuse secrets across environments
- Log sensitive values in CI/CD output
- Leave access keys in shell history
- Use root AWS credentials

## Rotating Secrets

### Rotate GitHub Secrets

1. Generate new value
2. Go to Settings → Secrets
3. Update the secret value
4. Confirm the change

### Rotate AWS Secrets Manager

```bash
# Create new version
aws secretsmanager update-secret \
  --secret-id trinity/backend/dev/SECRET_KEY \
  --secret-string "new-secret-value" \
  --region us-east-1

# Rotate IAM access keys
aws iam create-access-key --user-name github-actions-trinity-dev
aws iam delete-access-key --user-name github-actions-trinity-dev --access-key-id OLD_KEY_ID
```

### Rotate IAM Credentials

1. Create new access key for the user
2. Update GitHub Secrets with new key
3. Test that deployments still work
4. Delete old access key after confirming everything works

## Troubleshooting

### Secret Not Found Error

**Error**: `RequestError: An error occurred (ResourceNotFoundException) when calling the GetSecretValue operation`

**Solution**: 
- Verify secret name is correct in task definition
- Check AWS region matches
- Ensure IAM role has access to secret

### Secret Value Appears Masked in Logs

This is expected behavior. GitHub automatically masks secret values in workflow logs for security.

### Deployments Failing with Auth Errors

1. Verify AWS credentials are correct
2. Check IAM user has required permissions
3. Ensure secret names match task definitions
4. Review CloudWatch logs for specific errors

### Can't See Secret Values in UI

This is intentional for security. GitHub doesn't display secret values after creation. If you need to rotate, you must create a new secret with a new value.

## Monitoring & Alerts

### Set Up Secret Rotation Reminders

1. Create calendar events for rotation dates
2. Document rotation procedure
3. Test rotation in dev environment first
4. Implement AWS Config for compliance monitoring

### Audit Access

```bash
# View IAM user access key usage
aws iam get-access-key-last-used \
  --access-key-id AKIAIOSFODNN7EXAMPLE

# Check CloudTrail for secret access
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=trinity/backend/prod/SECRET_KEY
```

## Reference

- [GitHub: Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS: Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [AWS: IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
