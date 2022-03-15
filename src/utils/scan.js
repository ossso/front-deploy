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

export const scanDir = async ({
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
  const dirStat = await stat(dir);
  if (!dirStat || !dirStat.isDirectory()) {
    throw Error(`扫描目录 ${dir} 不合法，无法继续扫描`);
  }
  const scanDirIg = ig || ignore();
  if (!ig && isSet(ignoreRule)) {
    scanDirIg.add(ignoreRule);
  }
  const files = [];
  const children = await readdir(dir);
  // 分析当前目录内容
  await Promise.all(children.map((i) => {
    const item = {
      // 文件名称
      name: i,
      // 完整路径
      path: join(dir, i),
      // 相对位置
      relative: parent,
    };
    // 判定文件类型 与 判定是否为忽略文件目录
    return stat(item.path).then((res) => {
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

export default async (dir, ignoreRule) => scanDir({
  dir,
  ignoreRule,
});
