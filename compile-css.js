/*
 * This script minifies the CSS output from Vite's build and generates sourcemaps.
 *
 * Vite builds a complete ogs.css file that includes:
 * - Global styles from src/ogs.css
 * - Component CSS imported directly in TSX files (e.g., import "./NavBar.css")
 *
 * This script then minifies that output with sourcemaps, since Vite doesn't
 * support CSS sourcemaps in production builds as of 2025-01-07.
 */
import fs from "fs";
import postcss from "postcss";
import cssnano from "cssnano";

console.log("");
console.log("Minifying Vite CSS output with sourcemaps...");

// Read the CSS that Vite already built (includes all component CSS from TSX imports)
const css = fs.readFileSync("dist/ogs.css", "utf8");

postcss([cssnano()])
    .process(css, {
        from: "dist/ogs.css",
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
        console.log("Done - output written to dist/ogs.min.css");
    })
    .catch((err) => {
        console.error("PostCSS error:", err);
        process.exit(1);
    });
