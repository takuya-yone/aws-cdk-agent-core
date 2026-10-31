import * as cdk from "aws-cdk-lib/core"
import type { Construct } from "constructs"
import type { StackParameters } from "../../bin/parameter"
import { StockDatastoreConstruct } from "../constructs"

export class StockAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackParameters) {
    super(scope, id, props)

    const _stockDatastoreConstruct = new StockDatastoreConstruct(
      this,
      "StockDatastoreConstruct",
    )
  }
}
