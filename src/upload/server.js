/**
 * 上传文件到服务器
 */

import { stdout } from 'single-line-log';
import { defaults, upload, close } from 'scp2';
import {
  isSet,
} from '@ossso/utils';

const {
  SERVER_PORT,
  SERVER_HOST,
  SERVER_USER,
  SERVER_PRIVATE_KEY,
  SERVER_PASS,
  CLI_UPLOAD_LOG,
} = process.env;

function serverUpload(item, prefix = '') {
  /**
   * SSH配置
   */
  const ssh = {
    port: SERVER_PORT,
    host: SERVER_HOST,
    username: SERVER_USER,
  };

  /**
   * 请注意这里的密钥是字符串内容
   */
  if (SERVER_PRIVATE_KEY) {
    ssh.privateKey = SERVER_PRIVATE_KEY;
  } else {
    ssh.password = SERVER_PASS || '';
  }

  /**
   * 注入配置
   */
  defaults(ssh);

  /**
   * 远程保存路径
   */
  const remotePath = (isSet(prefix) ? prefix : '') + item.name;

  /**
   * 执行上传
   */
  return new Promise((resolve) => {
    upload(item.local, remotePath, (err) => {
      if (err) {
        console.error(err);
      } else
      if (CLI_UPLOAD_LOG) {
        stdout(`${item.name}:已部署至服务器:${SERVER_HOST}:${remotePath}\n`);
      }
      close();
      resolve();
    });
  });
}

export default serverUpload;
