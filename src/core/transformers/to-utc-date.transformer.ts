import { Transform } from 'class-transformer';

const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Parses incoming datetime strings as UTC.
 * - Strings without an explicit offset get `Z` appended before parsing.
 * - Strings with `Z` or `±HH:mm` are honored as-is.
 * - Invalid strings pass through unchanged so `@IsDate` rejects them
 *   instead of forwarding an Invalid Date to the use case.
 *
 * Apply on DTO fields instead of `@Type(() => Date)` for any datetime
 * that must be treated as UTC regardless of what the client sends.
 */
export function ToUtcDate() {
  return Transform(
    ({ value }: { value: unknown }): unknown => {
      if (value instanceof Date) return value;
      if (typeof value !== 'string' || value.length === 0) return value;

      const normalized = HAS_OFFSET.test(value) ? value : `${value}Z`;
      const date = new Date(normalized);

      if (Number.isNaN(date.getTime())) return value;

      return date;
    },
    { toClassOnly: true },
  );
}
