import { Inject, Injectable } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { USERS_REPOSITORY } from 'src/domain/repositories/tokens';
import type { UserRepository } from 'src/domain/repositories/user.repository';

type ValidateUserCredentialsInput = {
  email: string;
  password: string;
};

@Injectable()
export class ValidateUserCredentialsUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UserRepository,
  ) {}

  async execute(
    input: ValidateUserCredentialsInput,
  ): Promise<{ userId: string } | null> {
    const record = await this.usersRepository.findCredentialsByEmail(
      input.email,
    );

    if (!record) {
      return null;
    }

    const passwordMatches = await compare(input.password, record.passwordHash);

    if (!passwordMatches) {
      return null;
    }

    return { userId: record.id };
  }
}
