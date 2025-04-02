// Workaround for PW needs no experimental strip types when using our
// node 23.x.x

import { spawnSync } from "child_process";

const isNode23 = process.version.startsWith("v23");
const baseCommand = "node_modules/playwright/cli.js";
const node23workaround = "--no-experimental-strip-types";

function runPlaywright(args = []) {
    const nodeArgs = isNode23 ? [node23workaround] : [];
    spawnSync("node", [...nodeArgs, baseCommand, "test", ...args], {
        shell: true,
        stdio: "inherit",
    });
}

runPlaywright(process.argv.slice(2));
