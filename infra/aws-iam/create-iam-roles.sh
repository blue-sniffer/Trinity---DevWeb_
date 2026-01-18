#!/bin/bash

# This script creates the necessary IAM roles and policies for GitHub Actions CI/CD
# Usage: ./create-iam-roles.sh ACCOUNT_ID AWS_REGION

ACCOUNT_ID=${1:-"your-account-id"}
AWS_REGION=${2:-"us-east-1"}
POLICY_PATH="./infra/aws-iam"

echo "Creating IAM roles for Trinity CI/CD pipeline..."
echo "Account ID: $ACCOUNT_ID"
echo "Region: $AWS_REGION"

# 1. Create ECS Task Execution Role
echo -e "\n1. Creating ECS Task Execution Role..."
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ecs-tasks.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }' \
  --region $AWS_REGION 2>/dev/null || echo "Role may already exist, continuing..."

# 2. Attach execution role policy
echo -e "\n2. Attaching execution role policy..."
sed "s/ACCOUNT_ID/$ACCOUNT_ID/g" "$POLICY_PATH/ecs-task-execution-role-policy.json" > /tmp/execution-policy.json
aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name ecsTaskExecutionPolicy \
  --policy-document file:///tmp/execution-policy.json

# 3. Create ECS Task Role
echo -e "\n3. Creating ECS Task Role..."
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ecs-tasks.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }' \
  --region $AWS_REGION 2>/dev/null || echo "Role may already exist, continuing..."

# 4. Attach task role policy
echo -e "\n4. Attaching task role policy..."
sed "s/ACCOUNT_ID/$ACCOUNT_ID/g" "$POLICY_PATH/ecs-task-role-policy.json" > /tmp/task-policy.json
aws iam put-role-policy \
  --role-name ecsTaskRole \
  --policy-name ecsTaskPolicy \
  --policy-document file:///tmp/task-policy.json

# 5. Create GitHub Actions IAM User
echo -e "\n5. Creating GitHub Actions IAM User..."
aws iam create-user \
  --user-name github-actions-trinity \
  --region $AWS_REGION 2>/dev/null || echo "User may already exist, continuing..."

# 6. Attach policy to GitHub Actions user
echo -e "\n6. Attaching policy to GitHub Actions user..."
sed "s/ACCOUNT_ID/$ACCOUNT_ID/g" "$POLICY_PATH/github-actions-policy.json" > /tmp/github-actions-policy.json
aws iam put-user-policy \
  --user-name github-actions-trinity \
  --policy-name GitHubActionsPolicy \
  --policy-document file:///tmp/github-actions-policy.json

# 7. Create access keys for GitHub Actions
echo -e "\n7. Creating access keys for GitHub Actions..."
CREDENTIALS=$(aws iam create-access-key \
  --user-name github-actions-trinity \
  --region $AWS_REGION 2>/dev/null || echo "Access key creation skipped")

echo -e "\n✅ IAM setup complete!"
echo -e "\n📝 Next steps:"
echo "1. If new access keys were created, save them in a secure location"
echo "2. Add these GitHub secrets to your repository:"
echo "   - AWS_ACCESS_KEY_ID_dev"
echo "   - AWS_SECRET_ACCESS_KEY_dev"
echo "   - AWS_ACCESS_KEY_ID_prod"
echo "   - AWS_SECRET_ACCESS_KEY_prod"
echo "   - REACT_APP_API_URL_dev"
echo "   - REACT_APP_API_URL_prod"
echo "3. Create Secrets Manager entries for:"
echo "   - trinity/backend/dev/SECRET_KEY"
echo "   - trinity/backend/dev/DATABASE_URL"
echo "   - trinity/backend/dev/DATABASE_PASSWORD"
echo "   - trinity/backend/prod/SECRET_KEY"
echo "   - trinity/backend/prod/DATABASE_URL"
echo "   - trinity/backend/prod/DATABASE_PASSWORD"
echo -e "\n4. Update ECR repositories in task definitions with your account ID"
echo -e "\n5. Create ECS clusters and services with the task definitions"
