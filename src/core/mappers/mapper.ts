export abstract class Mapper<DomainEntity, PrismaRow> {
  abstract toDomain(row: PrismaRow): DomainEntity;
}
