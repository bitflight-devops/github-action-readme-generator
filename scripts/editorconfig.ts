import * as editorconfig from 'editorconfig';

import LogTask from '../src/logtask';

const log = new LogTask('Editorconfig');
export const DEFAULT_EDITORCONFIG_MAX_LINE_LENGTH = 80;
export interface IProperties extends editorconfig.KnownProps {
  /**
   * Set to latin1, utf-8, utf-8-bom, utf-16be or utf-16le to control the
   * character set.
   */
  charset?: string;
  /**
   * Set to tab or space to use hard tabs or soft tabs respectively.
   */
  indent_style?: 'unset' | 'tab' | 'space';
  /**
   * The number of columns used for each indentation level and the width
   * of soft tabs (when supported). When set to tab, the value of
   * tab_width (if specified) will be used.
   */
  indent_size?: number | 'unset' | 'tab';
  /**
   * Number of columns used to represent a tab character. This defaults
   * to the value of indent_size and doesn't usually need to be specified.
   */
  tab_width?: number | 'unset';
  /**
   * Removes any whitespace characters preceding newline characters.
   */
  trim_trailing_whitespace?: boolean | 'unset';
  /**
   * Set to lf, cr, or crlf to control how line breaks are represented.
   */
  end_of_line?: 'lf' | 'crlf' | 'unset';
  /**
   * Ensures files ends with a newline.
   */
  insert_final_newline?: boolean | 'unset';
  /**
   * Enforces the maximum number of columns you can have in a line.
   */
  max_line_length: number;
  block_comment?: string;
  block_comment_start?: string;
  block_comment_end?: string;
}
class Editorconfig {
  props: IProperties;

  constructor() {
    const defaults = { max_line_length: DEFAULT_EDITORCONFIG_MAX_LINE_LENGTH };
    try {
      this.props = { ...defaults, ...editorconfig.parseSync(process.cwd()) };
      log.debug('Editor config: JSON.stringify(this.props)');
    } catch (error) {
      log.error(`Error parsing editorconfig: ${JSON.stringify(error)}`);
      this.props = defaults;
    }
  }
}

export default new Editorconfig();
