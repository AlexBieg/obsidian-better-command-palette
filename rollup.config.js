import typescript from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import webWorkerLoader from "rollup-plugin-web-worker-loader";
import { terser } from "rollup-plugin-terser";

const isProduction = process.env.NODE_ENV === "production";
console.log('isProduction', isProduction);

export default {
	input: "main.ts",
	output: {
		dir: ".",
		sourcemap: isProduction ? null : 'inline',
		format: "cjs",
		exports: "default",
	},
	external: ["obsidian", "path", "fs", "util", "events", "stream", "os"],
	plugins: [
		webWorkerLoader({
			targetPlatform: "browser",
			preserveSource: !isProduction,
			sourcemap: !isProduction,
			inline: true,
			forceInline: true,
			external: ["obsidian"],
		}),
		typescript(),
		nodeResolve({ browser: true }),
		commonjs(),
		(isProduction && terser()),
	],
};
