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

    const vectorStoreBucket = new s3vectors.CfnVectorBucket(
      this,
      "KnowledgeBaseVectorStoreBucket",
    )

    const dataStoreBucket = new as3.Bucket(
      this,
      "KnowledgeBaseDataStoreBucket",
      {
        removalPolicy: RemovalPolicy.DESTROY,
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
    dataStoreBucket.grantRead(knowledgeBaseRole)

    // const _aaa = new bedrock.CfnKnowledgeBase(this, "CfnKnowledgeBase", {
    //   name: "CfnKnowledgeBase",
    //   roleArn: "arn:aws:iam::123456789012:role/BedrockKnowledgeBaseRole",
    //   knowledgeBaseConfiguration: {
    //     type: "VECTOR",
    //   },
    // })
  }
}
