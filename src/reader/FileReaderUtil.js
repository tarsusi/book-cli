import csv from 'csv';
import fs from 'fs';
import Logger from '../logger/Logger';
import UI from '../ui/UI';

import { CSV_HEADERS, DEST_PATH } from '../common/FILE_CONSTANTS';

const readAndUpdateFile = (filePath, callback) => {
  if (fs.existsSync(filePath)) {
    Logger.log('File exists!');

    fs.stat(filePath, (error, stat) => {
      if (error) {
        Logger.error(error);
        callback();
      } else {
        const fileSize = stat.size;
        let charsCopied = Object.keys(CSV_HEADERS).join(',').length + 1; // initially add first header line

        const parser = csv.parse({ delimiter: ',', columns: true });
        const writer = fs.createWriteStream(DEST_PATH, { flags: 'a' });

        UI.redraw();

        fs.createReadStream(filePath)
          .pipe(parser)
          .on('data', (row) => {
            const isbn = row[CSV_HEADERS.ISBN];
            const bookName = row[CSV_HEADERS.BOOK_NAME];
            const author = row[CSV_HEADERS.AUTHOR];
            const price = row[CSV_HEADERS.PRICE];

            const rowFields = [isbn, bookName, author, price];

            const rowCharLength = rowFields.join(',').length + 1;

            charsCopied += rowCharLength;

            if (charsCopied > fileSize) {
              charsCopied -= 1;
            }

            const percentage = ((charsCopied / fileSize) * 100).toFixed(2);

            UI.redraw(`${percentage}%`);

            writer.write(`${rowFields.join(',')}\n`);
          })
          .on('end', () => {
            UI.redraw('File reading is completed');
            writer.end();
            parser.end();
            callback();
          });
      }
    });
  } else {
    Logger.log('File does not exists!');
    callback();
  }
};

export default readAndUpdateFile;
