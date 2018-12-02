'use strict';

var path = require('path');
let fs = require('fs');
var webpack = require('webpack');
const pkg = require('./package.json');

const production = process.env.PRODUCTION ? true : false;


let plugins = [];

plugins.push(new webpack.BannerPlugin(
`Copyright (C) 2012-2017  Online-Go.com

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
`));

    /*
plugins.push(
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: function (module) {
            return module.context && module.context.indexOf('node_modules') !== -1;
        }
    })
);
*/

let defines = {
    PRODUCTION: production,
    CLIENT: true,
    SERVER: false,
};


plugins.push(new webpack.DefinePlugin(defines));


module.exports = {
    mode: production ? 'production' : 'development',
    entry: {
        'ogs': './src/main.tsx',
        'pwa': './src/pwa.ts',
    },
    resolve: {
        modules: [
            'src/lib',
            'src/lib/goban',
            'src/components',
            'src/views',
            'src/data',
            'src/compatibility',
            'src',
            'node_modules'
        ],
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
    },
    output: {
        path: __dirname + '/dist',
        filename: production ? '[name].min.js' : '[name].js'
    },
    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
            }
        ]
    },

    performance: {
        maxAssetSize: 1024 * 1024 * 2.5,
        maxEntrypointSize: 1024 * 1024 * 2.5,
    },

    optimization: {
        splitChunks: {
            cacheGroups: {   
                "vendor": {
                    test: /[\\/]node_modules[\\/]/,   // <-- use the test property to specify which deps go here
                    name: "vendor",
                    chunks: "all",
                    priority: -10
                }
            }
        }
    },


    plugins: plugins,

    //devtool: production ? 'source-map' : 'eval-source-map',
    /* NOTE: The default needs to be source-map for the i18n translation stuff to work. Specifically, using eval-source-map makes it impossible for our xgettext-js parser to parse the embedded source. */
    devtool: 'source-map',

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        "swal": "swal", // can't seem to import anyways
    },
};
