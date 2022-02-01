import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import eslint from '@rollup/plugin-eslint';

const isProduction = process.env.NODE_ENV === 'production';
// eslint-disable-next-line
console.log('isProduction', isProduction);

const outputLocation = isProduction ? './dist' : './test-vault/.obsidian/plugins/obsidian-better-command-palette';

export default {
    input: 'src/main.ts',
    output: {
        dir: outputLocation,
        sourcemap: isProduction ? null : 'inline',
        format: 'cjs',
        exports: 'default',
    },
    external: ['obsidian', 'path', 'fs', 'util', 'events', 'stream', 'os'],
    plugins: [
        eslint(),
        copy({
            targets: [
                { src: 'src/styles.css', dest: outputLocation },
                { src: 'manifest.json', dest: outputLocation },
            ],
        }),
        webWorkerLoader({
            targetPlatform: 'browser',
            preserveSource: !isProduction,
            sourcemap: !isProduction,
            inline: true,
            forceInline: true,
            external: ['obsidian'],
        }),
        typescript(),
        nodeResolve({ browser: true }),
        commonjs(),
        isProduction && terser(),
    ],
};
