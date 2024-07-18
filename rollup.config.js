import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeExternals from 'rollup-plugin-node-externals';

export default [
  {
    input: 'index.js',
    output: [
      {
        file: 'dist/index.mjs',
        format: 'es',
      },
      {
        file: 'dist/index.cjs',
        format: 'cjs',
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      // babel(),
      json(),
      nodeExternals(),
    ],
  },
];
