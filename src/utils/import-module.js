/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */

/**
 * Node环境下的Module导入工具
 *
 * 一键导入指定目录下的命名化模块
 */

import fs from 'fs';
import path from 'path';

export default (dir) => {
  const modules = {};

  fs.readdirSync(dir)
    .map((i) => path.parse(i))
    .filter((file) => {
      const {
        base,
        ext,
      } = file;
      return ext === '.js' && base !== 'index.js';
    })
    .forEach((file) => {
      const mod = require(path.join(dir, file.base));
      let exp = null;
      if (mod.default) {
        exp = mod.default;
      } else
      if (mod[file.name]) {
        exp = mod[file.name];
      } else {
        exp = mod;
      }

      Object.keys(mod).forEach((i) => {
        if (i !== 'default') {
          exp[i] = mod[i];
        }
      });

      modules[file.name] = exp;
    });

  return modules;
};
