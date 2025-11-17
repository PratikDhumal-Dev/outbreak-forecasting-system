const js = require('@eslint/js');

module.exports = [
  {
    ignores: ['node_modules/', 'coverage/'],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.js'],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      sourceType: 'commonjs',
      globals: {
        ...js.configs.recommended.languageOptions?.globals,
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': ['warn'],
    },
  },
];

