import vorpal from 'vorpal';

const Vorpal = vorpal();
const { chalk } = Vorpal;

Vorpal.delimiter(chalk.magenta('book-cli$')).show();
