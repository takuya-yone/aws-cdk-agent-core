import { aws_dynamodb as dynamodb, RemovalPolicy } from "aws-cdk-lib"
import { Construct } from "constructs"

export class DatastoreConstruct extends Construct {
  public readonly agentCoreLogTable: dynamodb.TableV2
  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.agentCoreLogTable = new dynamodb.TableV2(this, "AgentCoreLogsTable", {
      tableName: "AgentCoreLogsTable",
      partitionKey: {
        name: "ActorId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "Timestamp",
        type: dynamodb.AttributeType.STRING,
      },
      timeToLiveAttribute: "ExpireAt",
      billing: dynamodb.Billing.onDemand(),
      removalPolicy: RemovalPolicy.DESTROY,
    })
  }
}
