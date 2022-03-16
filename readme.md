# 前端发布工具  
一键发布内容到服务器\OSS\COS

```javascript
const deply = require('./index');

deply({
  dir: '', // 部署内容所在目录
  rule: { // 部署的规则
    prefix: '', // 路径前缀
    transfer: {  // 转移部分文件，例如将index.html部署到另外一个位置
      match: 'index.html',
      remotePath: 'index.html',
    },
  },
  config: {
    deplyType: 'oss', // 部署类型 oss | server *注：cos开发中
    alioss: {
      bucket: '',
      region: '',
      accessKeyId: '',
      accessKeySecret: '',
    },
    server: {
      host: '',
      port: 22,
      username: 'root',
      password: '', // 或者为 privateKey
    },
  },
});

```
具体文档待完善
