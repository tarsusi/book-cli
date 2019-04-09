import csv from 'csv';
import fs from 'fs';

import Logger from '../logger/Logger';
import UI, { chalk } from '../ui/UI';
import ParserUtil from './ParserUtil';
import UserSettings, { USER_SETTING_KEYS } from '../settings/UserSettings';

import {
  validateCompleteRecord,
  validateLimitOffset,
  validateISBN,
} from './ValidateUtil';
import { downloadImage } from './ImageUtil';

import { MAX_PERCENTAGE } from '../constants/FILE_CONSTANTS';

const findByteLength = text => Buffer.byteLength(text, 'utf8');

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
  csv.stringify(
    record,
    {
      delimiter: UserSettings.getUserSetting(USER_SETTING_KEYS.DELIMITER),
    },
    (error, output) => {
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
    },
  );
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

        const userSettings = UserSettings.getUserSettings();

        const INPUT_CSV_HEADERS = [
          userSettings[USER_SETTING_KEYS.ISBN],
          userSettings[USER_SETTING_KEYS.TITLE],
          userSettings[USER_SETTING_KEYS.AUTHOR],
          userSettings[USER_SETTING_KEYS.PRICE],
        ];

        const OUTPUT_CSV_HEADERS = [
          ...INPUT_CSV_HEADERS,
          userSettings[USER_SETTING_KEYS.IMAGE_PATH],
        ];

        let charsCopied = findByteLength(INPUT_CSV_HEADERS.join(',')) + 2; // initially add first header line

        const parser = csv.parse({
          delimiter: userSettings[USER_SETTING_KEYS.DELIMITER],
          columns: true,
          relax_column_count: true,
        });

        const fileWriter = fs.createWriteStream(
          userSettings[USER_SETTING_KEYS.OUTPUT_PATH],
        );

        UI.log(chalk.cyan('File reading process started'));

        fileWriter.write(
          `${OUTPUT_CSV_HEADERS.join(
            userSettings[USER_SETTING_KEYS.DELIMITER],
          )}\n`,
        );

        fs.createReadStream(filePath)
          .pipe(parser)
          .on('data', async (row) => {
            const rowKeys = Object.keys(row);

            if (
              (rowKeys.length !== INPUT_CSV_HEADERS.length
                && !row[userSettings[USER_SETTING_KEYS.ISBN]])
              || rowKeys.some(rowKey => !INPUT_CSV_HEADERS.includes(rowKey))
            ) {
              const currentDelimiter = UserSettings.getUserSetting(
                USER_SETTING_KEYS.DELIMITER,
              );

              UI.log(`${chalk.red(`
                        !!!!!!!
Oh, it seems you are using wrong CSV format. You should use
the following CSV file format to get any successful result.
First line is header, the second line is an example of record.`)}

  ${chalk.cyan(`
  ${userSettings[USER_SETTING_KEYS.ISBN]}${currentDelimiter}${
  userSettings[USER_SETTING_KEYS.TITLE]
}${currentDelimiter}${
  userSettings[USER_SETTING_KEYS.AUTHOR]
}${currentDelimiter}${userSettings[USER_SETTING_KEYS.PRICE]}
  1234567890123;Title;Author(s);Price

${chalk.green(`
  But do not worry. You can change following settings using changeSetting command:

  delimiter   -   Change CSV values delimiter symbol. Default is comma(,).
  outputPath  -   Destination file for output. Default is 'output.csv'.
  isbn        -   CSV header for ISBN. Default is 'isbn13'.
  title       -   CSV header for title of book. Default is 'title'.
  author      -   CSV header for author of book. Default is 'authors'.
  price       -   CSV header for price of book. Default is 'price'.
`)}
        `)}`);
              const destPath = userSettings[USER_SETTING_KEYS.DELIMITER];
              if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
              }

              parser.pause();
              callback();

              return;
            }

            const isbn = row[userSettings[USER_SETTING_KEYS.ISBN]] || '';
            const bookName = row[userSettings[USER_SETTING_KEYS.TITLE]] || '';
            const author = row[userSettings[USER_SETTING_KEYS.AUTHOR]] || '';
            const price = row[userSettings[USER_SETTING_KEYS.PRICE]] || '';

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
