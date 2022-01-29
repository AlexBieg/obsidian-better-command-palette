import typescript from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import webWorkerLoader from "rollup-plugin-web-worker-loader";

export default {
	input: "main.ts",
	output: {
		dir: ".",
		sourcemap: "inline",
		format: "cjs",
		exports: "default",
	},
	external: ["obsidian", "path", "fs", "util", "events", "stream", "os"],
	plugins: [
		webWorkerLoader({
			targetPlatform: "browser",
			preserveSource: true,
			sourcemap: true,
			inline: true,
			forceInline: true,
			external: ["obsidian"],
		}),
		typescript(),
		nodeResolve({ browser: true }),
		commonjs(),
	],
};
