/**
 * Type guard to check if an `unknown` value is an `Error` object.
 *
 * @param value - The value to check.
 *
 * @returns `true` if the value is an `Error` object, otherwise `false`.
 */
export declare const isError: (value: unknown) => value is Error;
