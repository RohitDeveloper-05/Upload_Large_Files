import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lambdaHandler } from '../../upload-large-files-rohit/upload-large-file-rohit/app';

jest.mock('@aws-sdk/client-s3', () => {
  class FakeS3Client {}
  class FakePutObjectCommand {
    constructor(public readonly input: any) {}
  }
  return {
    S3Client: FakeS3Client,
    PutObjectCommand: FakePutObjectCommand,
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('lambdaHandler', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, BUCKET_NAME: 'test-bucket' };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  it('should return signed URL and fileKey on success', async () => {
    (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url');
    const event = {
      body: JSON.stringify({ filename: 'test.txt' }),
    } as unknown as APIGatewayProxyEvent;

    const result: APIGatewayProxyResult = await lambdaHandler(event);

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.any(PutObjectCommand),
      { expiresIn: 300 }
    );
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      uploadUrl: 'https://signed-url',
      fileKey: 'test.txt',
    });
  });

  it('throws if BUCKET_NAME is missing', async () => {
    delete process.env.BUCKET_NAME;
    const event = {
        body: JSON.stringify({ filename: 'test.txt' }),
    } as unknown as APIGatewayProxyEvent;

    await expect(lambdaHandler(event))
      .rejects
      .toThrow('Environment variable BUCKET_NAME is required');
  });

  it('throws if body is missing', async () => {
    const event = {} as APIGatewayProxyEvent;
    await expect(lambdaHandler(event))
      .rejects
      .toThrow('Request body is required');
  });

  it('throws if body is invalid JSON', async () => {
    const event = { body: '{ not: "json" }' } as APIGatewayProxyEvent;
    await expect(lambdaHandler(event))
      .rejects
      .toThrow('Request body contains invalid JSON');
  });

  it('throws if filename is missing', async () => {
    const event = { body: JSON.stringify({}) 
    }  as unknown as APIGatewayProxyEvent;
    await expect(lambdaHandler(event))
      .rejects
      .toThrow('`filename` must be a non-empty string');
  });

  it('throws if filename is not a string', async () => {
    const event = { body: JSON.stringify({ filename: 123 }) 
    }  as unknown as APIGatewayProxyEvent;
    await expect(lambdaHandler(event))
      .rejects
      .toThrow('`filename` must be a non-empty string');
  });
});
