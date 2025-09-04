// frontend/.eslintrc.js
module.exports = {
    extends: [
        'react-app',
        'react-app/jest',
        'prettier',
    ],

    rules: {
        'react/react-in-jsx-scope': 'off',
        'react-hooks/exhaustive-deps': 'warn',
    },
};