import { aws_dynamodb as dynamodb, RemovalPolicy } from "aws-cdk-lib"
import { Construct } from "constructs"

export class DatastoreConstruct extends Construct {
  public readonly agentCoreLogTable: dynamodb.TableV2
  public readonly whatsNewFeedTable: dynamodb.TableV2
  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.agentCoreLogTable = new dynamodb.TableV2(this, "AgentCoreLogTable", {
      tableName: "AgentCoreLogTable",
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

    this.whatsNewFeedTable = new dynamodb.TableV2(this, "WhatsNewFeedTable", {
      tableName: "WhatsNewFeedTable",
      partitionKey: {
        name: "YearMonth",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "IsoDate",
        type: dynamodb.AttributeType.STRING,
      },
      billing: dynamodb.Billing.onDemand(),
      removalPolicy: RemovalPolicy.DESTROY,
    })
  }
}
