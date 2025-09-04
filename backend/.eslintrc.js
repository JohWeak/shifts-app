// backend/.eslintrc.js
module.exports = {
    env: {
        node: true,
        commonjs: true, // for require/module.exports
        es2021: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:node/recommended',
        'plugin:promise/recommended',
        'plugin:security/recommended',
        'prettier',
    ],
    plugins: ['node', 'promise', 'security'],
    parserOptions: {
        ecmaVersion: 'latest',
    },
    rules: {
        // === Node.js ===
        'node/no-path-concat': 'error', // no (__dirname and __filename) yes path.join()

        'security/detect-object-injection': 'warn',

        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-process-exit': 'error',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

        'eqeqeq': ['error', 'always'],
        'curly': ['error', 'all'],
    },
};