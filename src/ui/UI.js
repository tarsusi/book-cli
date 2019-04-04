import vorpal from 'vorpal';
import { UI_PREFIX, UI_COMMANDS } from '../common/UI_CONSTANTS';

const Vorpal = vorpal();
const { chalk } = Vorpal;

class UI {
  constructor() {
    Vorpal.delimiter(chalk.magenta(UI_PREFIX));

    this.addCommands();
  }

  addCommands = () => {
    UI_COMMANDS.forEach(({ name, explanation, action }) => {
      Vorpal.command(name, explanation).action((args, callback) => {
        action(args, callback);
      });
    });
  };

  redraw = (text = '') => Vorpal.ui.redraw(text);

  show = () => Vorpal.show();
}

export default new UI();
