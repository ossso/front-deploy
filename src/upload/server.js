/**
 * 上传文件到服务器
 */

import path from 'path';
import SftpClient from 'ssh2-sftp-client';
import {
  toLinux,
} from '../utils/path-win-2-linux';

async function serverUpload(
  item,
  sshConfig,
) {
  const localPath = item.path;
  const remotePath = toLinux(item.remotePath);
  const remoteDir = path.dirname(remotePath);

  const sftp = new SftpClient();

  /**
   * 执行上传
   */
  try {
    await sftp.connect(sshConfig);
    // 检查远程目录是否存在，如果不存在则创建
    try {
      await sftp.stat(remoteDir);
    } catch (err) {
      if (err.code === 'ENOENT') {
        // 远程目录不存在，创建目录
        await sftp.mkdir(remoteDir, true); // 参数 true 表示递归创建目录
      } else {
        throw err;
      }
    }
    // 上传文件
    await sftp.put(localPath, remotePath);
    // 关闭SFTP连接
    await sftp.end();
  } catch (err) {
    // 关闭SFTP连接
    await sftp.end();
    throw err;
  }
}

export default serverUpload;
