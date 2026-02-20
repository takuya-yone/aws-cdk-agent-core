import * as cdk from "aws-cdk-lib"
import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfront_origins,
  aws_s3 as s3,
} from "aws-cdk-lib"
import { Construct } from "constructs"

export class CdnConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const frontendAppBucket = new s3.Bucket(this, "StrandsFrontendAppBucket", {
      bucketName: "strands-frontend-app-bucket",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const cfRedirectFunction = new cloudfront.Function(
      this,
      "CfRedirectFunction",
      {
        code: cloudfront.FunctionCode.fromFile({
          filePath: "src/cloudfront/index.js",
        }),
      },
    )

    this.distribution = new cloudfront.Distribution(
      this,
      "StrandsCloudFrontDistribution",
      {
        comment: "StrandsCloudFrontDistribution",
        defaultBehavior: {
          origin:
            cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
              frontendAppBucket,
            ),
          functionAssociations: [
            {
              function: cfRedirectFunction,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        },
        defaultRootObject: "index.html",
        httpVersion: cloudfront.HttpVersion.HTTP3,
      },
    )
  }
}
