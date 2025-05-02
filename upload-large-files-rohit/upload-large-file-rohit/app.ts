import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({}); // uses Lambda’s IAM role & region by default

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const bucketName = process.env.BUCKET_NAME!;
    const { filename } = JSON.parse(event.body!);

    // build the PutObject command
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        // You can also set ContentType, ACL, etc. here
    });

    // generate a pre-signed URL (expires in 5 minutes)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return {
        statusCode: 200,
        body: JSON.stringify({
            uploadUrl,
            fileKey: filename,
        }),
    };
};
