import type * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha"
import {
  aws_apigateway as apigw,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfront_origins,
  type aws_cognito as cognito,
  Duration,
  aws_iam as iam,
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
  distribution: cloudfront.Distribution
  apiGwConfig: ApiGwConfig
}

export class ApiGwConstruct extends Construct {
  public readonly restApi: apigw.RestApi
  public readonly streamApi: apigw.RestApi
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

    const apiGwBufferedRouterLambdaName = "ApiGwBufferedRouterLambda"
    const apigwBufferedRouterLambda = new lambda_nodejs.NodejsFunction(
      this,
      apiGwBufferedRouterLambdaName,
      {
        runtime: lambda.Runtime.NODEJS_24_X,
        functionName: apiGwBufferedRouterLambdaName,
        entry: "src/lambda/apigw-router/index.ts",
        handler: "handler",
        timeout: Duration.seconds(900),
        memorySize: 256,
        tracing: lambda.Tracing.ACTIVE,
        logGroup: new logs.LogGroup(this, "ApiGwBufferedRouterLambdaLogGroup", {
          logGroupName: `/aws/lambda/${apiGwBufferedRouterLambdaName}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        bundling: {
          bundleAwsSDK: true,
        },
        environment: {
          POWERTOOLS_SERVICE_NAME: apiGwBufferedRouterLambdaName,
          AGENT_RUNTIME_ARN: props.runtime.agentRuntimeArn,
        },
      },
    )
    props.runtime.grantInvoke(apigwBufferedRouterLambda)

    const apiGwStreamRouterLambdaName = "ApiGwStreamRouterLambda"
    const apigwStreamRouterLambda = new lambda_nodejs.NodejsFunction(
      this,
      apiGwStreamRouterLambdaName,
      {
        runtime: lambda.Runtime.NODEJS_24_X,
        functionName: apiGwStreamRouterLambdaName,
        entry: "src/lambda/apigw-router/index.ts",
        handler: "streamHandler",
        timeout: Duration.seconds(900),
        memorySize: 256,
        tracing: lambda.Tracing.ACTIVE,
        logGroup: new logs.LogGroup(this, "ApiGwStreamRouterLambdaLogGroup", {
          logGroupName: `/aws/lambda/${apiGwStreamRouterLambdaName}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        bundling: {
          bundleAwsSDK: true,
        },
        environment: {
          POWERTOOLS_SERVICE_NAME: apiGwStreamRouterLambdaName,
          AGENT_RUNTIME_ARN: props.runtime.agentRuntimeArn,
        },
      },
    )
    props.runtime.grantInvoke(apigwStreamRouterLambda)

    ////////////////////////////////////////////

    const apigwResource = "execute-api:/*"
    const _apigwResourcePolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ["execute-api:Invoke"],
          principals: [new iam.AnyPrincipal()],
          resources: [apigwResource],
          conditions: {
            StringNotEquals: {
              "aws:Referer": props.apiGwConfig.referer,
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["execute-api:Invoke"],
          principals: [new iam.AnyPrincipal()],
          resources: [apigwResource],
        }),
      ],
    })

    ////////////////////////////////////////////
    // Rest API
    ////////////////////////////////////////////
    const restApiName = "AgentCoreRestApi"
    const cognitoRestAuthorizer = new apigw.CognitoUserPoolsAuthorizer(
      this,
      "CognitoRestAuthorizer",
      {
        authorizerName: "CognitoRestAuthorizer",
        cognitoUserPools: [props.userPool],
      },
    )
    this.restApi = new apigw.RestApi(this, restApiName, {
      restApiName: restApiName,
      // policy: apigwResourcePolicy,
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
      // defaultCorsPreflightOptions: {
      //   allowOrigins: apigw.Cors.ALL_ORIGINS,
      //   allowMethods: apigw.Cors.ALL_METHODS,
      // },
      // defaultIntegration: new apigw.LambdaIntegration(
      //   apigwBufferedRouterLambda,
      //   {
      //     responseTransferMode: apigw.ResponseTransferMode.BUFFERED,
      //     timeout: props.apiGwConfig.timeoutSeconds.buffered,
      //     proxy: true,
      //   },
      // ),
      // defaultMethodOptions: {
      //   authorizer: cognitoRestAuthorizer,
      // },
    })

    const _restApiRoot = this.restApi.root.addProxy({
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
      defaultIntegration: new apigw.LambdaIntegration(
        apigwBufferedRouterLambda,
        {
          responseTransferMode: apigw.ResponseTransferMode.BUFFERED,
          timeout: props.apiGwConfig.timeoutSeconds.buffered,
          proxy: true,
        },
      ),
      defaultMethodOptions: {
        authorizer: cognitoRestAuthorizer,
      },
    })

    ////////////////////////////////////////////
    // Stream API
    ////////////////////////////////////////////
    const streamApiName = "AgentCoreStreamApi"
    const cognitoStreamAuthorizer = new apigw.CognitoUserPoolsAuthorizer(
      this,
      "CognitoStreamAuthorizer",
      {
        authorizerName: "CognitoStreamAuthorizer",
        cognitoUserPools: [props.userPool],
      },
    )
    this.streamApi = new apigw.RestApi(this, streamApiName, {
      restApiName: streamApiName,
      // policy: apigwResourcePolicy,
      deployOptions: {
        stageName: props.apiGwConfig.stageName,
        tracingEnabled: true,
        metricsEnabled: true,
        dataTraceEnabled: true,
        accessLogDestination: new apigw.LogGroupLogDestination(
          new logs.LogGroup(this, "ApiGwStreamAccessLogGroup", {
            logGroupName: `/aws/apigateway/${streamApiName}-AccessLogs`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY,
          }),
        ),
        accessLogFormat: apigw.AccessLogFormat.jsonWithStandardFields(),
      },
      // defaultCorsPreflightOptions: {
      //   allowOrigins: apigw.Cors.ALL_ORIGINS,
      //   allowMethods: apigw.Cors.ALL_METHODS,
      // },
      // defaultIntegration: new apigw.LambdaIntegration(apigwStreamRouterLambda, {
      //   responseTransferMode: apigw.ResponseTransferMode.STREAM,
      //   timeout: props.apiGwConfig.timeoutSeconds.stream,
      //   proxy: true,
      // }),
      // defaultMethodOptions: {
      //   authorizer: cognitoStreamAuthorizer,
      // },
    })

    const _streamApiRoot = this.streamApi.root.addProxy({
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
      defaultIntegration: new apigw.LambdaIntegration(apigwStreamRouterLambda, {
        responseTransferMode: apigw.ResponseTransferMode.STREAM,
        timeout: props.apiGwConfig.timeoutSeconds.stream,
        proxy: true,
      }),
      defaultMethodOptions: {
        authorizer: cognitoStreamAuthorizer,
      },
    })

    ////////////////////////////////////////////
    // CloudFront Distribution
    ////////////////////////////////////////////

    props.distribution.addBehavior(
      "/api/*",
      new cloudfront_origins.RestApiOrigin(this.restApi, {
        customHeaders: { Referer: props.apiGwConfig.referer },
      }),
      {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        originRequestPolicy:
          cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        responseHeadersPolicy:
          cloudfront.ResponseHeadersPolicy
            .CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT,
      },
    )

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
