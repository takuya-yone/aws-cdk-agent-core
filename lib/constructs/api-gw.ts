import {
  aws_apigateway as apigw,
  Duration,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambda_nodejs,
  aws_logs as logs,
  RemovalPolicy,
} from "aws-cdk-lib"
import { Construct } from "constructs"

export class ApiGwConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const agentCoreProxyLambdaName = "AgentCoreProxyLambda"
    const agentCoreProxyLambda = new lambda_nodejs.NodejsFunction(
      this,
      agentCoreProxyLambdaName,
      {
        runtime: lambda.Runtime.NODEJS_24_X,
        functionName: agentCoreProxyLambdaName,
        entry: "src/lambda/agent-core-proxy.ts",
        timeout: Duration.seconds(900),
        tracing: lambda.Tracing.ACTIVE,
        logGroup: new logs.LogGroup(this, "AgentCoreProxyLambdaLogGroup", {
          logGroupName: `/aws/lambda/${agentCoreProxyLambdaName}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        environment: {
          POWERTOOLS_SERVICE_NAME: agentCoreProxyLambdaName,
        },
      },
    )

    const restApi = new apigw.RestApi(this, "AgentCoreApi", {
      restApiName: `RestApiForAgentCore`,
      deployOptions: {
        stageName: "v1",
        tracingEnabled: true,
      },
    })

    const restApiInvoke = restApi.root.addResource("invoke")

    restApiInvoke.addMethod(
      "POST",
      new apigw.LambdaIntegration(agentCoreProxyLambda),
    )
  }
}
