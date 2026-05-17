import { Injectable } from '@nestjs/common';
import type {
  CreatePasswordResetTokenInput,
  PasswordResetTokenRepository,
} from 'src/domain/repositories/password-reset-token.repository';
import { PrismaService } from '../prisma/prisma.service';
import { UniqueEntityID } from 'src/core/entities/unique-entity-id';

@Injectable()
export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePasswordResetTokenInput): Promise<{ id: string }> {
    const created = await this.prisma.passwordResetToken.create({
      data: {
        userId: input.userId.toString(),
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });

    return { id: created.id };
  }

  async findByTokenHash(tokenHash: string) {
    const row = await this.prisma.passwordResetToken.findUnique({
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
    await this.prisma.passwordResetToken.delete({
      where: { id },
    });
  }

  async deleteAllByUserId(userId: UniqueEntityID): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: userId.toString() },
    });
  }
}
