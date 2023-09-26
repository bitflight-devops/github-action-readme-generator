import * as core from '@actions/core';
import * as chalkClass from 'chalk';
import * as emoji from 'node-emoji';

const NO_GROUP = 0;
const START_GROUP = 1;
const END_GROUP = 2;
const IS_ERROR = 3;
const IS_FAILED = 5;
const IS_TITLE = 6;
const chalk = chalkClass.default;
class LogTask {
  name: string;

  static ingroup_setting: { [key: string]: boolean } = {};

  static indentWidth = 5;

  constructor(name: string) {
    this.name = name.trim();
    if (LogTask.ingroup_setting[this.name] === undefined) {
      LogTask.ingroup_setting[this.name] = false;
    }
  }

  get ingroup(): boolean {
    return LogTask.ingroup_setting[this.name] ?? false;
  }

  set ingroup(value: boolean) {
    LogTask.ingroup_setting[this.name] = value;
  }

  async logStep(
    emojiStr: string,
    step: string,
    description: string,
    startGroup = NO_GROUP,
  ): Promise<void> {
    if (step.length > LogTask.indentWidth) {
      LogTask.indentWidth = step.length;
    }
    let desc: string;
    switch (step) {
      case 'START': {
        desc = chalk.yellowBright(`${description}`);
        break;
      }
      case 'INFO': {
        desc = chalk.green(`${description}`);
        break;
      }
      case 'WARN': {
        desc = chalk.yellow(`${description}`);
        break;
      }
      case 'SUCCESS': {
        desc = chalk.greenBright(`${description}`);
        break;
      }
      case 'FAILURE': {
        desc = chalk.redBright(`${description}`);
        break;
      }
      case 'ERROR': {
        desc = chalk.redBright(`${description}`);
        break;
      }
      case '#####': {
        desc = chalk.cyan(`${description}`);
        break;
      }
      default: {
        desc = chalk.white(`${description}`);
        break;
      }
    }

    let msg: string;
    if (this.ingroup && !process.env['GITHUB_ACTIONS']) {
      const indentStr = [...Array.from({ length: LogTask.indentWidth }).fill(' ')].join('');
      msg = `${indentStr}   ${emojiStr}: ${this.name} > ${desc}`;
    } else {
      const stepStr = [
        ...step,
        ...Array.from({ length: LogTask.indentWidth - step.length }).fill(' '),
      ].join('');

      msg = `[${stepStr}] ${emojiStr}: ${desc}`;
    }
    switch (step) {
      case 'START': {
        msg = chalk.yellowBright(`${msg}`);
        break;
      }
      case 'SUCCESS': {
        msg = chalk.whiteBright(`${msg}`);
        break;
      }
      case 'FAILURE': {
        msg = chalk.red(`${msg}`);
        break;
      }
      case 'ERROR': {
        msg = chalk.red(`${msg}`);
        break;
      }
      default: {
        break;
      }
    }
    const isErroring = startGroup === IS_ERROR || startGroup === IS_FAILED;

    if (!process.env['GITHUB_ACTIONS']) {
      if (isErroring) {
        core.error(msg);
      } else {
        core.info(msg);
      }
    } else
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
          core.error(chalk.bgRedBright(msg));

          break;
        }
        case IS_FAILED: {
          core.setFailed(chalk.bgRedBright(msg));

          break;
        }
        default: {
          core.info(msg);
        }
      }
  }

  debug(description = ''): void {
    if (process.env['DEBUG'] === 'true') {
      this.logStep('👁️‍🗨️', 'DEBUG', description);
    }
  }

  start(description = ''): void {
    const desc = description === '' ? `Starting ${this.name}...` : description;

    this.logStep(emoji.get('rocket') ?? '', 'START', desc, START_GROUP);
  }

  info(description = ''): void {
    this.logStep(emoji.get('sparkles') ?? '', 'INFO', description);
  }

  warn(description = ''): void {
    this.logStep(emoji.get('anger') ?? '', 'WARN', description);
  }

  success(description = '', ingroup = true): void {
    const desc = description === '' ? `Completed ${this.name}.` : description;
    if (ingroup) {
      this.ingroup = false;
      if (process.env['GITHUB_ACTIONS']) {
        core.endGroup();
      }
    }
    this.logStep(emoji.get('white_check_mark') ?? '', 'SUCCESS', desc);
  }

  fail(description = '', ingroup = true): void {
    const desc = description === '' ? `Failed ${this.name}.` : description;
    if (ingroup) {
      this.ingroup = false;
      if (process.env['GITHUB_ACTIONS']) {
        core.endGroup();
      }
    }
    const msgtype = !process.env['GITHUB_ACTIONS'] ? IS_ERROR : IS_FAILED;
    this.logStep(emoji.get('x') ?? '', 'FAILURE', desc, msgtype);
  }

  error(description = ''): void {
    this.logStep(emoji.get('x') ?? '', 'ERROR', description, IS_ERROR);
  }

  title(description = ''): void {
    this.logStep('📓', '#####', description, IS_TITLE);
  }
}

export default LogTask;
