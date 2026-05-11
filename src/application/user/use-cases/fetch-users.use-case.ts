import { Inject, Injectable } from '@nestjs/common';
import type { PaginationParams } from 'src/core/types/pagination';
import { USERS_REPOSITORY } from 'src/domain/repositories/tokens';
import type { UserRepository } from 'src/domain/repositories/user.repository';

@Injectable()
export class FetchUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UserRepository,
  ) {}

  async execute(params: PaginationParams) {
    const take = params.take ?? 10;
    const skip = params.skip ?? 0;

    return this.usersRepository.findManyWithProfile({ take, skip, ...params });
  }
}
