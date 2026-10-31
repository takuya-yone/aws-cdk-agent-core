import {
  aws_bedrockagentcore as agentcore,
  aws_lambda as lambda,
} from "aws-cdk-lib"

import { Construct } from "constructs"

export class AgentCoreGwConstruct extends Construct {
  public readonly gateway: agentcore.Gateway

  constructor(scope: Construct, id: string) {
    super(scope, id)

    // const gatewayRole = new iam.Role(this, 'GatewayRole', {
    //   assumedBy: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com', {
    //     conditions: {
    //       StringEquals: { 'aws:SourceAccount': ``},
    //       ArnLike: {
    //         'aws:SourceArn': `arn:aws:bedrock-agentcore:${props.env.region}:${props.env.account}:gateway/*`,
    //       },
    //     },
    //   }),
    // })

    // gatewayRole.addToPolicy(
    //   new iam.PolicyStatement({
    //     actions: ['bedrock-agentcore:InvokeGateway'],
    //     resources: [`arn:aws:bedrock-agentcore:${props.env.region}:${props.env.account}:gateway/*`],
    //   }),
    // )
    // gatewayRole.addToPolicy(
    //   new iam.PolicyStatement({
    //     actions: ['bedrock-agentcore:InvokeWebSearch'],
    //     resources: [`arn:aws:bedrock-agentcore:${props.env.region}:aws:tool/web-search.v1`],
    //   }),
    // )

    // ツール本体の Lambda
    const toolFn = new lambda.Function(this, "ToolFn", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "index.handler",
      logRetention: 7, // Retain logs for 7 days
      code: lambda.Code.fromInline(
        `def handler(event, context):
    return {"message": f"hello {event.get('name', 'world')}"}`,
      ),
    })

    this.gateway = new agentcore.Gateway(this, `StockAgentCoreGateway`, {
      gatewayName: `StockAgentCoreGateway`,
      authorizerConfiguration: agentcore.GatewayAuthorizer.usingAwsIam(),
      // role: gatewayRole,
    })

    const _webSearchTarget = new agentcore.CfnGatewayTarget(
      this,
      "WebSearchTarget",
      {
        name: "web-search-tool",
        gatewayIdentifier: this.gateway.gatewayId,
        targetConfiguration: {
          mcp: {
            connector: {
              source: { connectorId: "web-search" },
              configurations: [
                {
                  name: "WebSearch",
                  parameterValues: {},
                },
              ],
            },
          },
        },
        credentialProviderConfigurations: [
          { credentialProviderType: "GATEWAY_IAM_ROLE" },
        ],
      },
    )

    this.gateway.addLambdaTarget("HelloTarget", {
      gatewayTargetName: "hello-tool",
      description: "Say hello",
      lambdaFunction: toolFn,
      toolSchema: agentcore.ToolSchema.fromInline([
        {
          name: "say_hello",
          description: "Greets the given name",
          inputSchema: {
            type: agentcore.SchemaDefinitionType.OBJECT,
            properties: {
              name: {
                type: agentcore.SchemaDefinitionType.STRING,
                description: "Name to greet",
              },
            },
            required: ["name"],
          },
        },
      ]),
    })
  }
}
