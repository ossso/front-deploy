/**
 * 上传文件到服务器
 */

import scp2 from 'scp2';
import {
  toLinux,
} from '../utils/path-win-2-linux';

async function serverUpload(
  item,
  config = {},
) {
  const {
    port,
    host,
    username,
    password,
    privateKey,
  } = config;
  /**
   * SSH配置
   */
  const ssh = {
    port,
    host,
    username,
  };

  if (privateKey) {
    ssh.privateKey = privateKey;
  } else {
    ssh.password = password;
  }

  /**
   * 注入配置
   */
  scp2.defaults(ssh);

  /**
   * 执行上传
   */
  return new Promise((resolve, reject) => {
    scp2.upload(
      item.path,
      // 远程保存路径
      toLinux(item.remotePath),
      (err) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve();
        }
        scp2.close();
      },
    );
  });
}

export default serverUpload;
