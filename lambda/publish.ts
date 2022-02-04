import * as AWS from "aws-sdk";

const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

export async function handler(event: any) {
  console.log(`Request: ${JSON.stringify(event, undefined, 2)}`);

  // params
  const params = {
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: `Hey There ${event.path}`,
    DelaySeconds: 10,
    MessageAttributes: {
      MessageDeduplicationId: {
        DataType: "String",
        StringValue: `${event.path} ${new Date().getTime()}`,
      },
    },
  };
}
