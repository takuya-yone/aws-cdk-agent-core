import * as cdk from "aws-cdk-lib"
import {
  aws_bedrockagentcore as agentcore,
  type aws_dynamodb as dynamodb,
  type aws_s3 as s3,
} from "aws-cdk-lib"
import { Construct } from "constructs"

export type AgentCoreRuntimeConstructProps = {
  gateway: agentcore.Gateway
  dynamodb: {
    fxBalanceTable: dynamodb.TableV2
    fxBalanceHistoryTable: dynamodb.TableV2
    fxOrderHistoryTable: dynamodb.TableV2
  }
  fxOrderSummaryBucket: s3.Bucket
}

export class AgentCoreRuntimeConstruct extends Construct {
  public readonly runtime: agentcore.Runtime

  constructor(
    scope: Construct,
    id: string,
    props: AgentCoreRuntimeConstructProps,
  ) {
    super(scope, id)

    if (!props.gateway.gatewayUrl) {
      throw new Error("Gateway is required")
    }

    // Runtimeの作成
    this.runtime = new agentcore.Runtime(this, "StockAgentRuntime", {
      runtimeName: "StockAgentRuntime",
      agentRuntimeArtifact:
        agentcore.AgentRuntimeArtifact.fromAsset("src/sandbox_agent"),
      description: "StockAgentRuntime",
      environmentVariables: {
        AWS_DEFAULT_REGION: cdk.Stack.of(this).region,
        POWERTOOLS_SERVICE_NAME: "StockAgentRuntime",
        AGENT_CORE_GATEWAY_URL: props.gateway.gatewayUrl,
        FX_BALANCE_TABLE_NAME: props.dynamodb.fxBalanceTable.tableName,
        FX_BALANCE_HISTORY_TABLE_NAME:
          props.dynamodb.fxBalanceHistoryTable.tableName,
        FX_ORDER_HISTORY_TABLE_NAME:
          props.dynamodb.fxOrderHistoryTable.tableName,
        FX_ORDER_SUMMARY_BUCKET_NAME: props.fxOrderSummaryBucket.bucketName,
      },
    })

    // Runtimeへの権限付与
    props.gateway.grantInvoke(this.runtime)
    props.dynamodb.fxBalanceTable.grantReadWriteData(this.runtime)
    props.dynamodb.fxBalanceHistoryTable.grantReadWriteData(this.runtime)
    props.dynamodb.fxOrderHistoryTable.grantReadWriteData(this.runtime)
    props.fxOrderSummaryBucket.grantReadWrite(this.runtime)
  }
}
