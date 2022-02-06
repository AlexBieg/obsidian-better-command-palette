module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    globals: {
        window: true,
    },
    env: {
        node: true,
    },
    plugins: ['@typescript-eslint'],
    extends: ['airbnb-base'],
    ignorePatterns: ['**/*.scss'],
    rules: {
        indent: ['error', 4],
        'import/extensions': 0,
        'class-methods-use-this': 'off',
    },
    overrides: [
        {
            files: ['*.ts'], // Your TypeScript files extension
            // As mentioned in the comments, you should extend TypeScript plugins here,
            // instead of extending them outside the `overrides`.
            // If you don't want to extend any rules, you don't need an `extends` attribute.
            extends: ['airbnb-typescript/base'],

            parserOptions: {
                sourceType: 'module',
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },

            rules: {
                '@typescript-eslint/indent': ['error', 4],
            },
        },
    ],
};
