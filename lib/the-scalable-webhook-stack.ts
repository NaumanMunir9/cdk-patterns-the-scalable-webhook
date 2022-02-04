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

    // =============================================================================
    /**
     * Grant access to send messages to a queue to the given identity
     */
    queue.grantSendMessages(publishLambda);

    // =============================================================================
    /**
     * subscribe Lambda
     * Deploys a file from inside the construct library as a function
     */
    const subscribeLambda = new lambda.Function(this, "SubscribeLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "subscribe.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        TABLE_NAME: table.tableName,
        QUEUE_URL: queue.queueUrl,
      },
    });

    // =============================================================================
    /**
     * grant access to receive messages from a queue to the given identity
     */
    queue.grantSendMessages(subscribeLambda);

    // =============================================================================
    /**
     * Adds an event source to this function
     * Use an Amazon SQS queue as an event source for AWS Lambda
     */
    subscribeLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(queue)
    );

    // =============================================================================
    /**
     * Permits an IAM principal to all data read/write operations to this table.
     * BatchGetItem, GetRecords, GetShardIterator, Query, GetItem, Scan, BatchWriteItem, PutItem, UpdateItem, DeleteItem
     */
    table.grantReadWriteData(subscribeLambda);

    // =============================================================================
    /**
     * Defines an API Gateway REST API with AWS Lambda proxy integration
     */
    const api = new apigateway.LambdaRestApi(this, "Api", {
      handler: publishLambda,
    });
  }
}
