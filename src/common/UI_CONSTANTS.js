export const UI_PREFIX = 'book-cli$';

export const UI_COMMANDS = [
  {
    name: 'correct-csv <filePath> [startIndex] [endIndex]',
    explanation: 'Reads a CSV file and fulfill missing data',
    action: (_, callback) => callback(), // TODO will be implemented later
  },
];
