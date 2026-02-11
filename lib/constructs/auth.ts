import {
  aws_apigateway as apigw,
  aws_cognito as cognito,
  RemovalPolicy,
} from "aws-cdk-lib"
import { Construct } from "constructs"
import type { CognitoClientConfig } from "../../bin/parameter"

type AuthConstructProps = {
  cognitoClientConfig: CognitoClientConfig
}

export class AuthConstruct extends Construct {
  public readonly cognitoAuthorizer: apigw.CognitoUserPoolsAuthorizer
  constructor(scope: Construct, id: string, props: AuthConstructProps) {
    super(scope, id)

    const userPool = new cognito.UserPool(this, "StrandsUserPool", {
      userPoolName: "StrandsUserPool",
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    })

    this.cognitoAuthorizer = new apigw.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        authorizerName: "CognitoAuthorizer",
        cognitoUserPools: [userPool],
      },
    )

    const _userPoolClient = new cognito.UserPoolClient(
      this,
      "StrandsUserPoolClient",
      {
        userPoolClientName: "StrandsUserPoolClient",
        userPool: userPool,
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
