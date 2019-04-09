// Parser for D&R
import cheerio from 'cheerio';
import requestPromise from 'request-promise';
import Logger from '../logger/Logger';

const BOOK_SEARCH_URL = 'https://www.dr.com.tr/search?q=';

class DRParser {
  getPageHTML = async (page) => {
    const pageHTML = await requestPromise(page);

    return pageHTML;
  };

  parse = async (isbn) => {
    let pageHTML;

    try {
      pageHTML = await this.getPageHTML(`${BOOK_SEARCH_URL}${isbn}`);
    } catch (error) {
      Logger.error(error);

      return {};
    }

    const $ = cheerio.load(pageHTML);

    const queryBooks = $('#catPageContent .shelf #container .list-cell');

    if (queryBooks.length) {
      const firstBook = queryBooks.first();

      const bookName = firstBook.find('.details .summary .item-name h3').text() || '';
      const author = firstBook
        .find('.details .summary .who')
        .first()
        .text() || '';
      const price = firstBook.find('.details .prices .price').text() || '';
      const bookImage = firstBook.find('figure .item-name img').attr('src') || '';

      return {
        author,
        bookName,
        bookImage,
        isbn,
        price,
      };
    }

    return {};
  };
}

export default new DRParser();
