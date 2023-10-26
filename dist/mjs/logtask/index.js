import * as core from '@actions/core';
import chalkPkg from 'chalk';
import * as emoji from 'node-emoji';
// Chalk color styles
const { bgRedBright, cyan, green, greenBright, red, redBright, white, whiteBright, yellow, yellowBright, } = chalkPkg;
// Constants for different log step types
var LogGroup;
(function (LogGroup) {
    LogGroup[LogGroup["NO_GROUP"] = 0] = "NO_GROUP";
    LogGroup[LogGroup["START_GROUP"] = 1] = "START_GROUP";
    LogGroup[LogGroup["END_GROUP"] = 2] = "END_GROUP";
    LogGroup[LogGroup["IS_ERROR"] = 3] = "IS_ERROR";
    LogGroup[LogGroup["IS_FAILED"] = 4] = "IS_FAILED";
    LogGroup[LogGroup["IS_TITLE"] = 5] = "IS_TITLE";
})(LogGroup || (LogGroup = {}));
function highlightMessage(step, message) {
    let failed = false;
    let desc;
    switch (step) {
        case 'START': {
            desc = yellowBright(`${message}`);
            break;
        }
        case 'INFO': {
            desc = green(`${message}`);
            break;
        }
        case 'WARN': {
            desc = yellow(`${message}`);
            break;
        }
        case 'SUCCESS': {
            desc = greenBright(`${message}`);
            break;
        }
        case 'FAILURE': {
            desc = redBright(`${message}`);
            failed = true;
            break;
        }
        case 'ERROR': {
            desc = redBright(`${message}`);
            break;
        }
        case '#####': {
            desc = cyan(`${message}`);
            break;
        }
        default: {
            desc = white(`${message}`);
            break;
        }
    }
    return { desc, failed };
}
function highlightStep(step, message) {
    let msg;
    // Logic to handle different log outputs based on the environment (GitHub Actions or local)
    switch (step) {
        case 'START': {
            msg = yellowBright(message);
            break;
        }
        case 'SUCCESS': {
            msg = whiteBright(message);
            break;
        }
        case 'FAILURE':
        case 'ERROR': {
            msg = red(message);
            break;
        }
        default: {
            msg = message;
            break;
        }
    }
    return msg;
}
function handleOutput(startGroup, isErroring, failed, msg) {
    // Logic to handle different log outputs based on the environment (GitHub Actions or local)
    if (process.env.GITHUB_ACTIONS) {
        switch (startGroup) {
            case LogGroup.START_GROUP: {
                core.startGroup(msg);
                break;
            }
            case LogGroup.END_GROUP: {
                core.endGroup();
                break;
            }
            // Logic to handle erroring or failed steps
            case LogGroup.IS_ERROR: {
                core.error(bgRedBright(msg));
                break;
            }
            case LogGroup.IS_FAILED: {
                core.setFailed(bgRedBright(msg));
                break;
            }
            default: {
                core.info(msg);
            }
        }
    }
    else if (isErroring) {
        // Logic to display the log message using the appropriate method of the 'core' package
        if (failed) {
            core.setFailed(msg);
        }
        else {
            core.error(msg);
        }
    }
    else {
        core.info(msg);
    }
}
/**
 * Represents a logging task with various log step methods.
 */
export default class LogTask {
    /**
     * Map of ingroup settings per task name.
     */
    static ingroupSettings = new Map();
    /**
     * The width of the indentation for log messages.
     */
    static indentWidth = 5;
    /**
     * Checks if debug mode is enabled.
     * @returns A boolean indicating if debug mode is enabled.
     */
    static isDebug() {
        return core.isDebug() || !!process.env.DEBUG;
    }
    /**
     * The name of the task.
     */
    name;
    /**
     * Creates a new instance of the LogTask class.
     * @param name - The name of the task.
     */
    constructor(name) {
        this.name = name?.trim();
    }
    /**
     * Gets the ingroup setting for the task.
     */
    get ingroup() {
        return LogTask.ingroupSettings.get(this.name) ?? false;
    }
    /**
     * Sets the ingroup setting for this task.
     */
    set ingroup(value) {
        LogTask.ingroupSettings.set(this.name, value);
    }
    getMessageString(step, desc, emojiStr) {
        let msg;
        if (this.ingroup && !process.env.GITHUB_ACTIONS) {
            const indentStr = ' '.repeat(LogTask.indentWidth);
            msg = `${indentStr}   ${emojiStr}: ${this.name} > ${desc}`;
        }
        else {
            const stepStr = step.padEnd(LogTask.indentWidth, ' ');
            msg = `[${stepStr}][${this.name}] ${emojiStr}: ${desc}`;
        }
        return highlightStep(step, msg);
    }
    /**
     * Logs a step with the given emoji, type, message and group.
     * @param emojiStr - The emoji string to display.
     * @param step - The step type.
     * @param message - The message of the step.
     * @param startGroup - The start group type.
     */
    logStep(emojiStr, step, message, startGroup = LogGroup.NO_GROUP) {
        // Logic to determine the log message color and format based on the step type
        if (step.length > LogTask.indentWidth) {
            LogTask.indentWidth = step.length;
        }
        const { desc, failed } = highlightMessage(step, message);
        const msg = this.getMessageString(step, desc, emojiStr);
        const isErroring = startGroup === LogGroup.IS_ERROR || startGroup === LogGroup.IS_FAILED;
        handleOutput(startGroup, isErroring, failed, msg);
    }
    /**
     * Logs a debug message.
     * @param message - The message of the debug message.
     */
    debug(message = '') {
        // Logic to log a debug message
        if (LogTask.isDebug() && message !== '') {
            this.logStep('👁️‍🗨️', 'DEBUG', message);
        }
    }
    /**
     * Logs a start message.
     * @param message - The message of the start message.
     */
    start(message = '') {
        // Logic to log a start message
        const desc = message === '' ? `Starting ${this.name}...` : message;
        this.logStep(emoji.get('rocket') ?? '', 'START', desc, LogGroup.START_GROUP);
    }
    /**
     * Logs an info message.
     * @param message - The message of the info message.
     */
    info(message = '') {
        // Logic to log an info message
        this.logStep(emoji.get('sparkles') ?? '', 'INFO', message);
    }
    /**
     * Logs a warning message.
     * @param message - The message of the warning message.
     */
    warn(message = '') {
        // Logic to log a warning message
        this.logStep(emoji.get('anger') ?? '', 'WARN', message);
    }
    /**
     * Logs a success message.
     * @param message - The message of the success message.
     * @param ingroup - Indicates whether the success message is in a group.
     */
    success(message = '', ingroup = true) {
        // Logic to log a success message
        const desc = message === '' ? `Completed ${this.name}.` : message;
        if (ingroup) {
            this.ingroup = false;
            if (process.env.GITHUB_ACTIONS) {
                core.endGroup();
            }
        }
        this.logStep(emoji.get('white_check_mark') ?? '', 'SUCCESS', desc);
    }
    /**
     * Logs a failure message.
     * @param message - The message of the failure message.
     * @param ingroup - Indicates whether the failure message is in a group.
     */
    fail(message = '', ingroup = true) {
        // Logic to log a failure message
        const desc = message === '' ? `Failed ${this.name}.` : message;
        if (ingroup) {
            this.ingroup = false;
            if (process.env.GITHUB_ACTIONS) {
                core.endGroup();
            }
        }
        const msgtype = process.env.GITHUB_ACTIONS ? LogGroup.IS_FAILED : LogGroup.IS_ERROR;
        this.logStep(emoji.get('x') ?? '', 'FAILURE', desc, msgtype);
    }
    /**
     * Logs an error message.
     * @param message - The message of the error message.
     */
    error(message = '') {
        // Logic to log an error message
        this.logStep(emoji.get('x') ?? '', 'ERROR', message, LogGroup.IS_ERROR);
    }
    /**
     * Logs a title message.
     * @param message - The message of the title message.
     */
    title(message = '') {
        // Logic to log a title message
        this.logStep('📓', '#####', message, LogGroup.IS_TITLE);
    }
}
//# sourceMappingURL=index.js.map