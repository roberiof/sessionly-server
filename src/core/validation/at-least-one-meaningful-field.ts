/**
 * Default rule for "partial update" payloads: a value counts as meaningful if it is
 * a non-empty string (after trim), a non-empty array, or any other non-nullish value.
 */
export function isMeaningfulPatchValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return true;
}

/**
 * Returns true if at least one of `keys` on `patch` passes `isMeaningful`.
 * Use for PATCH-style DTOs where the client must send at least one updatable field.
 */
export function hasAtLeastOneMeaningfulField(
  patch: object,
  keys: ReadonlyArray<PropertyKey>,
  isMeaningful: (value: unknown) => boolean = isMeaningfulPatchValue,
): boolean {
  const record = patch as Record<PropertyKey, unknown>;
  return keys.some((key) => isMeaningful(record[key]));
}
