export declare class LogTask {
    readonly name: string;
    constructor(name: string);
    logStep(emojiStr: string, step: string, description: string): void;
    start(description?: string): void;
    info(description?: string): void;
    success(description?: string): void;
    fail(description?: string): void;
    error(description?: string): void;
    title(description?: string): void;
}
