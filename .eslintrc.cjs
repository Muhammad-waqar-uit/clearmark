/** ESLint configuration for Clearmark (React 18 JSX runtime + TypeScript). */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    webextensions: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react', '@typescript-eslint'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // TypeScript already checks these; the core rules misfire on types and globals.
    'no-undef': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
  },
  overrides: [
    {
      // React components return JSX, so the return type is inferred rather than annotated.
      files: ['*.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    {
      files: ['tests/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    {
      // Hooks return inferred object shapes; annotating them adds noise, not safety.
      files: ['**/use*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
  ],
  // .js files here are stale build artifacts alongside the .ts sources (see
  // .gitignore); the real sources are typed and already covered by the rules.
  ignorePatterns: ['dist', 'node_modules', 'scripts', 'public', '**/*.js'],
}
