import * as AWS from "aws-sdk";

const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

export async function handler(event: any) {
  console.log(`Request: ${JSON.stringify(event, undefined, 2)}`);

  // params
  const params = {
    QueueUrl: process.env.QUEUE_URL || "",
    MessageBody: `Hey There ${event.path}`,
    DelaySeconds: 10,
    MessageAttributes: {
      MessageDeduplicationId: {
        DataType: "String",
        StringValue: `${event.path} ${new Date().getTime()}`,
      },
    },
  };

  let response;

  await sqs
    .sendMessage(params, (err: any, data: any) => {
      if (err) {
        console.log(`Error: ${JSON.stringify(err, undefined, 2)}`);
        response = sendRes(500, err);
      } else {
        console.log(`Data: ${JSON.stringify(data, undefined, 2)}`);
        response = sendRes(200, data.MessageId);
      }
    })
    .promise();
}

const sendRes = (statusCode: number, body: string) => {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff", // XSS protection
    },
  };
};
