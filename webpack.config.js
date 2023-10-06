const path = require('path');
const fs = require("fs");

// werbpack plugin
const webpack = require("webpack");
const PowerBICustomVisualsWebpackPlugin = require('powerbi-visuals-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const Visualizer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');

// api configuration
const powerbiApi = require("powerbi-visuals-api");

// visual configuration json path
const pbivizPath = "./pbiviz.json";
const pbivizFile = require(path.join(__dirname, pbivizPath));

// the visual capabilities content
const capabilitiesPath = "./capabilities.json";
const capabilitiesFile = require(path.join(__dirname, capabilitiesPath));

const pluginLocation = './.tmp/precompile/visualPlugin.ts'; // path to visual plugin file, the file generates by the plugin

// string resources
const resourcesFolder = path.join(".", "stringResources");
const localizationFolders = fs.existsSync(resourcesFolder) && fs.readdirSync(resourcesFolder);
const statsLocation = "../../webpack.statistics.html";

const MONACO_DIR = path.resolve(__dirname, './node_modules/monaco-editor');

// babel options to support IE11
let babelOptions = {
    "presets": [
        [
            require.resolve('@babel/preset-env'),
            {
                useBuiltIns: "entry",
                corejs: 3,
                modules: false
            }
        ],
        [
            require.resolve('@babel/preset-react')
        ],
    ],
    plugins: [
        [
            require.resolve('babel-plugin-module-resolver'),
            {
                root: ['./'],
            },
        ],
    ],
    sourceType: "unambiguous", // tell to babel that the project can contains different module types, not only es2015 modules
    cacheDirectory: path.join(".tmp", "babelCache") // path for chace files
};

module.exports = {
    entry: {
        "visual": pluginLocation
    },
    output: {
        publicPath: '/assets',
        filename: '[name].js',
        path: path.join(__dirname, "/.tmp", "drop"),
        library: pbivizFile.visual.guid,
        libraryTarget: 'var',
    },
    optimization: {
        concatenateModules: true,
        minimize: true // enable minimization for create *.pbiviz file less than 2 Mb, can be disabled for dev mode
    },
    devtool: 'source-map',
    mode: "development",
    module: {
        rules: [
            {
                parser: {
                    amd: false
                }
            },
            {test: /webpack-dev-server\\client/, loader: "null-loader"},
            {test: /\\monacobundle/, loader: "raw-loader", exclude: /monaco.bundle.js/},
            {
                test: /(\.ts)x|\.ts$/,
                use: [
                    {
                        loader: require.resolve('babel-loader'),
                        options: {
                            presets: ['@babel/react', '@babel/env'],
                            plugins: [
                                [
                                    require.resolve('babel-plugin-module-resolver'),
                                    {
                                        root: ['./'],
                                        alias: {
                                        },
                                    },
                                ],
                            ],
                        },
                    },
                    {
                        loader: require.resolve('ts-loader'),
                        options: {
                            transpileOnly: false,
                            experimentalWatchApi: false,
                        }
                    }
                ],
                exclude: [
                    /node_modules/,
                    /worker\.bundle\.js$/
                ],
                include: /powerbi-visuals-|src|precompile\\visualPlugin.ts/,
            },
            {
                test: /(\.js)x|\.js$/,
                use: [
                    {
                        loader: require.resolve('babel-loader'),
                        options: babelOptions
                    }
                ],
                exclude: [
                    /node_modules/,
                    /worker\.bundle\.js$/
                ]
            },
            {
                test: /\.json$/,
                loader: require.resolve('json-loader'),
                type: "javascript/auto"
            },
            {
                test: /\.(css|scss)?$/,
                include: [MONACO_DIR, path.resolve(__dirname, 'style/')],
                use: [
                    require.resolve('style-loader'),
                    require.resolve('css-loader'),
                    require.resolve('sass-loader')
                ],
            },
            {
                test: /\.(woff|ttf|ico|woff2|jpg|jpeg|png|webp|svg|gif)$/i,
                use: [
                    {
                        loader: 'base64-inline-loader'
                    }
                ],
                type: 'javascript/auto'
            },
        ]
    },
    resolveLoader: {
        alias: {
            'blob-url-loader': path.join(__dirname, './loaders/blobUrl.js'),
            'compile-url-loader': path.join(__dirname, './loaders/compile.js')
          },
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.css'],
        alias: {
        },
    },
    devServer: {
        static: false,
        compress: true,
        port: 8080, // dev server port
        hot: false,
        liveReload: false,
        https: {
        },
        headers: {
            "access-control-allow-origin": "*",
            "cache-control": "public, max-age=0"
        },
    },
    externals: {
        "powerbi-visuals-api": 'null',
        "fakeDefine": 'false',
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "visual.css",
            chunkFilename: "[id].css"
        }),
        new Visualizer({
            reportFilename: statsLocation,
            openAnalyzer: false,
            analyzerMode: `static`
        }),
        // visual plugin regenerates with the visual source, but it does not require relaunching dev server
        new webpack.WatchIgnorePlugin({
            paths: [
                path.join(__dirname, pluginLocation),
                "./.tmp/**/*.*"
            ]
        }),
        // custom visuals plugin instance with options
        new PowerBICustomVisualsWebpackPlugin({
            ...pbivizFile,
            compression: 9,
            capabilities: capabilitiesFile,
            stringResources: localizationFolders && localizationFolders.map(localization => path.join(
                resourcesFolder,
                localization,
                "resources.resjson"
            )),
            apiVersion: powerbiApi.version,
            capabilitiesSchema: powerbiApi.schemas.capabilities,
            pbivizSchema: powerbiApi.schemas.pbiviz,
            stringResourcesSchema: powerbiApi.schemas.stringResources,
            dependenciesSchema: powerbiApi.schemas.dependencies,
            devMode: false,
            generatePbiviz: true,
            generateResources: true,
            modules: true,
            visualSourceLocation: "../../src/visual",
            pluginLocation: pluginLocation,
            packageOutPath: path.join(__dirname, "dist")
        }),
        new ExtraWatchWebpackPlugin({
            files: [
                pbivizPath,
                capabilitiesPath
            ]
        }),
        new webpack.ProvidePlugin({
            define: 'fakeDefine',
        })
    ]
};