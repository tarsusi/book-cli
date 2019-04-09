import {
  CSV_HEADERS,
  CSV_FILE_DELIMITERS,
  DEST_PATH,
} from '../constants/FILE_CONSTANTS';

export const USER_SETTING_KEYS = {
  DELIMITER: 'DELIMITER',
  OUTPUT_PATH: 'OUTPUT_PATH',
  ISBN: 'ISBN',
  TITLE: 'TITLE',
  AUTHOR: 'AUTHOR',
  PRICE: 'PRICE',
};

class UserSettings {
  constructor() {
    this.settings = {
      [USER_SETTING_KEYS.DELIMITER]: CSV_FILE_DELIMITERS,
      [USER_SETTING_KEYS.OUTPUT_PATH]: DEST_PATH,
      [USER_SETTING_KEYS.ISBN]: CSV_HEADERS.ISBN,
      [USER_SETTING_KEYS.TITLE]: CSV_HEADERS.BOOK_NAME,
      [USER_SETTING_KEYS.AUTHOR]: CSV_HEADERS.AUTHOR,
      [USER_SETTING_KEYS.PRICE]: CSV_HEADERS.PRICE,
    };
  }

  changeUserSetting = (setting, newValue) => {
    this.settings[setting] = newValue;
  };

  getUserSettings = () => this.settings;

  getUserSetting = setting => this.settings[setting];
}

export default new UserSettings();
