/**
 * 扫描目录 获取文件列表
 */

import {
  readdir,
  stat,
} from 'fs/promises';
import {
  join,
} from 'path';
import ignore from 'ignore';
import {
  isSet,
} from '@ossso/utils';

export const scan = async ({
  // 扫描目录
  scanDir = '',
  // 相对目录的父级目录
  parent = '',
  // 列表
  list = [],
  // ignore对象
  ig = null,
  // 忽略规则
  ignoreRule = null,
}) => {
  const dirStat = await stat(scanDir);
  if (!dirStat || !dirStat.isDirectory()) {
    throw Error(`扫描目录 ${scanDir} 不合法，无法继续扫描`);
  }
  const scanDirIgnore = ig || ignore();
  if (!ig && isSet(ignoreRule)) {
    scanDirIgnore.add(ignoreRule);
  }
  const files = [];
  const children = await readdir(scanDir);
  // 分析当前目录内容
  await Promise.all(children.map((i) => {
    const item = {
      // 文件名称
      name: i,
      // 完整路径
      path: join(scanDir, i),
      // 相对位置
      relative: parent,
    };
    // 判定文件类型 与 判定是否为忽略文件目录
    return stat(item.path).then((res) => {
      item.isFile = res.isFile();
      item.isDirectory = res.isDirectory();
      // 是否为忽略文件或目录
      item.ignore = (() => {
        const itemPath = item.isDirectory ? `${item.name}/` : item.name;
        return scanDirIgnore.ignores(itemPath);
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
    return scan({
      scanDir: path,
      parent: [
        parent,
        name,
      ].filter((o) => o).join('/'),
      list,
      ig: scanDirIgnore,
    });
  }));
  list.push(...files);
  return list;
};

export default async (scanDir, ignoreRule) => scan({
  scanDir,
  ignoreRule,
});
