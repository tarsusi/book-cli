import csv from 'csv';
import fs from 'fs';
import Logger from '../logger/Logger';
import UI from '../ui/UI';
import ParserUtil from './ParserUtil';
import { validateISBN } from './ValidateUtil';
import { downloadImage } from './ImageUtil';

import { CSV_HEADERS, DEST_PATH, MAX_PERCENTAGE } from '../common/FILE_CONSTANTS';

const findByteLength = text => Buffer.byteLength(text, 'utf8');

const INPUT_CSV_HEADERS = [
  CSV_HEADERS.ISBN,
  CSV_HEADERS.BOOK_NAME,
  CSV_HEADERS.AUTHOR,
  CSV_HEADERS.PRICE,
];

const OUTPUT_CSV_HEADERS = [...INPUT_CSV_HEADERS, CSV_HEADERS.IMAGE_PATH];

const readAndUpdateFile = (filePath, callback) => {
  if (fs.existsSync(filePath)) {
    Logger.log('File exists!');

    fs.stat(filePath, (error, stat) => {
      if (error) {
        Logger.error(error);
        callback();
      } else {
        const fileSize = stat.size;

        let charsCopied = findByteLength(INPUT_CSV_HEADERS.join(',')) + 1; // initially add first header line

        const parser = csv.parse({ delimiter: ',', columns: true });

        fs.unlinkSync(DEST_PATH);

        const writer = fs.createWriteStream(DEST_PATH, { flags: 'a' });

        UI.redraw();

        writer.write(`${OUTPUT_CSV_HEADERS.join(',')}\n`);

        fs.createReadStream(filePath)
          .pipe(parser)
          .on('data', async (row) => {
            const isbn = row[CSV_HEADERS.ISBN];
            const bookName = row[CSV_HEADERS.BOOK_NAME];
            const author = row[CSV_HEADERS.AUTHOR];
            const price = row[CSV_HEADERS.PRICE];

            const rowFields = [isbn, bookName, author, price];

            const rowCharLength = findByteLength(rowFields.join(',')) + 1;

            charsCopied += rowCharLength;

            if (charsCopied > fileSize) {
              charsCopied -= 1;
            }

            let bookInfo;
            let imagePath = '';

            if (validateISBN(isbn)) {
              bookInfo = await ParserUtil.parseBook(isbn, bookName, author, price);

              if (!bookInfo.isbn || !bookInfo.bookName) {
                Logger.error(`No ISBN or BookName for record=${[isbn, bookName, author, price]}`);
              }

              if (bookInfo.bookImage) {
                imagePath = downloadImage(
                  bookInfo.bookImage,
                  `${bookInfo.bookName}-${bookInfo.author}`,
                );
              } else {
                Logger.error(`No book image found for record=${[isbn, bookName, author, price]}`);
              }
            } else {
              bookInfo = {
                isbn,
                bookName,
                author,
                price,
              };

              Logger.error(
                `The given ISBN is not valid for record=${[isbn, bookName, author, price]}`,
              );
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
                const percentage = ((charsCopied / fileSize) * MAX_PERCENTAGE).toFixed(2);

                UI.redraw(`${percentage}%`);

                writer.write(output);

                if (percentage >= MAX_PERCENTAGE) {
                  UI.redraw('File reading is completed');
                  callback();
                }
              },
            );
          });
      }
    });
  } else {
    UI.redraw('File does not exists!');

    Logger.error('File does not exists!');
    callback();
  }
};

export default readAndUpdateFile;
