// Parser for idefix.com
import cheerio from 'cheerio';
import requestPromise from 'request-promise';
import Logger from '../logger/Logger';

const BOOK_SEARCH_URL = 'https://www.idefix.com/search/?Q=';

class IdefixParser {
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

    const queryBooks = $('#facetProducts .shelf .books .cart-product-box');

    if (queryBooks.length) {
      const firstBook = queryBooks.first();

      const bookName = firstBook.find('.product-info .box-title a').attr('title') || '';
      const author = firstBook
        .find('.product-info .pName .who')
        .first()
        .text() || '';
      const price = firstBook.find('.product-info #prices').text() || '';
      const bookImage = firstBook.find('.product-image .image-area img').attr('data-src') || '';

      return {
        author,
        bookImage,
        bookName,
        isbn,
        price,
      };
    }

    return {};
  };
}

export default new IdefixParser();
