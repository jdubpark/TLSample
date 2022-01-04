module.exports = {
  env: {
    browser: true,
    es2021: true,
    mocha: true,
    node: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
    'react-app',
    'react-app/jest',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  overrides: [
    {
      files: ['hardhat.config.js'],
      globals: { task: true },
    },
  ],
  rules: {
    semi: [1, 'never'],
    'comma-dangle': [1, 'always-multiline'],
    'import/no-extraneous-dependencies': [1, {
      devDependencies: true, optionalDependencies: false, peerDependencies: false,
    }],
    'no-unused-vars': 'warn',
    'no-plusplus': 'off',
    'no-underscore-dangle': 'off',
    'max-len': [1, { code: 200 }],
    'react/jsx-props-no-spreading': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/interactive-supports-focus': 'off',
  },
}
