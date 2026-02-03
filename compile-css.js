import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import postcss from "postcss";
import comment from "postcss-comment";
import atImportGlob from "postcss-import-ext-glob";
import atImport from "postcss-import";
import mixins from "postcss-mixins";
import nested from "postcss-nested";
import simpleVars from "postcss-simple-vars";
import functions from "postcss-functions";
import postcssUrl from "postcss-url";
import inline_svg from "postcss-inline-svg";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import Color from "color";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("");
console.log("Compiling CSS with PostCSS...");

const css = fs.readFileSync("src/ogs.css", "utf8");

const colorFunctions = functions({
    functions: {
        lighten: (color, amount) => {
            try {
                return Color(color)
                    .lighten(parseFloat(amount) / 100)
                    .hex();
            } catch {
                return color;
            }
        },
        darken: (color, amount) => {
            try {
                return Color(color)
                    .darken(parseFloat(amount) / 100)
                    .hex();
            } catch {
                return color;
            }
        },
        desaturate: (color, amount) => {
            try {
                return Color(color)
                    .desaturate(parseFloat(amount) / 100)
                    .hex();
            } catch {
                return color;
            }
        },
        saturate: (color, amount) => {
            try {
                return Color(color)
                    .saturate(parseFloat(amount) / 100)
                    .hex();
            } catch {
                return color;
            }
        },
    },
});

postcss([
    atImportGlob(),
    atImport(),
    mixins(),
    nested(),
    simpleVars(),
    colorFunctions,
    postcssUrl({ url: "inline" }),
    inline_svg({
        paths: [
            path.resolve(__dirname, "assets"),
            path.resolve(__dirname, "src"),
        ],
    }),
    autoprefixer(),
    cssnano(),
])
    .process(css, {
        from: "src/ogs.css",
        to: "dist/ogs.min.css",
        parser: comment,
        map: {
            inline: false,
        },
    })
    .then((result) => {
        fs.writeFileSync("dist/ogs.min.css", result.css);
        if (result.map) {
            fs.writeFileSync("dist/ogs.min.css.map", result.map.toString());
        }
        console.log("Done - output written to dist/ogs.min.css");
    })
    .catch((err) => {
        console.error("PostCSS error:", err);
        process.exit(1);
    });
