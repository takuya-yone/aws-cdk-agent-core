# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `pnpm run build`   compile typescript to js
* `pnpm run watch`   watch for changes and compile
* `pnpm run test`    perform the vitest unit tests
* `pnpm cdk deploy`  deploy this stack to your default AWS account/region
* `pnpm cdk diff`    compare deployed stack with current state
* `pnpm cdk synth`   emits the synthesized CloudFormation template


## Cognito Opration

```bash
export USER_POOL_ID="ap-northeast-1_xxxxxxxxx"
export CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxx"
export COGNITO_USER_NAME="xxxxxxxxxxx"
export COGNITO_PASSWORD="xxxxxxxxxxxx"
export COGNITO_CONFIRMATION_CODE="xxxxxxx"

# Set cognito user's password by admin
aws cognito-idp admin-set-user-password \
  --user-pool-id ${USER_POOL_ID} \
  --username ${COGNITO_USER_NAME} \
  --password ${COGNITO_PASSWORD} \
  --permanent

# Signup by user
aws cognito-idp confirm-sign-up \
  --client-id ${CLIENT_ID} \
  --username ${COGNITO_USER_NAME} \
  --confirmation-code ${COGNITO_CONFIRMATION_CODE}

# Enable cognito user by user
aws cognito-idp admin-enable-user \
  --user-pool-id ${USER_POOL_ID} \
  --username ${COGNITO_USER_NAME}

# Initiate cognito user  auth by admin
aws cognito-idp admin-initiate-auth \
  --user-pool-id ${USER_POOL_ID} \
  --client-id ${CLIENT_ID} \
  --auth-flow "ADMIN_USER_PASSWORD_AUTH" \
  --auth-parameters USERNAME=${COGNITO_USER_NAME},PASSWORD=${COGNITO_PASSWORD}


# Initiate cognito user  auth by admin
aws cognito-idp initiate-auth \
  --client-id ${CLIENT_ID} \
  --auth-flow "USER_PASSWORD_AUTH" \
  --auth-parameters USERNAME=${COGNITO_USER_NAME},PASSWORD=${COGNITO_PASSWORD}
```

## endpoint

- http://localhost:8080/invocations
- http://localhost:3000/invoke
- https://xxxxxxx.execute-api.ap-northeast-1.amazonaws.com/v1/invoke