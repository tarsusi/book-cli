# book-cli
A NodeJS cli application that completed missing informations of given Books CSV file.

## Usage

- First of all, the libraries should be installed via npm or yarn.

```
    npm install
```

- To run the application, give the following command:

```
    npm run dev
```

- To build the application, run the following command:

```
    npm run build
```

## CLI Library

In this project, [the vorpal](https://github.com/dthree/vorpal) is used to build a cli interface for user interactions. The available commands are:

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| **help**        | Provides help for a given command.        |
| **correct-csv** | Reads a CSV file and fulfill missing data |
| **exit**        | Exits application.                        |

- The UI related constants can be found in `src/constants/UTIL_CONSTANTS.js`


## CSV Parser

- In this project, a csv file is read by [CSV module](https://csv.js.org/). In CSV file, the headers, stated in `src/constants/FILE_CONSTANTS.js`, are expected.

## Images

- While traversing book rows, for each row the related image is fetched and saved to the `images` folder. This folder destination can be changed in `src/constants/FILE_CONSTANTS.js`.

## Parsers

- The fetch book detailed information, the html pages are parsed. The details about parsed can be found `src/util/ParserUtil.js`. 
- The new parsers can be added to the ParserUtil. For now there are 2 different website parsers.
- To parse html pages, [the cheerio](https://github.com/cheeriojs/cheerio) library is used.

## Logs

- Created Logger class to manage all logging operations. The default log file is set in `src/constants/FILE_CONSTANTS.js` as **ERROR_LOG_FILE** variable.