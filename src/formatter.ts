import ec from './editorconfig';

class Formatter {
  max_line_length = 80;

  constructor() {
    this.max_line_length = ec.props.max_line_length;
  }
}

export default new Formatter();
