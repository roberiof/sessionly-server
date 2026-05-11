import { Injectable } from '@nestjs/common';
import type {
  CreateRefreshTokenInput,
  RefreshTokenRepository,
} from 'src/domain/repositories/refresh-token.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateRefreshTokenInput): Promise<{ id: string }> {
    const created = await this.prisma.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });

    return { id: created.id };
  }

  async findByTokenHash(tokenHash: string) {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.userId,
      expiresAt: row.expiresAt,
    };
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { id },
    });
  }
}
