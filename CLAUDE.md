# Sessionly Server — CLAUDE.md

NestJS + Fastify backend for a mentorship marketplace. Clean Architecture + DDD. TypeScript, Prisma 7, PostgreSQL.

---

## Architecture

Four layers. Dependency rule: inner layers never import outer layers.

```
Core → Domain → Application → Infrastructure
```

| Layer | Location | Owns |
|---|---|---|
| Core | `src/core/` | Base entity, value objects, Mapper, AppError, filters, pagination |
| Domain | `src/domain/` | Entities, repository interfaces (ports), enums, injection tokens |
| Application | `src/application/<context>/` | Use cases, DTOs, controllers, presenters |
| Infrastructure | `src/infrastructure/` | PrismaService, concrete repos, mappers, modules |

**Do not** import Prisma types inside `src/domain/` or `src/core/`. Do not import NestJS decorators inside `src/domain/`.

---

## Adding a Bounded Context

Follow this sequence every time:

1. **Domain** — entity class extending `Entity<Props>`, repository interface, injection token in `src/domain/repositories/tokens.ts`
2. **Infrastructure** — Prisma mapper (`toDomain` / `toPersistence`), concrete repository extending `PrismaRepositoryBase`, register in `InfrastructureModule`
3. **Application** — use case class per operation, DTO with `class-validator`, controller, presenter (`toHTTP`)
4. Register the NestJS feature module in `AppModule`

---

## Code Patterns

### Entities

```ts
// domain/entities/session.entity.ts
export interface SessionProps {
  mentorId: UniqueEntityID;
  clientId: UniqueEntityID;
  status: SessionStatus;
  price: number;
  startTime: Date;
  endTime: Date;
  jitsiRoomId: string;
  createdAt?: Date;
}

export class Session extends Entity<SessionProps> {
  static create(props: SessionProps, id?: UniqueEntityID): Session {
    return new Session(props, id);
  }
}
```

### Repository interface (port)

```ts
// domain/repositories/session.repository.ts
export interface SessionRepository {
  findById(id: UniqueEntityID): Promise<Session | null>;
  findByMentor(mentorId: UniqueEntityID, params: PaginationParams): Promise<PaginatedResult<Session>>;
  save(session: Session): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
```

### Use case

```ts
// application/session/use-cases/create-session.use-case.ts
@Injectable()
export class CreateSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(USERS_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(input: CreateSessionDto): Promise<Session> {
    // validate business rules here, not in controller
    const session = Session.create({ ... });
    await this.sessions.save(session);
    return session;
  }
}
```

### Controller

```ts
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly createSession: CreateSessionUseCase) {}

  @Post()
  async create(@Body() dto: CreateSessionDto, @Request() req) {
    const session = await this.createSession.execute(dto);
    return SessionPresenter.toHTTP(session);
  }
}
```

Controllers: translate HTTP ↔ use case only. No business logic.

### Presenter

```ts
// Never expose passwordHash, tokenHash, or internal IDs unless required by the client.
export class SessionPresenter {
  static toHTTP(session: Session) {
    return {
      id: session.id.toString(),
      mentorId: session.props.mentorId.toString(),
      status: session.props.status,
      price: session.props.price,
      startTime: session.props.startTime,
      endTime: session.props.endTime,
    };
  }
}
```

### Mapper (infrastructure)

```ts
export class SessionMapper extends Mapper<Session, PrismaSession, Prisma.SessionCreateInput> {
  toDomain(raw: PrismaSession): Session {
    return Session.create({ ... }, new UniqueEntityID(raw.id));
  }

  toPersistence(entity: Session): Prisma.SessionUpdateInput {
    return { status: entity.props.status, ... };
  }

  toPrismaCreateInput(entity: Session): Prisma.SessionCreateInput {
    return { id: entity.id.toString(), ... };
  }
}
```

---

## DTOs & Validation

- Use `class-validator` decorators on all DTO fields.
- Use `class-transformer` (`@Type`, `@Transform`) for coercion.
- Never use `any`. Always type input.
- Strip unknown fields via `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` — already global.

---

## Error Handling

- Throw `AppError` subclasses from use cases: `ResourceNotFoundError`, `UnauthorizedError`, `ConflictError`.
- Do not throw raw HTTP exceptions from use cases or domain — that belongs to filters or controllers.
- `HttpExceptionFilter` at global scope converts `AppError` → structured HTTP response.
- Response envelope: `{ message: string, data: T }`. Use `src/core/response/response.messages.ts` for copy.

---

## Authentication

- JWT access token (short-lived) + refresh token (hashed in DB via `RefreshToken` table).
- Guards: `JwtAuthGuard` (most routes), `LocalAuthGuard` (login only).
- Never return `passwordHash` or `tokenHash` in any response.
- Refresh token rotation: invalidate old token on refresh.

---

## Prisma & Database

```bash
# local dev — after schema change
npx prisma migrate dev --name <migration_name>

# regenerate client without migration
npx prisma generate

# production / CI
npx prisma migrate deploy
```

- Generated client lives at `generated/prisma/` (not `node_modules`).
- Import from `generated/prisma` not `@prisma/client`.
- Soft-delete pattern: `deletedAt DateTime?` — filter `WHERE deletedAt IS NULL` in all queries.
- Never run raw SQL unless Prisma cannot express the query. Document why when you do.
- Add `@@index` for every FK and high-cardinality filter column.

---

## Modules

- **`PrismaModule`** — `@Global()`, exports `PrismaService` only. Do not add business logic here.
- **`InfrastructureModule`** — composition root for repos and mappers. Always export repo tokens, not classes.
- **Feature modules** (`UserModule`, `AuthModule`, etc.) — import `InfrastructureModule` for repo access.
- Do not import concrete repository classes outside `InfrastructureModule`.

---

## Security Rules

- Hash passwords with `bcryptjs` (rounds ≥ 12). Never store plaintext.
- Store refresh tokens as SHA-256 hash. Never store raw token.
- Validate all user input via DTOs. Never trust request body without `class-validator`.
- Guard every route. Default to authenticated; opt-out explicitly with `@Public()`.
- Scope access checks inside use cases, not controllers.

---

## Testing

```bash
npm test               # unit tests (jest)
npm run test:e2e       # end-to-end
npm run test:cov       # coverage report
```

- Unit test use cases in isolation. Mock repository via interface — never mock Prisma directly.
- E2E tests hit the real database. Seed and clean per test suite.
- Name test files `*.spec.ts` beside the source file.
- No snapshot tests for domain logic.

---

## Dev Workflow

```bash
npm run db:up          # start postgres (docker compose)
npm run start:dev      # watch mode
npm run lint           # eslint --fix
npm run format         # prettier --write
```

- Node 20+. npm (not pnpm — frontend repo uses pnpm, backend uses npm).
- `.env` is gitignored. Copy `.env.example` and fill values before running.
- `DATABASE_URL` required at startup. App crashes fast if missing.

---

## What Not To Do

- Do not put business rules in controllers or mappers.
- Do not expose internal entity IDs or hashed fields in HTTP responses.
- Do not import infrastructure types into domain or core.
- Do not use `@prisma/client` import path — use `generated/prisma`.
- Do not skip `ValidationPipe` or add `any` to bypass type safety.
- Do not add Prisma queries directly in controllers or use cases — always go through repository interface.
- Do not amend published commits. Create a new commit instead.
