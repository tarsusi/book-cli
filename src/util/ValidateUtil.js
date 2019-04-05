import fs from 'fs';

import { IMAGE_DEST_DIR } from '../common/FILE_CONSTANTS';

const ISBN_10_LENGTH = 10;
const ISBN_13_LENGTH = 13;

export const validateISBN = (isbn) => {
  const isbnNumber = isbn.split(/-_/).join('');

  return (
    +isbnNumber
    && (isbnNumber.length === ISBN_10_LENGTH
      || isbnNumber.length === ISBN_13_LENGTH)
  );
};

export const validateCompleteRecord = (isbn, bookName, author, price) => {
  const isComplete = validateISBN(isbn) && !!bookName && !!author && !!price;
  let imageFileExists = false;

  if (fs.existsSync(IMAGE_DEST_DIR)) {
    const imageFiles = fs.readdirSync(IMAGE_DEST_DIR);

    imageFileExists = !!bookName
      && !!author
      && imageFiles.some(imageFile => imageFile.startsWith(`${bookName}-${author}`));
  }

  return isComplete && imageFileExists;
};

export const validateBookName = bookName => !!bookName;
