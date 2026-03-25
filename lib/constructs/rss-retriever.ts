import {
  Duration,
  type aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambda_nodejs,
  aws_logs as logs,
  RemovalPolicy,
} from "aws-cdk-lib"
import { Construct } from "constructs"

type RssRetrieverConstructProps = {
  rssFeedTable: dynamodb.TableV2
}

export class RssRetrieverConstruct extends Construct {
  constructor(scope: Construct, id: string, props: RssRetrieverConstructProps) {
    super(scope, id)

    const rssFeedRetrieverLambdaName = "RssFeedRetrieverLambda"
    const rssFeedRetrieverLambda = new lambda_nodejs.NodejsFunction(
      this,
      rssFeedRetrieverLambdaName,
      {
        runtime: lambda.Runtime.NODEJS_24_X,
        functionName: rssFeedRetrieverLambdaName,
        description:
          "A Lambda function that retrieves RSS feed and stores it in DynamoDB",
        entry: "src/lambda/feed-retriever.ts",
        handler: "handler",
        timeout: Duration.seconds(300),
        memorySize: 256,
        tracing: lambda.Tracing.ACTIVE,
        logGroup: new logs.LogGroup(this, "RssFeedRetrieverLambdaLogGroup", {
          logGroupName: `/aws/lambda/${rssFeedRetrieverLambdaName}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        bundling: {
          bundleAwsSDK: true,
        },
        environment: {
          FEED_URL: "https://aws.amazon.com/about-aws/whats-new/recent/feed/",
          WHATSNEW_FEED_TABLE: props.rssFeedTable.tableName,
        },
      },
    )
    props.rssFeedTable.grantReadWriteData(rssFeedRetrieverLambda)
  }
}
