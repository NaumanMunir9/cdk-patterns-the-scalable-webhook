import { Stack, StackProps } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";

export class TheScalableWebhookStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // =============================================================================
    /**
     * Create a DynamoDB table
     * this is standing in for what RDS on the diagram due to simple/cheaper setup
     */
    const table = new dynamodb.Table(this, "Table", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: "the-scalable-webhook-table",
      writeCapacity: 1,
      readCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // =============================================================================
    /**
     * Create a SQS queue
     */
    const queue = new sqs.Queue(this, "Queue", {
      queueName: "the-scalable-webhook-queue",
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // =============================================================================
    /**
     * publish Lambda
     * Deploys a file from inside the construct library as a function.
     */
    const publishLambda = new lambda.Function(this, "PublishLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "publish.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
    });
  }
}
