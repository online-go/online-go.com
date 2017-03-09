'use strict';

console.log(process.env.NODE_PATH)

var path = require('path');
let fs = require('fs');
var webpack = require('webpack');

const production = process.env.PRODUCTION ? true : false;

module.exports = {
    entry: {
        'ogs': './src/main.tsx',
    },
    resolve: {
        modules: [
            'src/lib', 
            'src/lib/goban', 
            'src/components', 
            'src/views', 
            'src', 
            'node_modules'
        ],
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
    },
    output: {
        path: __dirname + '/dist',
        filename: '[name].js'
    },
    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
            { 
                test: /\.tsx?$/, 
                loader: "ts-loader",
                exclude: /node_modules/,
            }
        ]
    },

    performance: {
        maxAssetSize: 1024*1024*2.5,
        maxEntrypointSize: 1024*1024*2.5,
    },

    plugins: [
        new webpack.BannerPlugin(`Copyright (C) 2012-2017  Online-Go.com

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.`
    )
    ],

    //devtool: 'eval',
    devtool: 'source-map',
    //devtool: 'cheap-module-source-map',
    //devtool: 'cheap-source-map',

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "react-router": "ReactRouter",
        "blueimp-md5": "md5",
        "eventemitter3": "EventEmitter",
        "markdown-it": "markdownit",
        "moment": "moment",
        "redux": "Redux",
        "react-redux": "ReactRedux",
        "d3": "d3",

        "swal": "swal", // can't seem to import anytways
    },
};
