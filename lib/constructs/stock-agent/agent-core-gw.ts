import * as cdk from "aws-cdk-lib"
import { aws_bedrockagentcore as agentcore, aws_iam as iam } from "aws-cdk-lib"
import { Construct } from "constructs"

export class AgentCoreGwConstruct extends Construct {
  public readonly gateway: agentcore.Gateway

  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.gateway = new agentcore.Gateway(this, `StockAgentCoreGateway`, {
      gatewayName: `StockAgentCoreGateway`,
      authorizerConfiguration: agentcore.GatewayAuthorizer.usingAwsIam(),
      // role: gatewayRole,
    })
    // Web Search 用の権限をゲートウェイのサービスロールに追加
    this.gateway.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        sid: "InvokeWebSearch",
        actions: ["bedrock-agentcore:InvokeWebSearch"],
        // サービス所有の ARN（アカウント ID の位置は "aws"）
        resources: [
          `arn:aws:bedrock-agentcore:${cdk.Stack.of(this).region}:aws:tool/web-search.v1`,
        ],
      }),
    )

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
  }
}
