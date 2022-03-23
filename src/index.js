import { join } from 'path';
import { isObject } from '@ossso/utils';
import chalk from 'chalk';
import ProgressBar from 'progress';
import {
  oss as ossUpload,
  server as serverUpload,
} from './upload/index';
import scan from './utils/scan';

const deploy = async ({
  // 上传目录
  dir,
  // 规则
  rule,
  config,
}) => {
  const startTime = Date.now();
  console.log(chalk.white(` 正则扫描目录[${dir}] `));
  const {
    deployType = 'server',
    alioss,
    server,
  } = isObject(config) ? config : {};
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
  if (isObject(rule.transfer)) {
    transferToTasks(rule.transfer);
  }

  files.forEach((i) => {
    if (i.isFile) {
      tasks[deployType].push({
        path: i.path,
        remotePath: join(rule.prefix ?? '', i.relative, i.name),
      });
    }
  });

  console.log(chalk.yellow.bold(' 扫描完成', `${Date.now() - startTime}ms`));
  const total = tasks.oss.length + tasks.cos.length + tasks.server.length;
  const bar = new ProgressBar(' 部署上传 :bar[:percent] 耗时:elapseds ', {
    complete: '>',
    incomplete: '-',
    total,
    width: Math.min(total * 2, 30),
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
  console.log(chalk.bgBlue(' 部署完成 '));
};

export default deploy;
