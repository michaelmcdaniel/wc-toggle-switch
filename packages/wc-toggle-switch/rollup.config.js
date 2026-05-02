import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default [
  // normal build
  {
    input: "src/wc-toggle-switch.js",
    output: {
      file: "dist/wc-toggle-switch.js",
      format: "es"
    },
    plugins: [resolve()]
  },

  // minified build
  {
    input: "src/wc-toggle-switch.js",
    output: {
      file: "dist/wc-toggle-switch.min.js",
      format: "es"
    },
    plugins: [
      resolve(),
      terser({
        format: { comments: false }
      })
    ]
  }
];
