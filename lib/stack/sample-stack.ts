import * as cdk from "aws-cdk-lib/core"
import type { Construct } from "constructs"

export class SampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
  }
}
