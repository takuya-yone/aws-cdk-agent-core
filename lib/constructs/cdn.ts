import * as cdk from "aws-cdk-lib"
import {
  type aws_apigateway as apigw,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfront_origins,
  aws_s3 as s3,
} from "aws-cdk-lib"
import { Construct } from "constructs"

type CdnConstructProps = {
  restApi: apigw.RestApi
}

export class CdnConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CdnConstructProps) {
    super(scope, id)

    const frontendAppBucket = new s3.Bucket(this, "StrandsFrontendAppBucket", {
      bucketName: "strands-frontend-app-bucket",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const _distribution = new cloudfront.Distribution(
      this,
      "StrandsCloudFrontDistribution",
      {
        comment: "StrandsCloudFrontDistribution",
        defaultBehavior: {
          origin:
            cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
              frontendAppBucket,
            ),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        },
        additionalBehaviors: {
          "/api*": {
            origin: new cloudfront_origins.RestApiOrigin(props.restApi, {
              //   customHeaders: { Referer: 'c46d2fbb-4ff3-4c34-a201-4b57bfa8bc1a' },
            }),
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            originRequestPolicy:
              cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
            responseHeadersPolicy:
              cloudfront.ResponseHeadersPolicy
                .CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT,
          },
        },
        defaultRootObject: "index.html",
        httpVersion: cloudfront.HttpVersion.HTTP3,
      },
    )
  }
}
