const path = require('path');
const webpack = require("webpack");

module.exports = {
	entry: {
        "monaco": "./src/monaco/reexport.ts"
	},
    output: {
		filename: '[name].bundle.js',
		publicPath: 'asset',
        path: path.join(__dirname, "monacobundle"),
        library: "monaco",
        libraryTarget: 'commonjs2',
		module: true,
    },
	experiments: {
		outputModule: true,
	},
    optimization: {
        concatenateModules: true,
        minimize: true
    },
    mode: "development",
    module: {
		rules: [
            {
                test: /\.(woff|ttf|ico|woff2|jpg|jpeg|png|webp|svg|gif)$/i,
                use: [
                    {
                        loader: 'base64-inline-loader'
                    }
                ]
            },
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			}
		]
	},
	plugins: [
		new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1
		})
	]
};