export default class LogTask {
    static ingroup_setting: {
        [key: string]: boolean;
    };
    static indentWidth: number;
    static isDebug(): boolean;
    name: string;
    constructor(name: string);
    get ingroup(): boolean;
    set ingroup(value: boolean);
    logStep(emojiStr: string, step: string, description: string, startGroup?: number): Promise<void>;
    debug(description?: string): void;
    start(description?: string): void;
    info(description?: string): void;
    warn(description?: string): void;
    success(description?: string, ingroup?: boolean): void;
    fail(description?: string, ingroup?: boolean): void;
    error(description?: string): void;
    title(description?: string): void;
}
