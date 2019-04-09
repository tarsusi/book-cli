const I18N_KEYS = {
  FILE_READING_PROGRESS: progress => `Completed ${Math.min(progress, 100)}%`,
  FILE_READING_COMPLETED: 'File reading process completed',
  FILE_ALREADY_EXISTS: 'File exists!',
  FILE_NOT_EXISTS: 'File does not exists!',
  FILE_READING_STARTED: 'File reading process started',
  NO_ISBN_OR_TITLE_ERROR: record => `No ISBN or BookName for record=${record}`,
  NO_BOOK_IMAGE_ERROR: record => `No book image found for record=${record}`,
  INVALID_ISBN_ERROR: record => `The given ISBN is not valid for record=${record}`,
  PARSER_ERROR: parserError => `Parser Error ${parserError}`,
  CSV_FORMAT_EXAMPLE: '1234567890123;Title;Author(s);Price',
  WRONG_FORMAT_ERROR_HEADER: `
                          !!!!!!!
  Oh, it seems you are using wrong CSV format. You should use
  the following CSV file format to get any successful result.
  First line is header, the second line is an example of record.`,
  WRONG_FORMAT_INFORMATION: `
  But do not worry. You can change following settings using changeSetting command:

  delimiter   -   Change CSV values delimiter symbol. Default is comma(,).
  outputPath  -   Destination file for output. Default is 'output.csv'.
  isbn        -   CSV header for ISBN. Default is 'isbn13'.
  title       -   CSV header for title of book. Default is 'title'.
  author      -   CSV header for author of book. Default is 'authors'.
  price       -   CSV header for price of book. Default is 'price'.
`,
};

export default I18N_KEYS;
