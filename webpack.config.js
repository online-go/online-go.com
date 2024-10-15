"use strict";

import path from "path";
import webpack from "webpack";
import { fileURLToPath } from "url";
import TerserPlugin from "terser-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import CircularDependencyPlugin from "circular-dependency-plugin";

import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

let plugins = [];
const __dirname = path.dirname(fileURLToPath(import.meta.url));

plugins.push(
    new ForkTsCheckerWebpackPlugin({
        typescript: {
            diagnosticOptions: {
                syntactic: true,
                semantic: true,
                declaration: true,
                global: true,
            },
        },
    }),
);

plugins.push(
    new webpack.BannerPlugin(
        `Copyright (C)  Online-Go.com

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
`,
    ),
);

export default (env, argv) => {
    const production = argv.mode === "production";
    let alias = {
        "@": path.resolve(__dirname, "/src"),
    };

    if (production) {
        console.log("Production build, enabling react profiling");
        alias = {
            "@": path.resolve(__dirname, "/src"),
            "react-dom$": "react-dom/profiling",
            "scheduler/tracing": "scheduler/tracing-profiling",
        };
    }

    plugins.push(
        new CircularDependencyPlugin({
            // LearningHub is because it's all internal and fixing it would involve globbing a lot of the broken out pages together.
            // Player is because PlayerDetails has the Player link in it. We should probably make a lighter weight Player
            // that can be used there instead, but doesn't seem worth the trouble right now as it's an internal thing anyways.
            exclude: /node_modules|LearningHub|Player/,
            failOnError: true,
            allowAsyncCycles: false,
            cwd: process.cwd(),
            onDetected({ module: webpackModuleRecord, paths, compilation }) {
                compilation.errors.push(
                    new Error("Circular dependency found:\n    " + paths.join("\n -> ")),
                );
            },
        }),
    );

    plugins.push(
        new webpack.EnvironmentPlugin({
            NODE_ENV: production ? "production" : "development",
            DEBUG: false,
        }),
    );

    let defines = {
        CLIENT: true,
        SERVER: false,
    };

    plugins.push(new webpack.DefinePlugin(defines));

    if (process.env.ANALYZE) {
        plugins.push(
            new BundleAnalyzerPlugin({
                analyzerPort: 18888,
            }),
        );
    }

    const config = {
        mode: production ? "production" : "development",
        entry: {
            ogs: "./src/main.tsx",
        },
        resolve: {
            modules: ["src/lib", "src/components", "src/views", "src", "node_modules"],
            alias: alias,
            extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
        },
        output: {
            path: __dirname + "/dist",
            filename: production ? "[name].min.js" : "[name].js",
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: ["source-map-loader"],
                    enforce: "pre",
                },
                // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: [
                        // cache is set to true for development in webpack 5 https://webpack.js.org/configuration/cache/
                        // { loader: 'cache-loader' },
                        {
                            loader: "ts-loader",
                            options: {
                                configFile: "tsconfig.json",
                                transpileOnly: true,
                                happyPackMode: true,
                            },
                        },
                    ],
                },
            ],
        },

        performance: {
            maxAssetSize: 1024 * 1024 * 2.5,
            maxEntrypointSize: 1024 * 1024 * 2.5,
        },

        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/, // <-- use the test property to specify which deps go here
                        name: "vendor",
                        chunks: "all",
                        priority: -10,
                    },
                },
            },
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                    terserOptions: {},
                }),
            ],
        },

        plugins: plugins,

        //devtool: production ? 'source-map' : 'eval-source-map',
        /* NOTE: The default needs to be source-map for the i18n translation stuff to work. Specifically, using eval-source-map makes it impossible for our xgettext-js parser to parse the embedded source. */
        devtool: "source-map",

        // When importing a module whose path matches one of the following, just
        // assume a corresponding global variable exists and use that instead.
        // This is important because it allows us to avoid bundling all of our
        // dependencies, which allows browsers to cache those libraries between builds.
        externals: {
            goban: "goban",
        },

        devServer: {
            stats: {
                assets: true,
                children: false,
                chunks: true,
                hash: true,
                modules: true,
                publicPath: true,
                timings: true,
                version: true,
                warnings: true,
            },
        },
    };

    if (!production) {
        config.optimization.removeAvailableModules = false;
        config.optimization.removeEmptyChunks = false;
        config.optimization.splitChunks = false;
    }

    return config;
};
