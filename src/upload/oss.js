/**
 * 阿里云OSS - PUT单个文件对象
 */

import OSS from 'ali-oss';
import { join } from 'path';
import { stdout } from 'single-line-log';
import {
  isSet,
} from '@ossso/utils';
import {
  toLinux,
} from '../utils/path-win-2-linux';

const {
  ALIOSS_BUCKET,
  ALIOSS_REGION,
  ALIOSS_ACCESS_KEY_ID,
  ALIOSS_ACCESS_SECRET,
  CLI_UPLOAD_LOG,
} = process.env;

/**
 * 实例化OSS SDK对象
 */
const ossClient = ALIOSS_BUCKET ? new OSS({
  bucket: ALIOSS_BUCKET,
  region: ALIOSS_REGION,
  accessKeyId: ALIOSS_ACCESS_KEY_ID,
  accessKeySecret: ALIOSS_ACCESS_SECRET,
}) : null;

/**
 * 上传文件到OSS
 */
async function ossUpload(item, prefix = '') {
  if (!ossClient) {
    throw Error('OSS 初始化失败');
  }
  const savePath = toLinux(join(isSet(prefix) ? prefix : '', item.current));
  await ossClient.put(savePath, item.local);
  if (CLI_UPLOAD_LOG) {
    stdout(`${item.current}:已部署至OSS:${savePath}\n`);
  }
}

export default ossUpload;
