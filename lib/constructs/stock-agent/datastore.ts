import {
  aws_dynamodb as dynamodb,
  RemovalPolicy,
  aws_s3 as s3,
} from "aws-cdk-lib"
import { Construct } from "constructs"

export class StockDatastoreConstruct extends Construct {
  public readonly fxBalanceTable: dynamodb.TableV2
  public readonly fxBalanceHistoryTable: dynamodb.TableV2
  public readonly fxOrderHistoryTable: dynamodb.TableV2
  public readonly fxOrderSummaryBucket: s3.Bucket
  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.fxBalanceTable = new dynamodb.TableV2(this, "FxBalanceTable", {
      tableName: "FxBalanceTable",
      partitionKey: {
        name: "ActorId",
        type: dynamodb.AttributeType.STRING,
      },
      timeToLiveAttribute: "ExpireAt",
      billing: dynamodb.Billing.onDemand(),
      removalPolicy: RemovalPolicy.DESTROY,
    })

    this.fxBalanceHistoryTable = new dynamodb.TableV2(
      this,
      "FxBalanceHistoryTable",
      {
        tableName: "FxBalanceHistoryTable",
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
      },
    )

    this.fxOrderHistoryTable = new dynamodb.TableV2(
      this,
      "FxOrderHistoryTable",
      {
        tableName: "FxOrderHistoryTable",
        partitionKey: {
          name: "TransactionId",
          type: dynamodb.AttributeType.STRING,
        },
        timeToLiveAttribute: "ExpireAt",
        billing: dynamodb.Billing.onDemand(),
        removalPolicy: RemovalPolicy.DESTROY,
        globalSecondaryIndexes: [
          {
            indexName: "actor-id-index",
            partitionKey: {
              name: "ActorId",
              type: dynamodb.AttributeType.STRING,
            },
            sortKey: { name: "Timestamp", type: dynamodb.AttributeType.STRING },
          },
        ],
      },
    )

    this.fxOrderSummaryBucket = new s3.Bucket(this, "FxOrderSummaryBucket", {
      bucketName: "fx-order-summary-bucket",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })
  }
}
