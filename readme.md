# 前端发布工具  
一键发布内容到服务器\OSS\COS

### 配置概览
```javascript
const deploy = require('./index');

deploy({
  dir: '', // 部署内容所在目录
  rule: { // 部署的规则
    prefix: '', // 路径前缀
    transfer: {  // 转移部分文件，例如将index.html部署到另外一个位置
      match: 'index.html',
      remotePath: 'index.html',
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
      // 密码或密钥
      password: '', // 或者为 privateKey
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
| **ignoreRule** | `String` | - | 忽略文件规则，ignore通用规则，例外：忽略目录后，不会扫描该目录下的指定路径，有需求的请用transfer代替 |
`transfer`配置说明

| 属性 | 值类型 | 默认值 | 说明 |
| ---- | ---- | ---- | ---- |
| **match** | `String` | - | 匹配的路径名称，相对全名称 |
| **remotePath** | `String` | - | 被转移到的目标路径，绝对全名称 |
| **deployType** | `String` | - | 可以指定单个文件部署类型，默认原部署类型 |
### `config:` 部署的上传服务配置    

| 属性 | 值类型 | 默认值 | 说明 |
| ---- | ---- | ---- | ---- |
| **deployType** | `String` | 'server' | 部署类型，可选值：`oss` \| `cos` \| `server` |
| **alioss** | `Object` | null | 阿里云OSS的配置，参考配置概览 |
| **cos** | `Object` | null | 腾讯云COS的配置，参考配置概览 |
| **server** | `Object` | null | 服务器的配置，参考配置概览 |
