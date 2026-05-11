/**
 * Maps between domain entities and persistence shapes.
 * @template PersistenceWrite — when the write payload differs from the stored row (e.g. updates omit secrets), override the default third type.
 */
export abstract class Mapper<
  DomainEntity,
  PersistenceEntity,
  PersistenceWrite = PersistenceEntity,
> {
  abstract toDomain(persistenceEntity: PersistenceEntity): DomainEntity;
  abstract toPersistence(domainEntity: DomainEntity): PersistenceWrite;
}
