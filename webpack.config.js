const path = require("path");

module.exports = {
  entry: "./src/shortanswer/shortanswer.js",
  mode: "development",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "runestone.js",
    library: "runestone",
    libraryTarget: "umd"
  }
};
