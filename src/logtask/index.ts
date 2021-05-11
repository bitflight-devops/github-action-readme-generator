import * as chalk from 'chalk'
import * as emoji from 'node-emoji'

export class LogTask {
  constructor(readonly name: string) {}

  logStep(emojiStr: string, step: string, description: string): void {
    console.log(`${emojiStr} ${step} ${this.name} ${description}`)
  }

  start(description = ''): void {
    this.logStep(emoji.get('rocket'), 'START', description)
  }
  info(description = ''): void {
    this.logStep(emoji.get('sparkles'), 'INFO ', description)
  }
  success(description = ''): void {
    this.logStep(emoji.get('white_check_mark'), 'END  ', chalk.green(description))
  }
  fail(description = ''): void {
    this.logStep(emoji.get('x'), 'END  ', chalk.red(description))
  }
  error(description = ''): void {
    this.logStep(emoji.get('x'), 'ERROR', chalk.bgRedBright(description))
  }
  title(description = ''): void {
    this.logStep(emoji.get('target'), '#####', chalk.yellowBright(description))
  }
}
