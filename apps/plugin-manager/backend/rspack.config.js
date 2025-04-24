const path = require("path");
const { rspack } = require("@rspack/core");

module.exports = {
  entry: {
    main: "./src/index",
  },
  mode: process.env.NODE_ENV === "development" ? "development" : "production",
  target: "async-node",
  devtool: "source-map",
  output: {
    uniqueName: "host",
    publicPath: "/",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    library: { type: "commonjs-module" },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "builtin:swc-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        type: "asset/resource",
        generator: {
          filename: "[name][ext]",
        },
      },
      {
        test: /\.js$/,
        type: "asset/resource",
        generator: {
          filename: "[name][ext]",
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: "../frontend/dist",
          to: "public",
          noErrorOnMissing: true, // Don't error in development when dist doesn't exist
        },
      ],
    }),
    new rspack.container.ModuleFederationPlugin({
      name: "host",
      filename: "remoteEntry.js",
      runtimePlugins: [
        require.resolve("@module-federation/node/runtimePlugin"),
      ],
    }),
  ],
};
