import { Entity, EntityMetadata } from 'src/core/entities/entity';

export interface ClientProfileProps {
  interests: string[];
}

export class ClientProfile extends Entity<ClientProfileProps> {
  get interests(): string[] {
    return this.props.interests;
  }

  static create(
    props: ClientProfileProps & Partial<EntityMetadata>,
  ): ClientProfile {
    return new ClientProfile(props);
  }
}
