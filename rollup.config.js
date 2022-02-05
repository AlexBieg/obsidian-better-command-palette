import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import eslint from '@rollup/plugin-eslint';
import scss from 'rollup-plugin-scss';

const isProduction = process.env.NODE_ENV === 'production';
const isLocal = process.env.DEST === 'local';

let outputLocation = './test-vault/.obsidian/plugins/obsidian-better-command-palette';

if (isProduction) {
    outputLocation = './dist';
}

if (isLocal) {
    outputLocation = '.';
}

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
        scss({
            output: `${outputLocation}/styles.css`,
        }),
        eslint(),
        copy({
            targets: [
                ...(!isLocal
                    ? [{ src: 'manifest.json', dest: outputLocation }]
                    : []),
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
