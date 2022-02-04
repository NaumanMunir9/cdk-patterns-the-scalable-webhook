import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB({ apiVersion: "2012-08-10" });

export async function handler(event: any) {
  console.log(`Request: ${JSON.stringify(event, undefined, 2)}`);

  let records: any[] = event.Records;

  for (let record in records) {
    let payload = records[record].body;
    let path =
      records[record].messageAttributes.MessageDeduplicationId.stringValue;

    console.log(`Message: ${JSON.stringify(payload, undefined, 2)}`);

    const params = {
      TableName: process.env.TABLE_NAME || "",
      Item: {
        id: { S: path },
        message: { S: payload },
      },
    };

    await dynamoDb
      .putItem(params, (err: any, data: any) => {
        if (err) {
          console.log(`Error: ${JSON.stringify(err, undefined, 2)}`);
        } else {
          console.log(`Data: ${JSON.stringify(data, undefined, 2)}`);
        }
      })
      .promise();
  }
}
