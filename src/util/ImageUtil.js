import fs from 'fs';
import requestPromise from 'request-promise';
import path from 'path';

import { IMAGE_DEST_DIR } from '../common/FILE_CONSTANTS';

export const findImageSuffix = (imageUrl) => {
  const imageUrlSeperated = imageUrl.split('.');
  const suffix = imageUrlSeperated.reverse()[0];

  return suffix;
};

export const downloadImage = (imageUrl, fileDest) => {
  const req = requestPromise(imageUrl);

  if (!fs.existsSync(IMAGE_DEST_DIR)) {
    fs.mkdirSync(IMAGE_DEST_DIR);
  }

  const fileName = path.join(IMAGE_DEST_DIR, `${fileDest}.${findImageSuffix(imageUrl)}`);

  req.pipe(fs.createWriteStream(fileName));
};
