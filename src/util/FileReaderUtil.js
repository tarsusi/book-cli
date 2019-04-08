import csv from 'csv';
import fs from 'fs';

import Logger from '../logger/Logger';
import UI from '../ui/UI';
import ParserUtil from './ParserUtil';
import {
  validateCompleteRecord,
  validateLimitOffset,
  validateISBN,
} from './ValidateUtil';
import { downloadImage } from './ImageUtil';

import {
  CSV_HEADERS,
  CSV_FILE_DELIMITERS,
  DEST_PATH,
  MAX_PERCENTAGE,
} from '../constants/FILE_CONSTANTS';

const findByteLength = text => Buffer.byteLength(text, 'utf8');

const chalk = UI.getChalk();

const INPUT_CSV_HEADERS = [
  CSV_HEADERS.ISBN,
  CSV_HEADERS.BOOK_NAME,
  CSV_HEADERS.AUTHOR,
  CSV_HEADERS.PRICE,
];

const OUTPUT_CSV_HEADERS = [...INPUT_CSV_HEADERS, CSV_HEADERS.IMAGE_PATH];

const toCSVRecord = (isbn, bookName, author, price, imagePath) => [
  [
    (isbn && isbn.trim()) || '',
    (bookName && bookName.trim()) || '',
    (author && author.trim()) || '',
    (price && price.trim()) || '',
    (imagePath && imagePath.trim()) || '',
  ],
];

const writeToFile = (
  record,
  percentage,
  isLastRecord,
  fileWriter,
  callback,
) => {
  csv.stringify(record, (error, output) => {
    if (error) {
      Logger.error(error);
      return;
    }

    UI.redraw(chalk.green(`Completed ${Math.min(percentage, 100)}%`));

    fileWriter.write(output);

    if (isLastRecord && percentage >= 100) {
      UI.log(chalk.yellow('File reading process completed'));
      callback();
    }
  });
};

const readAndUpdateFile = (filePath, startIndex, endIndex, callback) => {
  if (fs.existsSync(filePath)) {
    UI.log(chalk.green('File exists!'));

    fs.stat(filePath, (error, stat) => {
      if (error) {
        Logger.error(error);
        callback();
      } else {
        const fileSize = stat.size;
        const limitStart = +startIndex || -1;
        const limitEnd = +endIndex || -1;

        let recordIndexer = 0;

        let charsCopied = findByteLength(INPUT_CSV_HEADERS.join(',')) + 2; // initially add first header line

        const parser = csv.parse({
          delimiter: CSV_FILE_DELIMITERS,
          columns: true,
          relax_column_count: true,
        });
        const fileWriter = fs.createWriteStream(DEST_PATH);

        UI.log(chalk.cyan('File reading process started'));

        fileWriter.write(`${OUTPUT_CSV_HEADERS.join(',')}\n`);

        fs.createReadStream(filePath)
          .pipe(parser)
          .on('data', async (row) => {
            const isbn = row[CSV_HEADERS.ISBN] || '';
            const bookName = row[CSV_HEADERS.BOOK_NAME] || '';
            const author = row[CSV_HEADERS.AUTHOR] || '';
            const price = row[CSV_HEADERS.PRICE] || '';

            const rowFields = [isbn, bookName, author, price];

            const rowCharLength = findByteLength(rowFields.join(',')) + 2;

            let bookInfo;
            let percentage;
            let imagePath = '';

            if (
              validateCompleteRecord(isbn, bookName, author, price)
              || !validateLimitOffset(recordIndexer, limitStart, limitEnd)
            ) {
              const bookRecord = toCSVRecord(
                isbn,
                bookName,
                author,
                price,
                imagePath,
              );

              recordIndexer += 1;
              charsCopied += rowCharLength;
              percentage = ((charsCopied / fileSize) * MAX_PERCENTAGE).toFixed(
                2,
              );
              const recordSize = parser.info.records;

              writeToFile(
                bookRecord,
                percentage,
                recordIndexer >= recordSize,
                fileWriter,
                callback,
              );
            } else if (validateISBN(isbn)) {
              bookInfo = await ParserUtil.parseBook(
                isbn,
                bookName,
                author,
                price,
              );

              if (!bookInfo.isbn || !bookInfo.bookName) {
                Logger.error(`No ISBN or BookName for record=${rowFields}`);
              }

              if (bookInfo.bookImage) {
                imagePath = downloadImage(
                  bookInfo.bookImage,
                  `${bookInfo.bookName}-${bookInfo.author}`,
                );
              } else {
                Logger.error(`No book image found for record=${rowFields}`);
              }

              const bookRecord = toCSVRecord(
                isbn,
                bookInfo.bookName,
                bookInfo.author,
                bookInfo.price,
                imagePath,
              );

              recordIndexer += 1;
              charsCopied += rowCharLength;
              percentage = ((charsCopied / fileSize) * MAX_PERCENTAGE).toFixed(
                2,
              );
              const recordSize = parser.info.records;

              writeToFile(
                bookRecord,
                percentage,
                recordIndexer >= recordSize,
                fileWriter,
                callback,
              );
            } else {
              Logger.error(
                `The given ISBN is not valid for record=${rowFields}`,
              );

              const bookRecord = toCSVRecord(
                isbn,
                bookName,
                author,
                price,
                imagePath,
              );

              recordIndexer += 1;
              charsCopied += rowCharLength;
              percentage = ((charsCopied / fileSize) * MAX_PERCENTAGE).toFixed(
                2,
              );
              const recordSize = parser.info.records;

              writeToFile(
                bookRecord,
                percentage,
                recordIndexer >= recordSize,
                fileWriter,
                callback,
              );
            }
          });
      }
    });
  } else {
    UI.log('File does not exists!');

    Logger.error('File does not exists!');
    callback();
  }
};

export default readAndUpdateFile;
