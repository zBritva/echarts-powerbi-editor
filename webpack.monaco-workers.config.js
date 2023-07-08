const path = require('path');
const webpack = require("webpack");

module.exports = {
	entry: {
		'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
		'json.worker': 'monaco-editor/esm/vs/language/json/json.worker.js',
		'css.worker': 'monaco-editor/esm/vs/language/css/css.worker.js',
		'html.worker': 'monaco-editor/esm/vs/language/html/html.worker.js',
		'ts.worker': 'monaco-editor/esm/vs/language/typescript/ts.worker.js'
	},
    output: {
		filename: '[name].bundle.js',
        path: path.join(__dirname, "monacobundle"),
		module: false,
    },
	experiments: {
		outputModule: true,
	},
    optimization: {
        concatenateModules: true,
        minimize: true
    },
    mode: "development",
	plugins: [
		new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1
		})
	]
};