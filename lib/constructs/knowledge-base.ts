import {
  aws_s3 as as3,
  aws_bedrock as bedrock,
  aws_iam as iam,
  RemovalPolicy,
  aws_s3vectors as s3vectors,
} from "aws-cdk-lib"
// import * as bedrock from "@aws-cdk/aws-bedrock-alpha"
import { Construct } from "constructs"

export class KnowledgeBaseConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const vectorDimension = 1024

    const vectorStoreBucket = new s3vectors.CfnVectorBucket(
      this,
      "KnowledgeBaseVectorStoreBucket",
      {
        vectorBucketName: "knowledge-base-vector-store-bucket",
      },
    )

    const vectorStoreBucketIndex = new s3vectors.CfnIndex(
      this,
      "VectorStoreBucketIndex",
      {
        dataType: "float32",
        dimension: vectorDimension,
        distanceMetric: "euclidean",
        vectorBucketArn: vectorStoreBucket.attrVectorBucketArn,
        metadataConfiguration: {
          nonFilterableMetadataKeys: [
            "AMAZON_BEDROCK_TEXT",
            "AMAZON_BEDROCK_METADATA",
          ],
        },
      },
    )

    const dataSourceBucket = new as3.Bucket(
      this,
      "KnowledgeBaseDataSourceBucket",
      {
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      },
    )

    const titanFoundationModel = bedrock.FoundationModel.fromFoundationModelId(
      this,
      "TitanFoundationModel",
      bedrock.FoundationModelIdentifier.AMAZON_TITAN_EMBED_TEXT_V2_0,
    )

    const marketPlacePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "aws-marketplace:Subscribe",
        "aws-marketplace:ViewSubscriptions",
        "aws-marketplace:Unsubscribe",
      ],
      resources: ["*"],
    })

    const bedrockInvokePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["bedrock:InvokeModel"],
      resources: [titanFoundationModel.modelArn],
    })

    const vectorStoreBucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3vectors:GetIndex",
        "s3vectors:QueryVectors",
        "s3vectors:PutVectors",
        "s3vectors:GetVectors",
        "s3vectors:DeleteVectors",
      ],
      resources: [
        vectorStoreBucket.attrVectorBucketArn,
        `${vectorStoreBucket.attrVectorBucketArn}/*`,
      ],
    })

    const knowledgeBaseRole = new iam.Role(this, "KnowledgeBaseRole", {
      roleName: "BedrockKnowledgeBaseRole",
      assumedBy: new iam.ServicePrincipal("bedrock.amazonaws.com"),
      inlinePolicies: {
        MarketPlacePolicy: new iam.PolicyDocument({
          statements: [marketPlacePolicy],
        }),
        BedrockInvokePolicy: new iam.PolicyDocument({
          statements: [bedrockInvokePolicy],
        }),
        VectorStoreBucketPolicy: new iam.PolicyDocument({
          statements: [vectorStoreBucketPolicy],
        }),
      },
    })
    dataSourceBucket.grantRead(knowledgeBaseRole)

    const knowledgeBase = new bedrock.CfnKnowledgeBase(
      this,
      "BedrockKnowledgeBase",
      {
        name: "BedrockKnowledgeBase",
        roleArn: knowledgeBaseRole.roleArn,
        knowledgeBaseConfiguration: {
          type: "VECTOR",
          vectorKnowledgeBaseConfiguration: {
            embeddingModelArn: titanFoundationModel.modelArn,
            embeddingModelConfiguration: {
              bedrockEmbeddingModelConfiguration: {
                dimensions: vectorDimension,
              },
            },
          },
        },
        storageConfiguration: {
          type: "S3_VECTORS",
          s3VectorsConfiguration: {
            vectorBucketArn: vectorStoreBucket.attrVectorBucketArn,
            indexArn: vectorStoreBucketIndex.attrIndexArn,
          },
        },
      },
    )

    const _kbDataSource = new bedrock.CfnDataSource(
      this,
      "BedrockKnowledgeBaseDataStore",
      {
        name: dataSourceBucket.bucketName,
        knowledgeBaseId: knowledgeBase.ref,
        dataSourceConfiguration: {
          s3Configuration: {
            bucketArn: dataSourceBucket.bucketArn,
          },
          type: "S3",
        },
        vectorIngestionConfiguration: {
          chunkingConfiguration: {
            chunkingStrategy: "SEMANTIC",
            semanticChunkingConfiguration: {
              breakpointPercentileThreshold: 95,
              bufferSize: 0,
              maxTokens: 300,
            },
          },
        },
      },
    )
  }
}
