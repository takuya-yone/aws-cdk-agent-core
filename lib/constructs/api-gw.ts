import type * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha"
import {
  aws_apigateway as apigw,
  Duration,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambda_nodejs,
  aws_logs as logs,
  RemovalPolicy,
} from "aws-cdk-lib"
import { Construct } from "constructs"

type ApiGwConstructProps = {
  runtime: agentcore.Runtime
  cognitoAuthorizer: apigw.CognitoUserPoolsAuthorizer
}

export class ApiGwConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ApiGwConstructProps) {
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
        bundling: {
          bundleAwsSDK: true,
        },
        environment: {
          POWERTOOLS_SERVICE_NAME: agentCoreProxyLambdaName,
          AGENT_RUNTIME_ARN: props.runtime.agentRuntimeArn,
        },
      },
    )
    props.runtime.grantInvoke(agentCoreProxyLambda)

    const restApiName = "AgentCoreRestApi"
    const restApi = new apigw.RestApi(this, restApiName, {
      restApiName: restApiName,
      deployOptions: {
        stageName: "v1",
        tracingEnabled: true,
        metricsEnabled: true,
        dataTraceEnabled: true,
        accessLogDestination: new apigw.LogGroupLogDestination(
          new logs.LogGroup(this, "ApiGwAccessLogGroup", {
            logGroupName: `/aws/apigateway/${restApiName}-AccessLogs`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY,
          }),
        ),
        accessLogFormat: apigw.AccessLogFormat.jsonWithStandardFields(),
      },
    })

    const restApiInvoke = restApi.root.addResource("invoke")

    const invokeRequestModel: apigw.Model = restApi.addModel(
      "InvokeRequestModel",
      {
        modelName: "InvokeRequestModel",
        schema: {
          type: apigw.JsonSchemaType.OBJECT,
          properties: {
            prompt: {
              type: apigw.JsonSchemaType.STRING,
            },
            sessionId: {
              type: apigw.JsonSchemaType.STRING,
            },
          },
          required: ["prompt"],
        },
      },
    )

    const invokeResponseModel: apigw.Model = restApi.addModel(
      "InvokeResponseModel",
      {
        modelName: "InvokeResponseModel",
        schema: {
          type: apigw.JsonSchemaType.OBJECT,
          properties: {},
        },
      },
    )

    restApiInvoke.addMethod(
      "POST",
      new apigw.LambdaIntegration(agentCoreProxyLambda, {
        responseTransferMode: apigw.ResponseTransferMode.STREAM,
      }),
      {
        authorizer: props.cognitoAuthorizer,
        requestModels: {
          "application/json": invokeRequestModel,
        },
        methodResponses: [
          {
            statusCode: "200",
            responseModels: {
              "text/event-stream": invokeResponseModel,
            },
          },
        ],
      },
    )
  }
}
