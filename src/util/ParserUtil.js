import PARSER_STRATEGIES from '../common/UTIL_CONSTANTS';

import DRParser from '../parser/DRParser';
import KitapYurduParser from '../parser/KitapYurduParser';

const PARSERS = [DRParser, KitapYurduParser];

class ParserUtil {
  constructor(parserStrategy = PARSER_STRATEGIES.RANDOM) {
    this.parserStrategy = parserStrategy;
  }

  findParser = () => {
    switch (this.parserStrategy) {
      case PARSER_STRATEGIES.RANDOM:
      default:
        return PARSERS[Math.floor(Math.random() * PARSERS.length)];
    }
  };

  parseBook = (isbn, bookName, author, price) => {
    const parser = this.findParser();
    parser.parse(isbn, bookName, author, price);
  };
}

export default new ParserUtil();
