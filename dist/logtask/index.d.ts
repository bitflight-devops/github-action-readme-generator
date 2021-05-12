export default class LogTask {
    readonly name: string;
    constructor(name: string);
    logStep(emojiStr: string, step: string, description: string): string;
    debug(description?: string): void;
    start(description?: string): void;
    info(description?: string): void;
    success(description?: string, ingroup?: boolean): void;
    fail(description?: string, ingroup?: boolean): void;
    error(description?: string): void;
    title(description?: string): void;
}
