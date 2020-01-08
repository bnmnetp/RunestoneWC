const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = env => {
    return {
        entry: [
            "./src/shortanswer/shortanswer.js",
            "./src/activecode/acfactory.js",
            "./src/mchoice/mchoice.js"
        ],
        mode: env.MODE,
        devtool: env.MODE === "development" ? "inline-source-map" : "none",
        module: {
            rules: [
                {
                    test: /\.(html)$/,
                    use: {
                        loader: "html-loader",
                        options: {
                            attrs: false
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"]
                }
            ]
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "runestone.js",
            library: "runestone",
            libraryTarget: "umd"
        },
        plugins: [
            new CleanWebpackPlugin(),
            new CopyPlugin([
                {
                    from: "static"
                }
            ]),
            new HtmlWebpackPlugin({
                inject: "head",
                template: "public/index.html"
            })
        ]
    };
};
