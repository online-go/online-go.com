"use strict";

// Which backend server would you like to use today? ...
let BACKEND = process.env.OGS_BACKEND || "BETA";
BACKEND = BACKEND.toUpperCase();
//BACKEND = "PRODUCTION";
//BACKEND = "LOCAL";

import { spawn, execSync } from "child_process";
import fs from "fs";
import gulp from "gulp";
import path from "path";
import livereload from "gulp-livereload";
import stylus from "gulp-stylus";
import sourcemaps from "gulp-sourcemaps";
import rename from "gulp-rename";
import pump from "pump";
import autoprefixer from "autoprefixer";
import postcss from "gulp-postcss";
import cssnano from "cssnano";
import inline_svg from "postcss-inline-svg";
import gulpEslint from "gulp-eslint-new";
import { minify as html_minifier } from "html-minifier";

import express from "express";
import body_parser from "body-parser";
import http from "http";
import proxy from "express-http-proxy";
import url from "url";

let ts_sources = ["src/**/*.ts", "src/**/*.tsx", "!src/**/*.test.ts", "!src/**/*.test.tsx"];

gulp.task("watch_dist_js", watch_dist_js);
gulp.task("watch_html", watch_html);
gulp.task("watch_styl", watch_styl);
gulp.task("build_styl", build_styl);
gulp.task("min_styl", min_styl);
gulp.task("livereload-server", livereload_server);
gulp.task("background_webpack", background_webpack);
gulp.task("watch_eslint", watch_eslint);
gulp.task("dev-server", dev_server);
gulp.task("eslint", eslint);
gulp.task("minify-index", minify_index);
gulp.task(
    "default",
    gulp.parallel(
        "dev-server",
        "livereload-server",
        "background_webpack",
        "build_styl",
        "watch_styl",
        "watch_dist_js",
        "watch_html",
        "watch_eslint",
    ),
);

function reload(done) {
    livereload.reload();
    done();
}
function watch_dist_js(done) {
    gulp.watch(["dist/*.js"], reload);
    done();
}
function watch_html(done) {
    gulp.watch(["src/*.html"], reload);
    done();
}
function watch_styl(done) {
    gulp.watch(["src/**/*.styl", "src/*.styl"], build_styl);
    done();
}
function livereload_server(done) {
    livereload.listen(35701);
    done();
}
function watch_eslint(done) {
    gulp.watch(ts_sources, { ignoreInitial: false }, eslint);
    done();
}

function eslint() {
    return gulp
        .src(ts_sources)
        .pipe(gulpEslint({ overrideConfigFile: "eslint.config.mjs" }))
        .pipe(gulpEslint.format())
        .pipe(gulpEslint.failAfterError());
}

function build_styl(done) {
    pump(
        [
            gulp.src("./src/ogs.styl"),
            sourcemaps.init(),
            stylus({
                compress: false,
                "include css": true,
            }),
            postcss([
                autoprefixer({
                    cascade: false,
                }),
                inline_svg(),
                //cssnano(),
            ]),
            sourcemaps.write("."),
            gulp.dest("./dist"),
        ],
        (err) => {
            if (err) {
                console.error(err);
            } else {
                livereload.reload("ogs.css");
            }
            done();
        },
    );
}

function min_styl(done) {
    let version = execSync('git describe --long || echo "min"');
    version = ("" + version).replace(/\s/g, "");
    console.log(version);
    console.info(`Building ogs.${version}.css`);
    pump(
        [
            gulp.src("./src/ogs.styl"),
            sourcemaps.init(),
            stylus({
                compress: false,
                "include css": true,
            }),
            postcss([
                autoprefixer({
                    cascade: false,
                }),
                inline_svg(),
                cssnano(),
            ]),
            rename({ suffix: "." + version }),
            sourcemaps.write("."),
            gulp.dest("./dist"),
        ],
        (err) => {
            if (err) {
                console.error(err);
            } else {
                livereload.reload("ogs.css");
            }
            done();
        },
    );
}

function background_webpack(done) {
    function spawn_webpack() {
        let env = process.env;
        let webpack = spawn("npm", ["run", "webpack-watch"], { stdio: "inherit", shell: true });

        webpack.on("exit", spawn_webpack);
    }
    spawn_webpack();

    done();
}

// This is a pretend OGS backend server that proxies browser requests to the right place for development purposes, depending on the constants set
// at the top of this file...
//  ... the developer points their browser at this server and magic happens...

function dev_server(done) {
    const port = 8080; // this is the port on localhost where the developer points their browser to, to get the backend that this proxies

    let server_url, use_https;

    switch (BACKEND) {
        case "BETA":
            server_url = "https://beta.online-go.com";
            use_https = true;
            break;
        case "PRODUCTION":
            server_url = "https://online-go.com";
            use_https = true;
            break;
        case "LOCAL":
            server_url = "http://localhost:1080";
            use_https = false;
            break;
        default:
            console.error(`unsupported backend: ${BACKEND}`);
            process.exit(1);
    }

    let dev_server = express();
    dev_server.use(body_parser.json());
    dev_server.use(body_parser.text());

    http.createServer(dev_server).listen(port, null, function () {
        console.info(`\n\n#############################################`);
        console.info(`## Development server started on port ${port}`);
        console.info(`##  ( http://localhost:${port} )`);
        console.info(`##  pointing at ${BACKEND} (${server_url})`);
        console.info(`#############################################\n\n`);
        console.info(
            "Join us at https://join.slack.com/t/online-go/shared_invite/zt-2jww58l2v-iwhhBiVsXNxcD9xm74bIKA if you'd like to chat...",
        );
    });

    dev_server.use(express.static("dist"));
    dev_server.use(express.static("assets"));

    // Based on https://github.com/villadora/express-http-proxy/issues/127
    const isMultipartRequest = (req) => {
        const contentTypeHeader = req.headers["content-type"];
        return contentTypeHeader && contentTypeHeader.indexOf("multipart") > -1;
    };

    let proxy_wrapper = (host, options) => (req, res, next) => {
        return proxy(server_url, {
            parseReqBody: !isMultipartRequest(req),
            ...options,
        })(req, res, next);
    };

    let backend_proxy = (prefix) =>
        proxy_wrapper(server_url, {
            https: use_https,
            proxyReqPathResolver: function (req) {
                let path = prefix + url.parse(req.url).path;
                console.log("-->", path);
                return path;
            },
            proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
                return new Promise(function (resolve, reject) {
                    if (!("Content-Type" in srcReq.headers)) {
                        proxyReqOpts.headers["Content-Type"] = "application/json";
                    }
                    resolve(proxyReqOpts);
                });
            },
        });

    dev_server.use("/api", backend_proxy("/api"));
    dev_server.use("/termination-api", backend_proxy("/termination-api"));
    dev_server.use("/merchant", backend_proxy("/merchant"));
    dev_server.use("/billing", backend_proxy("/billing"));
    dev_server.use("/sso", backend_proxy("/sso"));
    dev_server.use("/oauth2", backend_proxy("/oauth2"));
    dev_server.use("/complete", backend_proxy("/complete"));
    dev_server.use("/disconnect", backend_proxy("/disconnect"));
    dev_server.use("/OGSScoreEstimator", backend_proxy("/OGSScoreEstimator"));
    dev_server.use("/oje", backend_proxy("/oje"));
    dev_server.use("/firewall", backend_proxy("/firewall"));
    dev_server.use("/__debug__", backend_proxy("/__debug__"));

    dev_server.get("/locale/*", (req, res) => {
        let options = {
            hostname: "storage.googleapis.com",
            port: 80,
            path: "/ogs-site-files/dev" + req.path,
            method: "GET",
        };

        let req2 = http.request(options, (res2) => {
            res2.setEncoding("utf8");
            let data = "";
            res2.on("data", (chunk) => {
                data += chunk.toString();
            });
            res2.on("end", () => {
                res.setHeader("content-type", "application/javascript");
                res.setHeader("Content-Length", data.length);
                res.status(200).send(data);
            });
        });

        req2.on("error", (e) => {
            res.status(500).send(e.message);
        });

        req2.end();
    });

    dev_server.get("/goban.js", (req, res) => {
        console.info(`GET ${req.path} -> node_modules/goban/build/goban.js`);
        let js = fs.readFileSync("node_modules/goban/build/goban.js", { encoding: "utf-8" });
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Content-Length", js.length);
        res.status(200).send(js);
    });

    dev_server.get("/goban.js.map", (req, res) => {
        console.info(`GET ${req.path} -> node_modules/goban/build/goban.js.map`);
        let js = fs.readFileSync("node_modules/goban/build/goban.js.map", { encoding: "utf-8" });
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Content-Length", js.length);
        res.status(200).send(js);
    });

    /*
    dev_server.get("/index.js.map", (req, res) => {
        let js = fs.readFileSync("node_modules/goban/lib/index.js.map", { encoding: "utf-8" });
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Content-Length", js.length);
        res.status(200).send(js);
    });
    */

    dev_server.get("*", (req, res) => {
        console.info(`GET ${req.path}`);

        if (req.path === "ogs.js") {
            const dist_path = path.join(__dirname, "dist");
            console.error("Failed to locate built ogs.js");
            console.error(`CWD: ${process.cwd()}`);
            console.error(`   ${dist_path} exists?: ${fs.existsSync(dist_path)}`);
            if (fs.existsSync(dist_path)) {
                console.error(`   ${dist_path} contents: `, fs.readdirSync(dist_path));
            }
            res.status(500).send("Failed to locate built ogs.js");
        }

        let _index = fs.readFileSync("src/index.html", { encoding: "utf-8" });
        let supported_languages = JSON.parse(
            fs.readFileSync("i18n/languages.json", { encoding: "utf-8" }),
        );
        let _package_json = JSON.parse(fs.readFileSync("package.json", { encoding: "utf-8" }));

        let index = _index.replace(/[{][{]\s*(\w+)\s*[}][}]/g, (_, parameter) => {
            switch (parameter) {
                case "CDN_SERVICE": {
                    // We run within a docker container on 8080 but are served out of 443 so no
                    // need to specify a port, just use the same hostname.
                    if (req.hostname?.indexOf("uffizzi") >= 0) {
                        return `//${req.hostname}/`;
                    }
                    return `//${req.hostname}:${port}/`;
                }
                case "LIVE_RELOAD": {
                    if (req.hostname?.indexOf("uffizzi") >= 0) {
                        // no need for live reloading on uffizzi
                        return ``;
                    }
                    return `<script async src="//${req.hostname}:35701/livereload.js"></script>`;
                }
                case "MIN":
                    return "";

                case "PAGE_TITLE":
                    return "Play Go at online-go.com!";
                case "PAGE_DESCRIPTION":
                    return "Online-Go.com is the best place to play the game of Go online. Our community supported site is friendly, easy to use, and free, so come join us and play some Go!";
                case "PAGE_KEYWORDS":
                    return "Go, Baduk, Weiqi, OGS, Online-Go.com";
                case "PAGE_LANGUAGE":
                    return getPreferredLanguage(req, supported_languages);

                case "OG_TITLE":
                    return "";
                case "OG_URL":
                    return "";
                case "OG_IMAGE":
                    return "";
                case "OG_DESCRIPTION":
                    return "";
                case "SUPPORTED_LANGUAGES":
                    return JSON.stringify(supported_languages);

                case "AMEX_CLIENT_ID":
                    /* cspell: disable-next-line */
                    return "kvEB9qXE6jpNUv3fPkdbWcPaZ7nQAXyg";
                case "AMEX_ENV":
                    return "qa";

                case "RELEASE":
                    return "";
                case "VERSION":
                    return "";
                case "LANGUAGE_VERSION":
                    return "";
                case "VENDOR_HASH_DOTJS":
                    return "js";
                case "VERSION_DOTJS":
                    return "js";
                case "OGS_VERSION_HASH_DOTJS":
                    return "js";
                case "VERSION_DOTCSS":
                    return "css";
                case "LANGUAGE_VERSION_DOTJS":
                    return "js";
                case "GOBAN_JS": {
                    if (fs.lstatSync("node_modules/goban").isSymbolicLink()) {
                        return `/goban.js`;
                    } else {
                        return `https://cdn.online-go.com/goban/${_package_json.devDependencies.goban.substr(
                            1,
                        )}/goban.js`;
                    }
                }
                case "EXTRA_CONFIG":
                    return `<script>window['websocket_host'] = "${server_url}";</script>`;
            }
            return "{{" + parameter + "}}";
        });

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Content-Length", index.length);
        res.status(200).send(index);
    });

    done();
}

function minify_index(done) {
    let _index = fs.readFileSync("src/index.html", { encoding: "utf-8" });

    let index = _index.replace(/[{][{]\s*(\w+)\s*[}][}]/g, (_, parameter) => {
        switch (parameter) {
            case "VENDOR_HASH_DOTJS":
                return process.env["VENDOR_HASH"] + ".js";
            case "OGS_VERSION_HASH_DOTJS":
                return process.env["OGS_VERSION_HASH"] + ".js";
        }
        return "{{" + parameter + "}}";
    });

    let res = html_minifier(index, {
        minifyJS: true,
        minifyCSS: true,
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true,
        removeComments: true,
    });

    console.log(res);
    done();
}

/* Detect preferred language  */
function isSupportedLanguage(lang, supported_languages) {
    if (!lang) {
        return null;
    }

    lang = lang.toLowerCase();

    if (lang in supported_languages) {
        return lang;
    }

    lang = lang.replace(/-[a-z]+/, "");

    if (lang in supported_languages) {
        return lang;
    }

    return null;
}

function getPreferredLanguage(req, supported_languages) {
    let languages = ["en"];
    try {
        languages = req.headers["accept-language"]
            .split(",")
            .map((s) => s.replace(/;q=.*/, "").trim().toLowerCase());
    } catch (e) {
        console.trace(e);
    }

    try {
        for (let i = 0; i < languages.length; ++i) {
            let lang = isSupportedLanguage(languages[i], supported_languages);
            if (lang) {
                return lang;
            }
        }
    } catch (e) {}

    return "en";
}
