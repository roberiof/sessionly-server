import { Entity, EntityMetadata } from 'src/core/entities/entity';

export enum ActivityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  NOT_DISTURB = 'NOT_DISTURB',
}

export enum UserRole {
  MENTOR = 'MENTOR',
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
}

export interface UserProps {
  name: string;
  bio?: string | null;
  email: string;
  avatarUrl?: string | null;
  role: UserRole;
  activityStatus: ActivityStatus;
  links: string[];
  deletedAt: Date | null;
}

export class User extends Entity<UserProps> {
  get name(): string {
    return this.props.name;
  }

  get bio(): string | undefined {
    return this.props.bio ?? undefined;
  }

  get email(): string {
    return this.props.email;
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl ?? undefined;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get activityStatus(): ActivityStatus {
    return this.props.activityStatus;
  }

  get links(): string[] {
    return this.props.links;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  static create(props: UserProps & Partial<EntityMetadata>): User {
    return new User(props);
  }
}
