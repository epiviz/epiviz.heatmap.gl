import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import pkg from "./package.json";
import OMT from "@surma/rollup-plugin-off-main-thread";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import postcss from "rollup-plugin-postcss";

// import { babel } from "@rollup/plugin-babel";

export default [
  // browser-friendly UMD build
  {
    input: "src/index.js",
    output: {
      //   name: "epiviz.heatmap.gl",
      //   file: pkg.browser,
      dir: "dist",
      format: "esm",
    },
    plugins: [
      resolve(),
      commonjs(),
      OMT(),
      json(),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
        preventAssignment: true,
      }),
      postcss({
        extract: "ehgl.css",
        minimize: true,
      }),
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: "src/index.js",
    external: ["epiviz.gl"],
    output: [
      { file: pkg.main, format: "cjs" },
      //   { file: pkg.module, format: "es" },
    ],
    plugins: [
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
        preventAssignment: true,
      }),
      postcss({
        extract: "ehgl.css",
        minimize: true,
      }),
    ],
  },
];
