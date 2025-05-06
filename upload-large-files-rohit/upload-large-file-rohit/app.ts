import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  
  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    throw new Error('Environment variable BUCKET_NAME is required');
  }

  
  if (!event.body) {
    throw new Error('Request body is required');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(event.body);
  } catch {
    throw new Error('Request body contains invalid JSON');
  }

  
  const { filename } = parsed;
  if (!filename || typeof filename !== 'string') {
    throw new Error('`filename` must be a non-empty string');
  }

  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return {
    statusCode: 200,
    body: JSON.stringify({ uploadUrl, fileKey: filename }),
  };
};
