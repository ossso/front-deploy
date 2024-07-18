module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
  },
};
