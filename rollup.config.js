import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import externals from 'rollup-plugin-node-externals';

import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    plugins: [
      externals({
        packagePath: 'package.json',
        deps: true,
      }),
      resolve(),
      commonjs(),
      typescript({ sourceMap: true }),
    ],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        exports: 'auto',
        sourcemap: true,
      },
    ],
  },
  {
    input: 'src/steps.ts',
    plugins: [
      externals({
        packagePath: 'package.json',
        deps: true,
      }),
      resolve(),
      commonjs(),
      typescript(),
    ],
    output: [
      { file: 'dist/steps.js', format: 'cjs', sourcemap: true },
    ],
  },
];
