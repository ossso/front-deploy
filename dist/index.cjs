'use strict';

var path = require('path');
var utils = require('@ossso/utils');
var chalk = require('chalk');
var ProgressBar = require('progress');
var OSS = require('ali-oss');
var scp2 = require('scp2');
var promises = require('fs/promises');
var ignore = require('ignore');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var ProgressBar__default = /*#__PURE__*/_interopDefaultLegacy(ProgressBar);
var OSS__default = /*#__PURE__*/_interopDefaultLegacy(OSS);
var scp2__default = /*#__PURE__*/_interopDefaultLegacy(scp2);
var ignore__default = /*#__PURE__*/_interopDefaultLegacy(ignore);

// 转换Windows路径为Linux路径
const toLinux = (str) => str.replace(/\\\\/g, '/').replace(/\\/g, '/');

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
  const ossClient = new OSS__default["default"]({
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
  scp2__default["default"].defaults(ssh);

  /**
   * 执行上传
   */
  return new Promise((resolve, reject) => {
    scp2__default["default"].upload(
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
        scp2__default["default"].close();
      },
    );
  });
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
}) => {
  const dirStat = await promises.stat(dir);
  if (!dirStat || !dirStat.isDirectory()) {
    throw Error(`扫描目录 ${dir} 不合法，无法继续扫描`);
  }
  const scanDirIg = ig || ignore__default["default"]();
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
    });
  }));
  list.push(...files);
  return list;
};

var scan = async (dir, ignoreRule) => scanDir({
  dir,
  ignoreRule,
});

const deply = async ({
  // 上传目录
  dir,
  // 规则
  rule,
  config,
}) => {
  const startTime = Date.now();
  console.log(chalk__default["default"].white(` 正则扫描目录[${dir}] `));
  const {
    deplyType = 'server',
    alioss,
    server,
  } = utils.isObject(config) ? config : {};
  const tasks = {
    server: [],
    oss: [],
    cos: [],
  };
  const files = await scan(dir);

  // 部分内容修改相对位置
  const transferToTasks = (transferItem) => {
    const itemIndex = files.findIndex((f) => {
      const path = [f.relative, f.name].filter((o) => o).join('/');
      return path === rule.transfer.match;
    });
    if (itemIndex > -1) {
      const item = transferItem.type === 'move' ? files.splice(itemIndex, 1) : files[itemIndex];
      tasks[transferItem.deplyType ?? deplyType].push({
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
      tasks[deplyType].push({
        path: i.path,
        remotePath: path.join(rule.prefix ?? '', i.relative, i.name),
      });
    }
  });

  console.log(chalk__default["default"].yellow.bold(' 扫描完成', `${Date.now() - startTime}ms`));
  const bar = new ProgressBar__default["default"](' 部署上传 :bar[:percent] 耗时:elapseds ', {
    complete: '>',
    incomplete: '-',
    total: tasks.length,
    width: Math.min(tasks.length * 2, 30),
  });

  // OSS上传
  await Promise.all(tasks.oss.map((i) => ossUpload(i, alioss).then(() => bar.tick())));
  // COS TODO
  // 服务端上传
  for (let i = 0; i < tasks.server.length; i += 1) {
    const item = tasks.server[i];
    // eslint-disable-next-line no-await-in-loop
    await serverUpload(item, server).then(() => bar.tick());
  }
  console.log(chalk__default["default"].bgBlue(' 部署完成 '));
};

module.exports = deply;
