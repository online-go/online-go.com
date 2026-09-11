// Workaround for PW needs no experimental strip types when using our
// node 23.x.x

import { spawnSync } from "child_process";

const isNode23 = process.version.startsWith("v23");
const baseCommand = "node_modules/playwright/cli.js";
const node23workaround = "--no-experimental-strip-types";

function runPlaywright(args = []) {
    const nodeArgs = isNode23 ? [node23workaround] : [];
    const result = spawnSync(process.execPath, [...nodeArgs, baseCommand, "test", ...args], {
        shell: false, // Must be false to prevent shell interpretation of grep patterns with pipes
        stdio: "inherit",
    });
    if (result.error) {
        console.error(result.error.message);
    }
    process.exitCode = result.status ?? 1;
}

runPlaywright(process.argv.slice(2));
