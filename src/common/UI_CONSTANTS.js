import readAndUpdateFile from '../util/FileReaderUtil';

export const UI_PREFIX = 'book-cli$';

export const UI_COMMANDS = [
  {
    name: 'correct-csv <filePath> [startIndex] [endIndex]',
    explanation: 'Reads a CSV file and fulfill missing data',
    action: (args, callback) => {
      const { filePath } = args;

      readAndUpdateFile(filePath, callback);
    },
  },
];
