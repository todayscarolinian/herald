import { config } from '@repo/eslint-config/base';
import globals from 'globals';

export default [
    ...config,
    {
        files: ['scripts/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            sourceType: 'module',
        },
        rules: {
            'no-console': 'off',
        },
    },
];