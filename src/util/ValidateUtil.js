const ISBN_10_LENGTH = 10;
const ISBN_13_LENGTH = 13;

export const validateISBN = (isbn) => {
  const isbnNumber = isbn.split(/-_/).join('');

  return (
    +isbnNumber && (isbnNumber.length === ISBN_10_LENGTH || isbnNumber.length === ISBN_13_LENGTH)
  );
};

export const validateBookName = bookName => !!bookName;
