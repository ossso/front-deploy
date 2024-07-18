'use strict';

var path = require('node:path');
var utils = require('@ossso/utils');
var chalk = require('chalk');
var ProgressBar = require('progress');
var COS = require('cos-nodejs-sdk-v5');
var OSS = require('ali-oss');
var SftpClient = require('ssh2-sftp-client');
var promises = require('node:fs/promises');
var ignore = require('ignore');

// 转换Windows路径为Linux路径
const toLinux = (str) => str.replace(/\\\\/g, '/').replace(/\\/g, '/');

/**
 * 腾讯云COS - PUT单个文件对象
 */


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

/**
 * 阿里云OSS - PUT单个文件对象
 */


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

/**
 * 上传文件到服务器
 */


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

/**
 * 扫描目录 获取文件列表
 */


const scanDir = async ({
  // 扫描目录
  dir = '',
  // 相对目录的父级目录
  parent = '',
  // 列表
  list = [],
  // ignore对象
  ig = null,
  // 忽略规则
  ignoreRule = null,
}, level = 0) => {
  const dirStat = await promises.stat(dir);
  if (!dirStat || !dirStat.isDirectory()) {
    throw Error(`扫描目录 ${dir} 不合法，无法继续扫描`);
  }
  const scanDirIg = ig || ignore();
  if (!ig && utils.isSet(ignoreRule)) {
    scanDirIg.add(ignoreRule);
  }
  const files = [];
  const children = await promises.readdir(dir);
  // 分析当前目录内容
  await Promise.all(children.map((i) => {
    const item = {
      // 文件名称
      name: i,
      // 完整路径
      path: path.join(dir, i),
      // 相对位置
      relative: parent,
      level,
    };
    // 判定文件类型 与 判定是否为忽略文件目录
    return promises.stat(item.path).then((res) => {
      item.isFile = res.isFile();
      item.isDirectory = res.isDirectory();
      // 是否为忽略文件或目录
      item.ignore = (() => {
        const relative = [
          parent,
          item.name,
        ].filter((o) => o).join('/');
        return scanDirIg.ignores(item.isDirectory ? `${relative}/` : relative);
      })();
    }).finally(() => {
      // 忽略对象不push到数组中
      if (!item.ignore) {
        files.push(item);
      }
    });
  }));
  // 扫描子目录
  await Promise.all(files.filter((i) => i.isDirectory).map((i) => {
    const {
      name,
      path,
    } = i;
    return scanDir({
      dir: path,
      parent: [
        parent,
        name,
      ].filter((o) => o).join('/'),
      list,
      ig: scanDirIg,
    }, level + 1);
  }));
  list.push(...files);
  list.sort((a, b) => a.level - b.level);
  return list;
};

var scan = async (dir, ignoreRule) => scanDir({
  dir,
  ignoreRule,
});

const deploy = async ({
  // 上传目录
  dir,
  // 规则
  rule,
  config,
  callback,
}) => {
  const {
    deployBefore,
    deployAfter,
  } = callback || {};
  const startTime = Date.now();
  console.log(chalk.white(` 正在扫描目录[${dir}] `));
  const {
    deployType = 'server',
    alioss,
    cos,
    server,
  } = utils.isObject(config) ? config : {};
  const tasks = {
    server: [],
    oss: [],
    cos: [],
  };
  const files = await scan(dir, rule?.ignoreRule);

  // 部分内容修改相对位置
  const transferToTasks = (transferItem) => {
    const itemIndex = files.findIndex((f) => {
      const path = [f.relative, f.name].filter((o) => o).join('/');
      return path === transferItem.match;
    });
    if (itemIndex > -1) {
      const item = transferItem.type === 'move' ? files.splice(itemIndex, 1) : files[itemIndex];
      tasks[transferItem.deployType ?? deployType].push({
        path: item.path,
        remotePath: transferItem.remotePath,
      });
    }
  };

  if (Array.isArray(rule.transfer)) {
    rule.transfer.forEach((i) => transferToTasks(i));
  } else
  if (utils.isObject(rule.transfer)) {
    transferToTasks(rule.transfer);
  }

  files.forEach((i) => {
    if (i.isFile) {
      tasks[deployType].push({
        path: i.path,
        remotePath: path.join(rule.prefix ?? '', i.relative, i.name),
      });
    }
  });

  const total = tasks.oss.length + tasks.cos.length + tasks.server.length;
  console.log(chalk.yellow.bold(' 扫描完成', `${Date.now() - startTime}ms`));
  const bar = new ProgressBar(' 部署上传 :bar[:percent][:current/:total] 耗时:elapseds 预计剩余:eta', {
    complete: '>',
    incomplete: '-',
    total,
    width: Math.min(total * 2, 30),
  });

  if (typeof deployBefore === 'function') {
    await deployBefore(files, tasks, transferToTasks);
  }
  try {
    // OSS上传
    if (tasks.oss.length) {
      await Promise.all(
        tasks.oss.map((i) => ossUpload(i, alioss).then(() => bar.tick())),
      );
    }
    // COS上传
    if (tasks.cos.length) {
      await Promise.all(
        tasks.cos.map((i) => cosUpload(i, cos).then(() => bar.tick())),
      );
    }
    // 服务器上传
    let scp2 = null;
    for (let i = 0; i < tasks.server.length; i += 1) {
      const item = tasks.server[i];
      // eslint-disable-next-line no-await-in-loop
      scp2 = await serverUpload(item, server).then((res) => {
        bar.tick();
        return res;
      });
      if (scp2) {
        scp2?.close();
      }
    }
  } catch (error) {
    console.log(chalk.bgRed(' 部署异常 '));
    throw error;
  }
  if (typeof deployAfter === 'function') {
    await deployAfter(files, tasks);
  }
  console.log(chalk.bgBlue(' 部署完成 '));
};

module.exports = deploy;
