import fs from "fs";
import stylus from "stylus";
import postcss from "postcss";
import atImport from "postcss-import";
import inline_svg from "postcss-inline-svg";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

const style = stylus(fs.readFileSync("src/ogs.styl", "utf8"))
    .set("filename", "src/ogs.styl")
    .set("sourcemap", {
        comment: true,
    });

style.render((err, css) => {
    if (err) {
        console.error(err);
        return;
    }

    postcss([atImport(), inline_svg(), autoprefixer(), cssnano()])
        .process(css, {
            from: "src/ogs.styl",
            to: "dist/ogs.min.css",
            map: {
                inline: false,
            },
        })
        .then((result) => {
            fs.writeFileSync("dist/ogs.min.css", result.css);
            if (result.map) {
                fs.writeFileSync("dist/ogs.min.css.map", result.map.toString());
            }
        });
});
