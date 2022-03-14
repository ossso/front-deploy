// 转换Windows路径为Linux路径
export const toLinux = (str) => str.replace(/\\\\/g, '/').replace(/\\/g, '/');
export const toWindows = (str) => str.replace(/\//g, '\\\\');

export default {
  toLinux,
  toWindows,
};
