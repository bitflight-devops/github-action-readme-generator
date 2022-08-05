import * as core from '@actions/core';
import chalk from 'chalk';
import * as emoji from 'node-emoji';

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
    return LogTask.ingroup_setting[this.name] || false;
  }

  set ingroup(value: boolean) {
    LogTask.ingroup_setting[this.name] = value;
  }

  logStep(emojiStr: string, step: string, description: string): string {
    if (step.length > LogTask.indentWidth) {
      LogTask.indentWidth = step.length;
    }
    let desc;
    switch (step) {
      case 'START':
        desc = chalk.yellowBright(`${description}`);
        break;
      case 'INFO':
        desc = chalk.green(`${description}`);
        break;
      case 'WARN':
        desc = chalk.yellow(`${description}`);
        break;
      case 'SUCCESS':
        desc = chalk.greenBright(`${description}`);
        break;
      case 'FAILURE':
        desc = chalk.redBright(`${description}`);
        break;
      case 'ERROR':
        desc = chalk.redBright(`${description}`);
        break;
      case '#####':
        desc = chalk.cyan(`${description}`);
        break;
      default:
        desc = chalk.white(`${description}`);
        break;
    }

    if (this.ingroup && !process.env['GITHUB_ACTIONS']) {
      const indentStr = [...Array.from({ length: LogTask.indentWidth }).fill(' ')].join('');
      return chalk.gray(`${indentStr}   ${emojiStr}: ${this.name} > ${desc}`);
    }
    const stepStr = [
      ...step,
      ...Array.from({ length: LogTask.indentWidth - step.length }).fill(' '),
    ].join('');
    return `[${stepStr}] ${emojiStr}: ${desc}`;
  }

  debug(description = ''): void {
    if (process.env['DEBUG'] === 'true') {
      const msg = this.logStep('👁️‍🗨️', 'DEBUG', description);
      if (!process.env['GITHUB_ACTIONS']) {
        console.debug(msg);
      } else {
        core.debug(msg);
      }
    }
  }

  start(description = ''): void {
    const desc = description === '' ? `Starting ${this.name}...` : description;
    const msg = this.logStep(emoji.get('rocket'), 'START', desc);
    this.ingroup = true;
    if (!process.env['GITHUB_ACTIONS']) {
      console.info(msg);
    } else {
      core.startGroup(msg);
    }
  }

  info(description = ''): void {
    const msg = this.logStep(emoji.get('sparkles'), 'INFO', description);
    if (!process.env['GITHUB_ACTIONS']) {
      console.info(msg);
    } else {
      core.info(msg);
    }
  }

  warn(description = ''): void {
    const msg = this.logStep(emoji.get('anger'), 'WARN', description);
    if (!process.env['GITHUB_ACTIONS']) {
      console.info(msg);
    } else {
      core.info(msg);
    }
  }

  success(description = '', ingroup = true): void {
    const desc = description === '' ? `Completed ${this.name}.` : description;
    if (ingroup) {
      this.ingroup = false;
      if (process.env['GITHUB_ACTIONS']) {
        core.endGroup();
      }
    }
    const msg = this.logStep(emoji.get('white_check_mark'), 'SUCCESS', chalk.green(desc));
    if (!process.env['GITHUB_ACTIONS']) {
      console.info(msg);
    } else {
      core.info(msg);
    }
  }

  fail(description = '', ingroup = true): void {
    const desc = description === '' ? `Failed ${this.name}.` : description;
    if (ingroup) {
      this.ingroup = false;
      if (process.env['GITHUB_ACTIONS']) {
        core.endGroup();
      }
    }
    const msg = this.logStep(emoji.get('x'), 'FAILURE', chalk.red(desc));
    if (!process.env['GITHUB_ACTIONS']) {
      console.error(msg);
    } else {
      core.setFailed(msg);
    }
  }

  error(description = ''): void {
    const msg = this.logStep(emoji.get('x'), 'ERROR', chalk.bgRedBright(description));
    if (!process.env['GITHUB_ACTIONS']) {
      console.error(msg);
    } else {
      core.error(msg);
    }
  }

  title(description = ''): void {
    const msg = this.logStep('📓', '#####', chalk.yellowBright(description));
    if (!process.env['GITHUB_ACTIONS']) {
      console.info(msg);
    } else {
      core.info(msg);
    }
  }
}

export default LogTask;
