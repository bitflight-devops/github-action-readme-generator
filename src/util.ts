export type Nullable<T> = T | null | undefined;
export function notEmpty(str: Nullable<string>): str is string {
  return typeof str === 'string' ? str.trim().length > 0 : false;
}
