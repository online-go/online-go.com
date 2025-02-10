import fs from "fs";
import { minify as html_minifier } from "html-minifier";

let _index = fs.readFileSync("src/index.html", { encoding: "utf-8" });

if (!process.env["OGS_VERSION_HASH"]) {
    console.error("OGS_VERSION_HASH is not set");
    process.exit(1);
}

let index = _index.replace(/[{][{]\s*(\w+)\s*[}][}]/g, (_, parameter) => {
    switch (parameter) {
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
