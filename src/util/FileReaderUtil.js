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
  DEST_PATH,
  MAX_PERCENTAGE,
} from '../common/FILE_CONSTANTS';

const findByteLength = text => Buffer.byteLength(text, 'utf8');

const INPUT_CSV_HEADERS = [
  CSV_HEADERS.ISBN,
  CSV_HEADERS.BOOK_NAME,
  CSV_HEADERS.AUTHOR,
  CSV_HEADERS.PRICE,
];

const OUTPUT_CSV_HEADERS = [...INPUT_CSV_HEADERS, CSV_HEADERS.IMAGE_PATH];

const readAndUpdateFile = (filePath, startIndex, endIndex, callback) => {
  if (fs.existsSync(filePath)) {
    Logger.log('File exists!');

    fs.stat(filePath, (error, stat) => {
      if (error) {
        Logger.error(error);
        callback();
      } else {
        const fileSize = stat.size;
        const limitStart = +startIndex || -1;
        const limitEnd = +endIndex || -1;

        let recordIndexer = 0;

        let charsCopied = findByteLength(INPUT_CSV_HEADERS.join(',')) + 1; // initially add first header line

        const parser = csv.parse({ delimiter: ',', columns: true });

        fs.unlinkSync(DEST_PATH);

        const writer = fs.createWriteStream(DEST_PATH, { flags: 'a' });

        UI.log('File reading process started');
        UI.redraw('Completed 0%');

        writer.write(`${OUTPUT_CSV_HEADERS.join(',')}\n`);

        fs.createReadStream(filePath)
          .pipe(parser)
          .on('data', async (row) => {
            recordIndexer += 1;

            const isbn = row[CSV_HEADERS.ISBN];
            const bookName = row[CSV_HEADERS.BOOK_NAME];
            const author = row[CSV_HEADERS.AUTHOR];
            const price = row[CSV_HEADERS.PRICE];

            const rowFields = [isbn, bookName, author, price];

            const rowCharLength = findByteLength(rowFields.join(',')) + 1;

            let bookInfo;
            let imagePath = '';

            if (
              validateCompleteRecord(isbn, bookName, author, price)
              || !validateLimitOffset(recordIndexer, limitStart, limitEnd)
            ) {
              bookInfo = {
                isbn,
                bookName,
                author,
                price,
              };

              charsCopied += rowCharLength;

              if (charsCopied > fileSize) {
                charsCopied -= 1;
              }
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

              charsCopied += rowCharLength;

              if (charsCopied > fileSize) {
                charsCopied -= 1;
              }
            } else {
              bookInfo = {
                isbn,
                bookName,
                author,
                price,
              };

              Logger.error(
                `The given ISBN is not valid for record=${rowFields}`,
              );

              charsCopied += rowCharLength;

              if (charsCopied > fileSize) {
                charsCopied -= 1;
              }
            }

            csv.stringify(
              [
                [
                  isbn.trim(),
                  bookInfo.bookName.trim(),
                  bookInfo.author.trim(),
                  bookInfo.price.trim(),
                  imagePath.trim(),
                ],
              ],
              (err, output) => {
                if (error) {
                  Logger.error(error);
                  return;
                }

                const percentage = (
                  (charsCopied / fileSize)
                  * MAX_PERCENTAGE
                ).toFixed(2);

                UI.redraw(`Completed ${percentage}%`);
                writer.write(output);

                if (charsCopied === fileSize) {
                  UI.log('File reading process completed');
                  callback();
                }
              },
            );
          })
          .on('end', callback);
      }
    });
  } else {
    UI.redraw('File does not exists!');

    Logger.error('File does not exists!');
    callback();
  }
};

export default readAndUpdateFile;
