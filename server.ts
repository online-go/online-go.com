/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// Which backend server would you like to use today? ...
let BACKEND = process.env.OGS_BACKEND || "BETA";
BACKEND = BACKEND.toUpperCase();
//BACKEND = 'PRODUCTION';
//BACKEND = 'LOCAL';

const port = 8080; // this is the port on localhost where the developer points their browser to, to get the backend that this proxies

let server_url;
let use_https;

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

import express from "express";
import ViteExpress from "vite-express";
//let body_parser = require("body-parser");
import http from "http";
import proxy from "express-http-proxy";
import url from "url";
const dev_server = express();
//dev_server.use(body_parser.json());
//dev_server.use(body_parser.text());

//const server = dev_server.listen(port, null, () => {
//    console.info(`\n\n#############################################`);
//    console.info(`## Development server started on port ${port}`);
//    console.info(`##  ( http://localhost:${port} )`);
//    console.info(`##  pointing at ${BACKEND} (${server_url})`);
//    console.info(`#############################################\n\n`);
//    console.info(
//        "Join us at https://join.slack.com/t/online-go/shared_invite/zt-2jww58l2v-iwhhBiVsXNxcD9xm74bIKA if you'd like to chat...",
//    );
//});

ViteExpress.config({ viteConfigFile: "./vite.config.ts" });
ViteExpress.listen(dev_server, port, () => {
    console.info(`\n\n#############################################`);
    console.info(`## Development server started on port ${port}`);
    console.info(`##  ( http://localhost:${port} )`);
    console.info(`##  pointing at ${BACKEND} (${server_url})`);
    console.info(`#############################################\n\n`);
    console.info(
        "Join us at https://join.slack.com/t/online-go/shared_invite/zt-2jww58l2v-iwhhBiVsXNxcD9xm74bIKA if you'd like to chat...",
    );
});

//ViteExpress.bind(dev_server, server);
dev_server.use(express.static("../dist"));
dev_server.use(express.static("../assets"));

// Based on https://github.com/villadora/express-http-proxy/issues/127
const isMultipartRequest = (req) => {
    const contentTypeHeader = req.headers["content-type"];
    return contentTypeHeader && contentTypeHeader.indexOf("multipart") > -1;
};

const proxy_wrapper = (host, options) => (req, res, next) => {
    return proxy(server_url, {
        parseReqBody: !isMultipartRequest(req),
        ...options,
    })(req, res, next);
};

const backend_proxy = (prefix) =>
    proxy_wrapper(server_url, {
        https: use_https,
        proxyReqPathResolver: function (req) {
            const path = prefix + url.parse(req.url).path;
            console.log("-->", path);
            return path;
        },
        proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
            return new Promise((resolve, reject) => {
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
    const options = {
        hostname: "storage.googleapis.com",
        port: 80,
        path: "/ogs-site-files/dev" + req.path,
        method: "GET",
    };

    const req2 = http.request(options, (res2) => {
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
            const lang = isSupportedLanguage(languages[i], supported_languages);
            if (lang) {
                return lang;
            }
        }
    } catch (e) {}

    return "en";
}
