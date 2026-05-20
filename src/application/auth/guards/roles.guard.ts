import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/domain/entities/user.entity';
import { USERS_REPOSITORY } from 'src/domain/repositories/tokens';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { ROLES_KEY } from '../decorators/roles.decorator';

type AuthenticatedRequest = {
  user?: { userId: string; role?: UserRole };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(USERS_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.users.findById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role.');
    }

    request.user = { userId, role: user.role };
    return true;
  }
}
