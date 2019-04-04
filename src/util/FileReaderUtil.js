import csv from 'csv';
import fs from 'fs';
import Logger from '../logger/Logger';
import UI from '../ui/UI';
import ParserUtil from './ParserUtil';

import { CSV_HEADERS, DEST_PATH, MAX_PERCENTAGE } from '../common/FILE_CONSTANTS';

const findByteLength = text => Buffer.byteLength(text, 'utf8');

const readAndUpdateFile = (filePath, callback) => {
  if (fs.existsSync(filePath)) {
    Logger.log('File exists!');

    fs.stat(filePath, (error, stat) => {
      if (error) {
        Logger.error(error);
        callback();
      } else {
        const fileSize = stat.size;
        let charsCopied = findByteLength(Object.keys(CSV_HEADERS).join(',')) + 1; // initially add first header line

        const parser = csv.parse({ delimiter: ',', columns: true });

        fs.unlinkSync(DEST_PATH);

        const writer = fs.createWriteStream(DEST_PATH, { flags: 'a' });

        UI.redraw();

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

            const bookInfo = await ParserUtil.parseBook(isbn, bookName, author, price);

            csv.stringify(
              [
                [
                  isbn.trim(),
                  bookInfo.bookName.trim(),
                  bookInfo.author.trim(),
                  bookInfo.price.trim(),
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
    Logger.log('File does not exists!');
    callback();
  }
};

export default readAndUpdateFile;
