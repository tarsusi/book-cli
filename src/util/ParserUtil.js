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
      case PARSER_STRATEGIES.DR:
        return DRParser;
      case PARSER_STRATEGIES.KITAP_YURDU:
        return KitapYurduParser;
      case PARSER_STRATEGIES.RANDOM:
      default:
        return PARSERS[Math.floor(Math.random() * PARSERS.length)];
    }
  };

  parseBook = async (isbn, bookName, author, price) => {
    const parser = await this.findParser();
    const parsedBook = await parser.parse(isbn, bookName, author, price);

    return parsedBook;
  };
}

export default new ParserUtil();
