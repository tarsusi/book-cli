import csv from 'csv';
import fs from 'fs';

import Logger from '../logger/Logger';
import UI, { chalk } from '../ui/UI';
import ParserUtil from './ParserUtil';
import I18N_KEYS from '../constants/I18N_KEYS';
import UserSettings, { USER_SETTING_KEYS } from '../settings/UserSettings';

import {
  validateCompleteRecord,
  validateLimitOffset,
  validateISBN,
} from './ValidateUtil';
import { downloadImage } from './ImageUtil';

import { MAX_PERCENTAGE } from '../constants/FILE_CONSTANTS';

const findByteLength = text => Buffer.byteLength(text, 'utf8');

let recordReadCounter = 1;

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
  parser,
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

      recordReadCounter += 1;

      UI.redraw(chalk.green(I18N_KEYS.FILE_READING_PROGRESS(percentage)));

      fileWriter.write(output);

      if (
        (isLastRecord && percentage >= 100)
        || recordReadCounter === parser.info.lines
      ) {
        UI.redraw(chalk.green(I18N_KEYS.FILE_READING_PROGRESS(100)));
        UI.log(chalk.yellow(I18N_KEYS.FILE_READING_COMPLETED));

        recordReadCounter = 1;
      }
      callback();
    },
  );
};

const readAndUpdateFile = (filePath, startIndex, endIndex, callback) => {
  if (fs.existsSync(filePath)) {
    UI.log(chalk.green(I18N_KEYS.FILE_ALREADY_EXISTS));

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

        const parser = csv
          .parse({
            columns: true,
            delimiter: userSettings[USER_SETTING_KEYS.DELIMITER],
            ltrim: true,
            quote: '"',
            relax_column_count: true,
            rtrim: true,
            skip_lines_with_error: true,
          })
          .on('error', parserError => Logger.error(I18N_KEYS.PARSER_ERROR(parserError)));

        const fileWriter = fs.createWriteStream(
          userSettings[USER_SETTING_KEYS.OUTPUT_PATH],
        );

        UI.log(chalk.cyan(I18N_KEYS.FILE_READING_STARTED));

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
              || (rowKeys.some(rowKey => !INPUT_CSV_HEADERS.includes(rowKey))
                && !parser.isPaused())
            ) {
              const currentDelimiter = UserSettings.getUserSetting(
                USER_SETTING_KEYS.DELIMITER,
              );

              UI.log(`${chalk.red(I18N_KEYS.WRONG_FORMAT_ERROR_HEADER)}
  ${chalk.cyan(`
  ${userSettings[USER_SETTING_KEYS.ISBN]}${currentDelimiter}${
  userSettings[USER_SETTING_KEYS.TITLE]
}${currentDelimiter}${
  userSettings[USER_SETTING_KEYS.AUTHOR]
}${currentDelimiter}${userSettings[USER_SETTING_KEYS.PRICE]}
  ${I18N_KEYS.CSV_FORMAT_EXAMPLE}

${chalk.green(I18N_KEYS.WRONG_FORMAT_INFORMATION)}
        `)}`);
              const destPath = userSettings[USER_SETTING_KEYS.OUTPUT_PATH];

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
                parser,
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
                Logger.error(I18N_KEYS.NO_ISBN_OR_TITLE_ERROR(rowFields));
              }

              if (bookInfo.bookImage) {
                imagePath = downloadImage(
                  bookInfo.bookImage,
                  `${bookInfo.bookName}-${bookInfo.author}`,
                );
              } else {
                Logger.error(I18N_KEYS.NO_BOOK_IMAGE_ERROR(rowFields));
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
                parser,
                recordIndexer >= recordSize,
                fileWriter,
                callback,
              );
            } else {
              Logger.error(I18N_KEYS.INVALID_ISBN_ERROR(rowFields));

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
                parser,
                recordIndexer >= recordSize,
                fileWriter,
                callback,
              );
            }
          });
      }
    });
  } else {
    UI.log(I18N_KEYS.FILE_NOT_EXISTS);

    Logger.error(I18N_KEYS.FILE_NOT_EXISTS);
    callback();
  }
};

export default readAndUpdateFile;
