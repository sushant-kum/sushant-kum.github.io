import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import noSecretsPlugin from 'eslint-plugin-no-secrets';
import preferArrowPlugin from 'eslint-plugin-prefer-arrow';
import reactPlugin from 'eslint-plugin-react';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';

export default tseslint.config(
  {
    ignores: ['node_modules', 'build', 'dist', 'coverage', '.trash', '.claude', '.superpowers'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettierConfig],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.app.json', './tsconfig.node.json'],
          noWarnOnMultipleProjects: true,
        },
      },
      react: {
        version: 'detect',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettierPlugin,
      import: importPlugin,
      jsdoc: jsdocPlugin,
      'no-secrets': noSecretsPlugin,
      'prefer-arrow': preferArrowPlugin,
      react: reactPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,

      // Prettier
      'prettier/prettier': 'error',

      // React Refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Import plugin rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',
      'import/no-named-as-default': 'warn',
      'import/no-named-as-default-member': 'warn',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-absolute-path': 'error',

      // Unused imports plugin (replaces the base/TS no-unused-vars)
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // JSDoc plugin rules
      'jsdoc/check-alignment': 'warn',
      'jsdoc/check-indentation': 'warn',
      'jsdoc/check-param-names': 'warn',
      'jsdoc/check-types': 'warn',
      'jsdoc/require-description': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns': 'off',

      // No secrets plugin
      'no-secrets/no-secrets': ['error', { tolerance: 4.5 }],

      // Prefer arrow plugin
      'prefer-arrow/prefer-arrow-functions': [
        'warn',
        {
          disallowPrototype: true,
          singleReturnOnly: false,
          classPropertiesAllowed: false,
        },
      ],
      'prefer-arrow-callback': 'warn',
      'arrow-body-style': ['warn', 'as-needed'],

      // React plugin rules
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/jsx-filename-extension': ['warn', { extensions: ['.tsx'] }],
      'react/jsx-no-target-blank': 'error',
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
    },
  },
  {
    // Inline SVG brand marks are long path-data strings that trip the
    // entropy-based secret scanner; they are static vector geometry, not secrets.
    files: ['**/BrandIcons.tsx'],
    rules: {
      'no-secrets/no-secrets': 'off',
    },
  },
);
