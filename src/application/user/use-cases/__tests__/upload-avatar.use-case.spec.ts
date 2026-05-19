import { UploadAvatarUseCase } from '../../../user/use-cases/upload-avatar.use-case';

jest.mock('sharp', () => {
  return () => ({
    toFormat: () => ({
      toBuffer: () => Buffer.alloc(10),
    }),
  });
});

const mockS3Upload = jest
  .fn()
  .mockResolvedValue(
    'https://bucket.s3.us-east-1.amazonaws.com/avatars/user-1/abc.jpeg',
  );

const mockS3Service = { upload: mockS3Upload } as any;

describe('UploadAvatarUseCase', () => {
  let useCase: UploadAvatarUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UploadAvatarUseCase(mockS3Service);
  });

  it('returns url for valid JPEG within size limit', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      buffer: Buffer.alloc(100),
      mimetype: 'image/jpeg',
      size: 100,
    });

    expect(result.url).toBe(
      'https://bucket.s3.us-east-1.amazonaws.com/avatars/user-1/abc.jpeg',
    );
    expect(mockS3Upload).toHaveBeenCalledTimes(1);
  });

  it('throws UnsupportedMediaTypeException (415) for unsupported mime type', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        buffer: Buffer.alloc(100),
        mimetype: 'image/gif',
        size: 100,
      }),
    ).rejects.toMatchObject({ status: 415 });

    expect(mockS3Upload).not.toHaveBeenCalled();
  });

  it('throws PayloadTooLargeException (413) when file exceeds 5 MB', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        buffer: Buffer.alloc(100),
        mimetype: 'image/jpeg',
        size: 5 * 1024 * 1024 + 1,
      }),
    ).rejects.toMatchObject({ status: 413 });

    expect(mockS3Upload).not.toHaveBeenCalled();
  });

  it('generates key with correct format: avatars/{userId}/{uuid}.{ext}', async () => {
    await useCase.execute({
      userId: 'user-abc',
      buffer: Buffer.alloc(100),
      mimetype: 'image/png',
      size: 100,
    });

    const key = (mockS3Upload.mock.calls[0] as [{ key: string }])[0].key;
    expect(key).toMatch(/^avatars\/user-abc\/[0-9a-f-]+\.png$/);
  });

  it('accepts image/webp', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        buffer: Buffer.alloc(100),
        mimetype: 'image/webp',
        size: 100,
      }),
    ).resolves.toBeDefined();
  });
});
