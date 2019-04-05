import fs from 'fs';
import { ERROR_LOG_FILE } from '../common/FILE_CONSTANTS';

class Logger {
  constructor() {
    this.errorFileStream = fs.createWriteStream(ERROR_LOG_FILE, { flags: 'a' });
  }

  assert = message => console.assert(message);

  error = (message) => {
    this.errorFileStream.write(`${new Date()} - ${message}\n\n`);
  };

  exception = message => console.exception(message);

  log = message => console.log(message);

  warn = message => console.warn(message);
}

export default new Logger();
