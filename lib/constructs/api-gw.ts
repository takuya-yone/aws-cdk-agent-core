import type * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha"
import {
  aws_apigateway as apigw,
  type aws_cognito as cognito,
  Duration,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambda_nodejs,
  aws_logs as logs,
  RemovalPolicy,
} from "aws-cdk-lib"
import { Construct } from "constructs"
import type { ApiGwConfig } from "../../bin/parameter"

type ApiGwConstructProps = {
  runtime: agentcore.Runtime
  userPool: cognito.UserPool
  apiGwConfig: ApiGwConfig
}

export class ApiGwConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ApiGwConstructProps) {
    super(scope, id)

    // const agentCoreProxyLambdaName = "AgentCoreProxyLambda"
    // const agentCoreProxyLambda = new lambda_nodejs.NodejsFunction(
    //   this,
    //   agentCoreProxyLambdaName,
    //   {
    //     runtime: lambda.Runtime.NODEJS_24_X,
    //     functionName: agentCoreProxyLambdaName,
    //     entry: "src/lambda/agent-core-proxy.ts",
    //     timeout: Duration.seconds(900),
    //     memorySize: 128,
    //     tracing: lambda.Tracing.ACTIVE,
    //     logGroup: new logs.LogGroup(this, "AgentCoreProxyLambdaLogGroup", {
    //       logGroupName: `/aws/lambda/${agentCoreProxyLambdaName}`,
    //       retention: logs.RetentionDays.ONE_WEEK,
    //       removalPolicy: RemovalPolicy.DESTROY,
    //     }),
    //     bundling: {
    //       bundleAwsSDK: true,
    //     },
    //     environment: {
    //       POWERTOOLS_SERVICE_NAME: agentCoreProxyLambdaName,
    //       AGENT_RUNTIME_ARN: props.runtime.agentRuntimeArn,
    //     },
    //   },
    // )
    // props.runtime.grantInvoke(agentCoreProxyLambda)

    const apiGwRouterLambdaName = "ApiGwRouterLambda"
    const apigwRouterLambda = new lambda_nodejs.NodejsFunction(
      this,
      apiGwRouterLambdaName,
      {
        runtime: lambda.Runtime.NODEJS_24_X,
        functionName: apiGwRouterLambdaName,
        entry: "src/lambda/apigw-router/index.ts",
        handler: "handler",
        timeout: Duration.seconds(900),
        memorySize: 256,
        tracing: lambda.Tracing.ACTIVE,
        logGroup: new logs.LogGroup(this, "ApiGwRouterLambdaLogGroup", {
          logGroupName: `/aws/lambda/${apiGwRouterLambdaName}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        bundling: {
          bundleAwsSDK: true,
        },
        environment: {
          POWERTOOLS_SERVICE_NAME: apiGwRouterLambdaName,
          AGENT_RUNTIME_ARN: props.runtime.agentRuntimeArn,
        },
      },
    )
    props.runtime.grantInvoke(apigwRouterLambda)

    const cognitoAuthorizer = new apigw.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        authorizerName: "CognitoAuthorizer",
        cognitoUserPools: [props.userPool],
      },
    )

    const restApiName = "AgentCoreRestApi"

    const restApi = new apigw.RestApi(this, restApiName, {
      restApiName: restApiName,
      deployOptions: {
        stageName: props.apiGwConfig.stageName,
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
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
      defaultIntegration: new apigw.LambdaIntegration(apigwRouterLambda, {
        responseTransferMode: apigw.ResponseTransferMode.BUFFERED,
        timeout: props.apiGwConfig.timeoutSeconds.buffered,
        proxy: true,
      }),
      defaultMethodOptions: {
        authorizer: cognitoAuthorizer,
      },
    })

    const _restApiRoot = restApi.root.addProxy({
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
      defaultIntegration: new apigw.LambdaIntegration(apigwRouterLambda, {
        responseTransferMode: apigw.ResponseTransferMode.STREAM,
        timeout: props.apiGwConfig.timeoutSeconds.stream,
        proxy: true,
      }),
      defaultMethodOptions: {
        authorizer: cognitoAuthorizer,
      },
    })

    // const _restApiRoot = restApi.root.addProxy({
    //   defaultIntegration,
    //   defaultMethodOptions,
    // })
    // defaultMethodOptions,

    // const restApiInvoke = restApi.root.addResource("invoke")

    // const invokeRequestModel: apigw.Model = restApi.addModel(
    //   "InvokeRequestModel",
    //   {
    //     modelName: "InvokeRequestModel",
    //     schema: {
    //       type: apigw.JsonSchemaType.OBJECT,
    //       properties: {
    //         prompt: {
    //           type: apigw.JsonSchemaType.STRING,
    //         },
    //       },
    //       required: ["prompt"],
    //     },
    //   },
    // )

    // const invokeResponseModel: apigw.Model = restApi.addModel(
    //   "InvokeResponseModel",
    //   {
    //     modelName: "InvokeResponseModel",
    //     schema: {
    //       type: apigw.JsonSchemaType.OBJECT,
    //       properties: {},
    //     },
    //   },
    // )

    // restApi.root.addMethod(
    //   "ANY",
    //   new apigw.LambdaIntegration(apigwRouterLambda, {
    //     responseTransferMode: apigw.ResponseTransferMode.BUFFERED,
    //     timeout: props.apiGwConfig.timeoutSeconds,
    //     proxy: true,
    //   }),
    //   {
    //     authorizer: cognitoAuthorizer,
    //     // requestModels: {
    //     //   "application/json": invokeRequestModel,
    //     // },
    //     // methodResponses: [
    //     //   {
    //     //     statusCode: "200",
    //     //     responseModels: {
    //     //       "text/event-stream": invokeResponseModel,
    //     //     },
    //     //   },
    //     // ],
    //   },
    // )

    // restApiInvoke.addMethod(
    //   "POST",
    //   new apigw.LambdaIntegration(agentCoreProxyLambda, {
    //     responseTransferMode: apigw.ResponseTransferMode.STREAM,
    //     timeout: props.apiGwConfig.timeoutSeconds,
    //   }),
    //   {
    //     authorizer: props.cognitoAuthorizer,
    //     requestModels: {
    //       "application/json": invokeRequestModel,
    //     },
    //     methodResponses: [
    //       {
    //         statusCode: "200",
    //         responseModels: {
    //           "text/event-stream": invokeResponseModel,
    //         },
    //       },
    //     ],
    //   },
    // )
  }
}
