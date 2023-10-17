import * as core from '@actions/core';
import chalkPkg from 'chalk';
import * as emoji from 'node-emoji';
const { bgRedBright, cyan, green, greenBright, red, redBright, white, whiteBright, yellow, yellowBright, } = chalkPkg;
const NO_GROUP = 0;
const START_GROUP = 1;
const END_GROUP = 2;
const IS_ERROR = 3;
const IS_FAILED = 5;
const IS_TITLE = 6;
export default class LogTask {
    static ingroup_setting = {};
    static indentWidth = 5;
    static isDebug() {
        return core.isDebug() || !!process.env.DEBUG;
    }
    name;
    constructor(name) {
        this.name = name?.trim();
        this.ingroup = false;
    }
    get ingroup() {
        return LogTask.ingroup_setting[this.name] ?? false;
    }
    set ingroup(value) {
        LogTask.ingroup_setting[this.name] = value;
    }
    async logStep(emojiStr, step, description, startGroup = NO_GROUP) {
        if (step.length > LogTask.indentWidth) {
            LogTask.indentWidth = step.length;
        }
        let failed = false;
        let desc;
        switch (step) {
            case 'START': {
                desc = yellowBright(`${description}`);
                break;
            }
            case 'INFO': {
                desc = green(`${description}`);
                break;
            }
            case 'WARN': {
                desc = yellow(`${description}`);
                break;
            }
            case 'SUCCESS': {
                desc = greenBright(`${description}`);
                break;
            }
            case 'FAILURE': {
                desc = redBright(`${description}`);
                failed = true;
                break;
            }
            case 'ERROR': {
                desc = redBright(`${description}`);
                break;
            }
            case '#####': {
                desc = cyan(`${description}`);
                break;
            }
            default: {
                desc = white(`${description}`);
                break;
            }
        }
        let msg;
        if (this.ingroup && !process.env.GITHUB_ACTIONS) {
            const indentStr = [...Array.from({ length: LogTask.indentWidth }).fill(' ')].join('');
            msg = `${indentStr}   ${emojiStr}: ${this.name} > ${desc}`;
        }
        else {
            const stepStr = [
                step,
                ...Array.from({ length: LogTask.indentWidth - step.length }).fill(' '),
            ].join('');
            msg = `[${stepStr}] ${emojiStr}: ${desc}`;
        }
        switch (step) {
            case 'START': {
                msg = yellowBright(`${msg}`);
                break;
            }
            case 'SUCCESS': {
                msg = whiteBright(`${msg}`);
                break;
            }
            case 'FAILURE': {
                msg = red(`${msg}`);
                break;
            }
            case 'ERROR': {
                msg = red(`${msg}`);
                break;
            }
            default: {
                break;
            }
        }
        const isErroring = startGroup === IS_ERROR || startGroup === IS_FAILED;
        if (process.env.GITHUB_ACTIONS) {
            switch (startGroup) {
                case START_GROUP: {
                    core.startGroup(msg);
                    break;
                }
                case END_GROUP: {
                    core.endGroup();
                    break;
                }
                case IS_ERROR: {
                    core.error(bgRedBright(msg));
                    break;
                }
                case IS_FAILED: {
                    core.setFailed(bgRedBright(msg));
                    break;
                }
                default: {
                    core.info(msg);
                }
            }
        }
        else if (isErroring) {
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
    debug(description = '') {
        if (LogTask.isDebug() && description !== '') {
            this.logStep('👁️‍🗨️', 'DEBUG', description);
        }
    }
    start(description = '') {
        const desc = description === '' ? `Starting ${this.name}...` : description;
        this.logStep(emoji.get('rocket') ?? '', 'START', desc, START_GROUP);
    }
    info(description = '') {
        this.logStep(emoji.get('sparkles') ?? '', 'INFO', description);
    }
    warn(description = '') {
        this.logStep(emoji.get('anger') ?? '', 'WARN', description);
    }
    success(description = '', ingroup = true) {
        const desc = description === '' ? `Completed ${this.name}.` : description;
        if (ingroup) {
            this.ingroup = false;
            if (process.env.GITHUB_ACTIONS) {
                core.endGroup();
            }
        }
        this.logStep(emoji.get('white_check_mark') ?? '', 'SUCCESS', desc);
    }
    fail(description = '', ingroup = true) {
        const desc = description === '' ? `Failed ${this.name}.` : description;
        if (ingroup) {
            this.ingroup = false;
            if (process.env.GITHUB_ACTIONS) {
                core.endGroup();
            }
        }
        const msgtype = process.env.GITHUB_ACTIONS ? IS_FAILED : IS_ERROR;
        this.logStep(emoji.get('x') ?? '', 'FAILURE', desc, msgtype);
    }
    error(description = '') {
        this.logStep(emoji.get('x') ?? '', 'ERROR', description, IS_ERROR);
    }
    title(description = '') {
        this.logStep('📓', '#####', description, IS_TITLE);
    }
}
//# sourceMappingURL=index.js.map