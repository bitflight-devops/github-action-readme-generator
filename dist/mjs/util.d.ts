export type Nullable<T> = T | null | undefined;
export declare function notEmpty(str: Nullable<string>): str is string;
