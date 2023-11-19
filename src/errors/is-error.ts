/**
 * Type guard to check if an `unknown` value is an `Error` object.
 *
 * @param value - The value to check.
 *
 * @returns `true` if the value is an `Error` object, otherwise `false`.
 */
export const isError = (value: unknown): value is Error =>
  !!value &&
  typeof value === 'object' &&
  'message' in value &&
  typeof value.message === 'string' &&
  'stack' in value &&
  typeof value.stack === 'string';
