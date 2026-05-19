import {
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { S3Service } from 'src/infrastructure/storage/s3.service';

type UploadAvatarInput = {
  userId: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
};

type ImageFormat = 'jpeg' | 'png' | 'webp';

const MIME_TO_FORMAT: Record<string, ImageFormat> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class UploadAvatarUseCase {
  constructor(private readonly s3: S3Service) {}

  async execute(input: UploadAvatarInput): Promise<{ url: string }> {
    const ext = MIME_TO_FORMAT[input.mimetype];

    if (!ext) {
      throw new UnsupportedMediaTypeException(
        'Unsupported file type. Use JPEG, PNG, or WebP.',
      );
    }

    if (input.size > MAX_SIZE_BYTES) {
      throw new PayloadTooLargeException('File exceeds 5 MB limit.');
    }

    const processed = await sharp(input.buffer).toFormat(ext).toBuffer();

    const key = `avatars/${input.userId}/${randomUUID()}.${ext}`;
    const url = await this.s3.upload({
      key,
      body: processed,
      contentType: input.mimetype,
    });

    return { url };
  }
}
