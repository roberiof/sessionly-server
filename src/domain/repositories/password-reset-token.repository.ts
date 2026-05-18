import { UniqueEntityID } from 'src/core/entities/unique-entity-id';

export type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
};

export type CreatePasswordResetTokenInput = {
  userId: UniqueEntityID;
  tokenHash: string;
  expiresAt: Date;
};

export interface PasswordResetTokenRepository {
  create(input: CreatePasswordResetTokenInput): Promise<{ id: string }>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetTokenRecord | null>;
  deleteById(id: string): Promise<void>;
  deleteAllByUserId(userId: UniqueEntityID): Promise<void>;
}
