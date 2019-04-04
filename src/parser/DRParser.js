// Parser for D&R
import cheerio from 'cheerio';
import requestPromise from 'request-promise';

const BOOK_SEARCH_URL = 'https://www.dr.com.tr/search?q=';

class DRParser {
  getPageHTML = async (page) => {
    const pageHTML = await requestPromise(page);

    return pageHTML;
  };

  parse = async (isbn) => {
    const pageHTML = await this.getPageHTML(`${BOOK_SEARCH_URL}${isbn}`);

    const $ = cheerio.load(pageHTML);

    const queryBooks = $('#catPageContent .shelf #container .list-cell');

    if (queryBooks.length) {
      const firstBook = queryBooks.first();

      const bookName = firstBook.find('.details .summary .item-name h3').text();
      const author = firstBook
        .find('.details .summary .who')
        .first()
        .text();
      const price = firstBook.find('.details .prices .price').text();
      const bookImage = firstBook.find('figure .item-name img').attr('src');

      return {
        bookName,
        author,
        price,
        bookImage,
      };
    }

    return {};
  };
}

export default new DRParser();
