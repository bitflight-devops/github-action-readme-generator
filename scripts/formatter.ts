/* eslint-disable promise/no-nesting */
import * as prettier from 'prettier';

class Formatter {
  max_line_length = 80;

  constructor(readmePath: string) {
    prettier
      .resolveConfigFile()
      .then(async (cwd) => {
        const opts: prettier.ResolveConfigOptions = cwd ? { config: cwd } : {};
        opts.editorconfig = true;
        return prettier
          .resolveConfig(readmePath, opts)
          .then((config) => config || {})
          .then((config: prettier.Options) => {
            if ('max_line_length' in config && config.max_line_length) {
              const val: string | number = config.max_line_length as any;
              if (typeof val === 'number') {
                this.max_line_length = val;
                return val;
              }
            }
            return -1;
          })
          .catch(() => {
            // ignore
          });
      })
      .catch(() => {
        // ignore
      });
  }
}

export default new Formatter('');
