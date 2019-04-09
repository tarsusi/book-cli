import readAndUpdateFile from '../util/FileReaderUtil';
import UserSettings, { USER_SETTING_KEYS } from '../settings/UserSettings';

export const UI_PREFIX = 'book-cli$';

export const UI_COMMANDS = [
  {
    name: 'correct-csv <filePath> [startIndex] [endIndex]',
    explanation: 'Reads a CSV file and fulfill missing data',
    action: (args, callback) => {
      const { filePath, startIndex, endIndex } = args;

      readAndUpdateFile(filePath, startIndex, endIndex, callback);
    },
  },
  {
    name: 'changeUserSettings',
    explanation:
      'Change some predefined settings. See options `changeUserSetings --help`',
    options: [
      {
        name: '--delimiter [delimiter]',
        explanation: 'CSV record value separator.',
      },
      {
        name: '--outputPath [path]',
        explanation: 'Path destination for output file.',
      },
      {
        name: '--isbn [isbn]',
        explanation: 'CSV header value of ISBN.',
      },
      {
        name: '--title [title]',
        explanation: 'CSV header value of book title.',
      },
      {
        name: '--author [author]',
        explanation: 'CSV header value of book author(s).',
      },
      {
        name: '--price [price]',
        explanation: 'CSV header value of book price.',
      },
    ],
    action: (args, callback) => {
      const settingKeys = Object.keys(args.options);

      const userSettings = [
        { name: 'delimiter', key: USER_SETTING_KEYS.DELIMITER },
        { name: 'outputPath', key: USER_SETTING_KEYS.OUTPUT_PATH },
        { name: 'isbn', key: USER_SETTING_KEYS.ISBN },
        { name: 'title', key: USER_SETTING_KEYS.TITLE },
        { name: 'author', key: USER_SETTING_KEYS.AUTHOR },
        { name: 'price', key: USER_SETTING_KEYS.PRICE },
      ];

      userSettings.forEach((userSetting) => {
        if (
          settingKeys.includes(userSetting.name)
          && typeof args.options[userSetting.name]
        ) {
          UserSettings.changeUserSetting(
            userSetting.key,
            args.options[userSetting.name],
          );
        }
      });

      callback();
    },
  },
];
