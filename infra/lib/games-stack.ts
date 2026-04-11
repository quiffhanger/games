import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import { Construct } from 'constructs';

export class GamesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = 'games.c.flat5.org';

    // Look up the shared c.flat5.org hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: 'c.flat5.org',
    });

    // ACM certificate (must be in us-east-1 for CloudFront)
    const certificate = new acm.DnsValidatedCertificate(this, 'Cert', {
      domainName,
      hostedZone,
      region: 'us-east-1',
    });

    // S3 bucket for static files
    const bucket = new s3.Bucket(this, 'Assets', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'CDN', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      domainNames: [domainName],
      certificate,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
    });

    // DNS A record
    new route53.ARecord(this, 'DNS', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
    });

    // Deploy static assets — everything except infra and dotfiles
    new s3deploy.BucketDeployment(this, 'Deploy', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../..'), {
        exclude: [
          'infra', 'infra/**',
          '.git', '.git/**', '.github', '.github/**',
          'node_modules', 'node_modules/**',
          'README.md', '.gitignore',
          'cdk.out', 'cdk.out/**',
        ],
      })],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // ─── Outputs ─────────────────────────────────────────────
    new cdk.CfnOutput(this, 'SiteUrl', { value: `https://${domainName}` });
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}
