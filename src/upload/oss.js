/**
 * 阿里云OSS - PUT单个文件对象
 */

import OSS from 'ali-oss';
import {
  toLinux,
} from '../utils/path-win-2-linux';

/**
 * 上传文件到OSS
 */
async function ossUpload(
  item,
  ossConfig = {},
) {
  const {
    bucket,
    region,
    accessKeyId,
    accessKeySecret,
  } = ossConfig;
  /**
   * 实例化OSS SDK对象
   */
  const ossClient = new OSS({
    bucket,
    region,
    accessKeyId,
    accessKeySecret,
  });

  return ossClient.put(
    // 保存路径
    toLinux(item.remotePath),
    // 本地路径
    item.path,
  );
}

export default ossUpload;
