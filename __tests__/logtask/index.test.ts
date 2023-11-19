/* eslint-disable sonarjs/no-duplicate-string */
import * as core from '@actions/core';
import chalk from 'chalk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LogTask from '../../src/logtask/index.js';

vi.mock('@actions/core');
const testMessage = 'Test message';
describe('LogTask', () => {
  let logTask: LogTask;

  beforeEach(() => {
    logTask = new LogTask('TestTask');
    vi.stubEnv('GITHUB_ACTIONS', 'false');
  });

  afterEach(() => {
    logTask.ingroup = false;
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  describe('isDebug', () => {
    it('should return true if debug mode is enabled', () => {
      expect(vi.isMockFunction(core.isDebug)).toBe(true);
      vi.mocked(core.isDebug).mockReturnValue(true);
      expect(LogTask.isDebug()).toBe(true);
    });

    it('should return true if DEBUG environment variable is set', () => {
      vi.stubEnv('DEBUG', 'true');
      expect(LogTask.isDebug()).toBe(true);
    });

    it('should return false if debug mode is not enabled', () => {
      vi.stubEnv('DEBUG', 'false');
      expect(LogTask.isDebug()).toBe(false);
    });
  });

  describe('getMessageString', () => {
    it('should return the formatted message string when ingroup is enabled', () => {
      logTask.ingroup = true;
      const result = logTask.getMessageString('START', testMessage, '🚀');
      expect(result).toBe(chalk.yellowBright('        🚀: TestTask > Test message'));
    });

    it('should return the formatted message string when ingroup is disabled', () => {
      const result = logTask.getMessageString('START', testMessage, '🚀');
      expect(result).toBe(chalk.yellowBright('[START][TestTask   ] 🚀: Test message'));
    });
  });

  describe('logStep', () => {
    it('should log a step with the given emoji, type, message, and no startGroup', () => {
      logTask.logStep('🚀', 'START', testMessage);
      expect(core.info).toHaveBeenCalledWith(
        chalk.yellowBright('[START][TestTask   ] 🚀: Test message'),
      );
    });

    it('should log a step with the given emoji, type, message, and startGroup', () => {
      vi.stubEnv('GITHUB_ACTIONS', 'true');
      logTask.logStep('🚀', 'START', testMessage, 1);
      expect(core.startGroup).toHaveBeenCalledWith(testMessage);
    });
  });

  describe('debug', () => {
    it('should log a debug message if debug mode is enabled', () => {
      LogTask.isDebug = vi.fn().mockReturnValue(true);
      logTask.debug(testMessage);
      expect(core.info).toHaveBeenCalledWith('[DEBUG][TestTask   ] 🐞: Test message');
    });

    it('should not log a debug message if debug mode is disabled', () => {
      LogTask.isDebug = vi.fn().mockReturnValue(false);
      logTask.debug(testMessage);
      expect(core.info).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('should start a group when in GitHub Actions', () => {
      vi.stubEnv('GITHUB_ACTIONS', 'true');
      logTask.start(testMessage);
      expect(core.startGroup).toHaveBeenCalledWith(testMessage);
    });
    it('should not start a group when out of GitHub Actions', () => {
      vi.stubEnv('GITHUB_ACTIONS', 'false');
      logTask.start(testMessage);
      expect(core.startGroup).toBeCalledTimes(0);
      expect(core.info).toHaveBeenCalledWith(
        chalk.yellowBright('[START][TestTask   ] 🚀: Test message'),
      );
    });
  });

  describe('info', () => {
    it('should log an info message', () => {
      logTask.info(testMessage);
      expect(core.info).toHaveBeenCalledWith(
        `[INFO ][TestTask   ] ✨: ${chalk.green(testMessage)}`,
      );
    });
  });

  describe('warn', () => {
    it('should log a warning message', () => {
      logTask.warn(testMessage);
      expect(core.info).toHaveBeenCalledWith(
        `[WARN ][TestTask   ] ⚠️: ${chalk.yellow(testMessage)}`,
      );
    });
  });
  /* eslint-enable sonarjs/no-duplicate-string */
  describe('success', () => {
    it('should log a success message', () => {
      logTask.success(testMessage);
      expect(core.info).toHaveBeenCalledWith(
        chalk.whiteBright(`[SUCCESS][TestTask   ] ✅: ${chalk.greenBright(testMessage)}`),
      );
    });

    it('should log a success message without ingroup', () => {
      logTask.success(testMessage, false);
      expect(core.info).toHaveBeenCalledWith(
        chalk.whiteBright(`[SUCCESS][TestTask   ] ✅: ${chalk.greenBright(testMessage)}`),
      );
    });

    it('should end the group if ingroup is enabled and GITHUB_ACTIONS is true', () => {
      process.env.GITHUB_ACTIONS = 'true';
      logTask.ingroup = true;
      logTask.success(testMessage);
      expect(core.endGroup).toHaveBeenCalled();
    });
  });

  describe('fail', () => {
    it('should log a failure message', () => {
      vi.stubEnv('GITHUB_ACTIONS', 'false');
      logTask.fail(testMessage);
      expect(core.setFailed).toHaveBeenCalledWith(
        chalk.bgRedBright(`[FAILURE][TestTask   ] ❌: ${chalk.yellow.bold(testMessage)}`),
      );
    });

    it('should log a failure message without ingroup', () => {
      vi.stubEnv('GITHUB_ACTIONS', 'false');
      logTask.fail(testMessage, false);
      expect(core.setFailed).toHaveBeenCalledWith(
        chalk.bgRedBright(`[FAILURE][TestTask   ] ❌: ${chalk.yellow.bold(testMessage)}`),
      );
    });

    it('should end the group if ingroup is enabled and GITHUB_ACTIONS is true', () => {
      vi.stubEnv('GITHUB_ACTIONS', 'true');
      logTask.ingroup = true;
      logTask.fail(testMessage);
      expect(core.endGroup).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log an error message', () => {
      vi.stubEnv('GITHUB_ACTIONS', 'false');
      logTask.error(testMessage);
      expect(core.error).toHaveBeenCalledWith(
        chalk.bgRedBright(`[ERROR  ][TestTask   ] 🔴: ${chalk.yellow(testMessage)}`),
      );
    });
  });

  describe('title', () => {
    it('should log a title message', () => {
      logTask.title(testMessage);
      expect(core.info).toHaveBeenCalledWith(
        `[#####  ][TestTask   ] 📓: ${chalk.cyan(testMessage)}`,
      );
    });
  });
});
