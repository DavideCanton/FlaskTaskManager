const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./ts/app.ts",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "../static"),
    filename: "app.js",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
    }),
  ],
};
