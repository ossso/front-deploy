# 前端内容自动化部署工具  
一键部署构建后的内容到服务器\阿里云OSS\腾讯云COS

## 安装前注意
包内引用了`ssh2`，在Windows环境下使用，最好先安装`node-gyp`，具体安装方法请参考[node-gyp](https://github.com/nodejs/node-gyp)

### 配置概览
```javascript
const deploy = require('@ossso/front-deploy');

deploy({
  dir: '', // 部署内容所在目录
  rule: { // 部署的规则
    prefix: '', // 路径前缀，相对路径
    transfer: {  // 转移部分文件，例如将index.html部署到另外一个位置
      match: 'index.html', // 本地的相对路径
      remotePath: 'index.html', // 远程的绝对路径 = path.join(serverPath,remotePath)
    },
    // ignore 忽略规则
    ignoreRule: '',
  },
  config: {
    deployType: 'oss', // 部署类型 oss | cos | server
    // 阿里云配置
    alioss: {
      // 桶名称
      bucket: '',
      // 区域
      region: '',
      accessKeyId: '',
      accessKeySecret: '',
    },
    // 腾讯云配置 大写开头
    cos: {
      // 桶名称
      Bucket: '',
      // 区域
      Region: '',
      SecretId: '',
      SecretKey: '',
    },
    // 服务器配置
    server: {
      // 主机地址
      host: '',
      // 端口
      port: 22,
      // 账号
      username: 'root',
      // 密码或密钥 二选一
      password: '',
      // 或者为 privateKey
      // privateKey: '',
    },
  },
  callback: {
    deployBefore: (files, tasks) => {
      // 部署前的回调
      // files，扫描到的文件列表
      // tasks，执行任务对象
    },
    deployAfter: (files, tasks) => {
      // 部署后的回调
      // files，扫描到文件列表
      // tasks，执行任务对象
    },
  },
});
```

## 参数说明
### `dir:` 部署内容的目录  
### `rule:` 部署规则  
| 属性 | 值类型 | 默认值 | 说明 |
| ---- | ---- | ---- | ---- |
| **prefix** | `String` | - | 默认前缀路径 |
| **transfer** | `Array/Object` | null | 转移文件部署路径 |
| **ignoreRule** | `String` | - | 忽略文件规则，ignore通用规则，例外：忽略目录后，不会扫描该目录下的指定路径 |  

`transfer`配置说明

| 属性 | 值类型 | 默认值 | 说明 |
| ---- | ---- | ---- | ---- |
| **match** | `String` | - | 匹配的路径名称，相对全名称 |
| **remotePath** | `String` | - | 被转移到的目标路径，绝对全名称 |
| **type** | `String` | 'copy' | 转移类型：`move` \| `copy` move转移后原来的列表不会存在此文件的任务 |
| **deployType** | `String` | - | 可以指定单个文件部署类型，默认原部署类型 |

----------

### `config:` 部署的上传服务配置    

| 属性 | 值类型 | 默认值 | 说明 |
| ---- | ---- | ---- | ---- |
| **deployType** | `String` | 'server' | 部署类型，可选值：`oss` \| `cos` \| `server` |
| **alioss** | `Object` | null | 阿里云OSS的配置，参考配置概览 |
| **cos** | `Object` | null | 腾讯云COS的配置，参考配置概览 |
| **server** | `Object` | null | 服务器的配置，参考配置概览 |  

-----------

### `callback:` 回调函数    

| 属性 | 值类型 | 默认值 | 说明 |
| ---- | ---- | ---- | ---- |
| **deployBefore** | `Function` | null | 部署前回调，支持异步，`files` 扫描到的文件列表，`tasks` 执行任务对象 |
| **deployAfter** | `Function` | null | 部署后回调，支持异步，`files` 扫描到的文件列表，`tasks` 执行任务对象 |

-----------

### VITE，自动部署配置示例
创建一个`deploy.js`
```js
import deploy from '@ossso/front-deploy';

export default () => {
  let outDir;
  return {
    name: 'auto-deploy',
    configResolved(config) {
      // 获取输出目录
      outDir = config.build.outDir;
    },
    closeBundle() {
      deploy({
        dir: outDir,
        rule: {
           // 部署到cdn的路径前缀，这个的路径与vite.config.js中的base相同
          prefix: 'cdn_path_prefix',
          // 如果你的index.html需要部署服务器，这里需要处理一下
          transfer: {
            match: 'index.html',
            remotePath: '/home/wwwroot/demo/index.html',
            deployType: 'server',
          },
        },
        config: {
          // 其他内容的默认部署位置
          deployType: 'oss',
          // 阿里云OSS的配置
          alioss: {
            bucket: '',
            region: '',
            accessKeyId: '',
            accessKeySecret: '',
          },
          // 服务器的配置
          server: {
            host: '',
            port: 22,
            username: 'root',
            password: '',
          },
        },
        callback: {
          // 部署前回调，通常是要处理某个文件或者路径的时候用
          deployBefore(files, tasks) {
            console.log('deployBefore', files, tasks);
          },
          // 部署后回调，通常是要发送通知或者刷新CDN路径
          deployAfter(files, tasks) {
            console.log('deployAfter', files, tasks);
          },
        },
      });
    },
  };
};
```
然后在`vite.config.js`中引入
```js
import deployPlugin from './deploy';

export default defineConfig({
  plugins: [
    // ... 其他配置
    deployPlugin(),
  ],
  ...其他配置
});
```
