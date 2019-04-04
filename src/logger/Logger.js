class Logger {
  assert = message => console.assert(message);

  error = message => console.error(message);

  exception = message => console.exception(message);

  log = message => console.log(message);

  warn = message => console.warn(message);
}

export default new Logger();
