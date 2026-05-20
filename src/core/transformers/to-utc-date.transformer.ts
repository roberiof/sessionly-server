import { Transform } from 'class-transformer';

const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Parses incoming datetime strings as UTC.
 * - Strings without an explicit offset get `Z` appended before parsing.
 * - Strings with `Z` or `±HH:mm` are honored as-is.
 *
 * Apply on DTO fields instead of `@Type(() => Date)` for any datetime that
 * must be treated as UTC regardless of what the client sends.
 */
export function ToUtcDate() {
  return Transform(({ value }) => {
    if (value instanceof Date) return value;
    if (typeof value !== 'string') return value;

    const normalized = HAS_OFFSET.test(value) ? value : `${value}Z`;
    return new Date(normalized);
  });
}
