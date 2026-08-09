import type { BigIntStats, PathLike, PathOrFileDescriptor, Stats, StatSyncOptions } from 'node:fs';

import { type Mock, vi } from 'vite-plus/test';

import {
  actionTestString,
  ghadocsTestString,
  gitConfigTestString,
  payloadTestString,
} from '../__tests__/action.constants.js';

export type { BigIntStats, PathLike, PathOrFileDescriptor, Stats, StatSyncOptions } from 'node:fs';

export const statSync: Mock<
  (path: PathLike, options?: StatSyncOptions | undefined) => Stats | BigIntStats | undefined
> = vi.fn(
  (path: PathLike, options?: StatSyncOptions | undefined): Stats | BigIntStats | undefined => {
    if (typeof path === 'string' && options === undefined) {
      return {
        isFile: () => true,
      } as Stats;
    }
    return {
      isFile: () => false,
    } as Stats;
  },
);

export const existsSync: Mock<(filename: PathLike) => boolean> = vi.fn(
  (filename: PathLike): boolean => typeof filename === 'string',
);
export const readFileSync: Mock<(filename: PathOrFileDescriptor) => string | Buffer> = vi.fn(
  (filename: PathOrFileDescriptor): string | Buffer => {
    if (typeof filename === 'string' && filename.endsWith('payload.json')) {
      return payloadTestString;
    }
    if (typeof filename === 'string' && filename.endsWith('.ghadocs.json')) {
      return ghadocsTestString;
    }
    if (typeof filename === 'string' && filename.endsWith('config')) {
      return gitConfigTestString;
    }
    if (typeof filename === 'string' && filename.endsWith('yml')) {
      return actionTestString;
    }
    return '';
  },
);
