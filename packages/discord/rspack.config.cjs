const path = require("path");
const { rspack } = require("@rspack/core");
const pkg = require("./package.json");
const { getNormalizedRemoteName } = require("@curatedotfun/utils");

module.exports = {
  entry: "./src/index",
  mode: process.env.NODE_ENV === "development" ? "development" : "production",
  target: "node",
  devtool: "source-map",

  // ✅ Prevent bundling of Node.js built-ins like zlib
  externals: {
    zlib: "commonjs zlib",
    "discord.js": "commonjs discord.js",
  },

  output: {
    uniqueName: getNormalizedRemoteName(pkg.name),
    publicPath: "auto",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    library: { type: "commonjs-module" },
  },

  devServer: {
    static: path.join(__dirname, "dist"),
    hot: true,
    port: 3012,
    devMiddleware: {
      writeToDisk: true,
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "builtin:swc-loader",
        exclude: /node_modules/,
      },
    ],
  },

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      // ✅ Optional: Disable native modules not available in browser or redundant
      "zlib-sync": false,
      "bufferutil": false,
      "utf-8-validate": false,
    },
  },

  plugins: [
    new rspack.container.ModuleFederationPlugin({
      name: getNormalizedRemoteName(pkg.name),
      filename: "remoteEntry.js",
      runtimePlugins: [
        require.resolve("@module-federation/node/runtimePlugin"),
      ],
      library: { type: "commonjs-module" },
      exposes: {
        "./plugin": "./src/index.ts",
      },
      shared: {
        "@curatedotfun/types": { singleton: true, eager: false },
        "discord.js": { singleton: true, eager: false },
      },
    }),
  ],
};
