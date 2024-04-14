// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReact from 'eslint-plugin-react';

export default tseslint.config(
    {
        files: ['**/*.{ts,tsx}'],
        ignores: ['dist'],
        plugins: {
            eslintPluginReact,
            eslintPluginReactHooks,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
);