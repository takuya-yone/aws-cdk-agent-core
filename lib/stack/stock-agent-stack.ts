import * as cdk from "aws-cdk-lib/core"
import type { Construct } from "constructs"
import type { StackParameters } from "../../bin/parameter"
import {
  AgentCoreGwConstruct,
  AgentCoreRuntimeConstruct,
  StockDatastoreConstruct,
} from "../constructs"

export class StockAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackParameters) {
    super(scope, id, props)

    const stockDatastoreConstruct = new StockDatastoreConstruct(
      this,
      "StockDatastoreConstruct",
    )

    const agentCoreGwConstruct = new AgentCoreGwConstruct(
      this,
      "AgentCoreGwConstruct",
    )

    const _agentCoreRuntimeConstruct = new AgentCoreRuntimeConstruct(
      this,
      "AgentCoreRuntimeConstruct",
      {
        gateway: agentCoreGwConstruct.gateway,
        dynamodb: {
          fxBalanceTable: stockDatastoreConstruct.fxBalanceTable,
          fxBalanceHistoryTable: stockDatastoreConstruct.fxBalanceHistoryTable,
          fxOrderHistoryTable: stockDatastoreConstruct.fxOrderHistoryTable,
        },
        fxOrderSummaryBucket: stockDatastoreConstruct.fxOrderSummaryBucket,
      },
    )
  }
}
