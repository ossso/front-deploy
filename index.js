/* eslint-disable */
/**
 * 启动入口
 */
require("@babel/register");

const deploy = require("./src");

module.exports = deploy.default;
