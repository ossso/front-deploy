/**
 * 腾讯云COS - PUT单个文件对象
 */

import COS from 'cos-nodejs-sdk-v5';
import {
  toLinux,
} from '../utils/path-win-2-linux';

/**
 * 上传文件到COS
 */
async function cosUpload(
  item,
  cosConfig = {},
) {
  const {
    Bucket,
    Region,
    SecretId,
    SecretKey,
  } = cosConfig;
  /**
   * 实例化OSS SDK对象
   */
  const client = new COS({
    SecretId,
    SecretKey,
  });

  return new Promise((resolve, reject) => {
    client.putObject({
      Bucket,
      Region,
      // 保存路径
      Key: toLinux(item.remotePath),
      // 本地路径
      Body: item.path,
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export default cosUpload;
