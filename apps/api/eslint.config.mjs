import eslint from '@eslint/js';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  {
    ignores: ['eslint.config.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
];
