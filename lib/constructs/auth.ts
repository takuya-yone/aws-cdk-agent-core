import {
  aws_apigateway as apigw,
  aws_cognito as cognito,
  RemovalPolicy,
} from "aws-cdk-lib"
import { Construct } from "constructs"

export class AuthConstruct extends Construct {
  public readonly cognitoAuthorizer: apigw.CognitoUserPoolsAuthorizer
  constructor(scope: Construct, id: string) {
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
  }
}
