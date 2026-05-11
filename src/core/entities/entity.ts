import { UniqueEntityID } from './unique-entity-id';

export interface EntityMetadata {
  id: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class Entity<Props> {
  private readonly _id: UniqueEntityID;
  protected props: Props;

  private readonly _createdAt: Date;
  private _updatedAt: Date;

  protected constructor(props: Props & Partial<EntityMetadata>) {
    const { id, createdAt, updatedAt, ...rest } = props;

    this._id = id ?? new UniqueEntityID();
    this._createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();

    this.props = rest as Props;
  }

  get id() {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  equals(entity?: Entity<unknown>): boolean {
    if (
      entity === null ||
      entity === undefined ||
      !(entity instanceof Entity)
    ) {
      return false;
    }

    if (entity === this) {
      return true;
    }

    return this._id.equals(entity.id);
  }
}
