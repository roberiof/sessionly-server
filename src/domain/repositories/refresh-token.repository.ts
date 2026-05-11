export type RefreshTokenRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
};

export type CreateRefreshTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<{ id: string }>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  deleteById(id: string): Promise<void>;
}
