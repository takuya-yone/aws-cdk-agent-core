import { aws_cognito as cognito, RemovalPolicy } from "aws-cdk-lib"
import { Construct } from "constructs"
import type { CognitoClientConfig } from "../../bin/parameter"

type AuthConstructProps = {
  cognitoClientConfig: CognitoClientConfig
}

export class AuthConstruct extends Construct {
  public readonly userPool: cognito.UserPool
  constructor(scope: Construct, id: string, props: AuthConstructProps) {
    super(scope, id)

    this.userPool = new cognito.UserPool(this, "StrandsUserPool", {
      userPoolName: "StrandsUserPool",
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const _userPoolDomain = new cognito.UserPoolDomain(
      this,
      "StrandsUserPoolDomain",
      {
        userPool: this.userPool,
        cognitoDomain: {
          domainPrefix: props.cognitoClientConfig.domainPrefix,
        },
        managedLoginVersion: cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,
      },
    )

    const _userPoolClient = new cognito.UserPoolClient(
      this,
      "StrandsUserPoolClient",
      {
        userPoolClientName: "StrandsUserPoolClient",
        userPool: this.userPool,
        authFlows: {
          adminUserPassword: true,
          userPassword: true,
          userSrp: true,
        },
        oAuth: {
          scopes: [
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.PROFILE,
          ],
          callbackUrls: props.cognitoClientConfig.callbackUrls,
          logoutUrls: props.cognitoClientConfig.logoutUrls,
        },
      },
    )
  }
}
