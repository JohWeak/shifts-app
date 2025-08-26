// .eslintrc.js
module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },

    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
    ],

    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },

    plugins: [
        'react',
        'react-hooks',
    ],

    settings: {
        react: {
            version: 'detect',
        },
    },

    rules: {
        'no-unused-vars': 'warn',

        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',

        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
    },
};