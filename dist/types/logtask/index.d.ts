declare enum LogGroup {
    NO_GROUP = 0,
    START_GROUP = 1,
    END_GROUP = 2,
    IS_ERROR = 3,
    IS_FAILED = 4,
    IS_TITLE = 5
}
/**
 * Represents a logging task with various log step methods.
 */
export default class LogTask {
    /**
     * Map of ingroup settings per task name.
     */
    private static ingroupSettings;
    /**
     * The width of the indentation for log messages.
     */
    private static indentWidth;
    /**
     * Checks if debug mode is enabled.
     * @returns A boolean indicating if debug mode is enabled.
     */
    static isDebug(): boolean;
    /**
     * The name of the task.
     */
    private name;
    /**
     * Creates a new instance of the LogTask class.
     * @param name - The name of the task.
     */
    constructor(name: string);
    /**
     * Gets the ingroup setting for the task.
     */
    get ingroup(): boolean;
    /**
     * Sets the ingroup setting for this task.
     */
    set ingroup(value: boolean);
    getMessageString(step: string, desc: string, emojiStr: string): string;
    /**
     * Logs a step with the given emoji, type, message and group.
     * @param emojiStr - The emoji string to display.
     * @param step - The step type.
     * @param message - The message of the step.
     * @param startGroup - The start group type.
     */
    logStep(emojiStr: string, step: string, message: string, startGroup?: LogGroup): void;
    /**
     * Logs a debug message.
     * @param message - The message of the debug message.
     */
    debug(message?: string): void;
    /**
     * Logs a start message.
     * @param message - The message of the start message.
     */
    start(message?: string): void;
    /**
     * Logs an info message.
     * @param message - The message of the info message.
     */
    info(message?: string): void;
    /**
     * Logs a warning message.
     * @param message - The message of the warning message.
     */
    warn(message?: string): void;
    /**
     * Logs a success message.
     * @param message - The message of the success message.
     * @param ingroup - Indicates whether the success message is in a group.
     */
    success(message?: string, ingroup?: boolean): void;
    /**
     * Logs a failure message.
     * @param message - The message of the failure message.
     * @param ingroup - Indicates whether the failure message is in a group.
     */
    fail(message?: string, ingroup?: boolean): void;
    /**
     * Logs an error message.
     * @param message - The message of the error message.
     */
    error(message?: string): void;
    /**
     * Logs a title message.
     * @param message - The message of the title message.
     */
    title(message?: string): void;
}
export {};
