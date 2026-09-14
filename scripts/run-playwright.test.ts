import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const launcher = resolve(__dirname, "run-playwright.js");

test.each([0, 7])("returns Playwright exit status %i and preserves arguments", (status) => {
    const cwd = mkdtempSync(join(tmpdir(), "ogs-playwright-"));
    try {
        mkdirSync(join(cwd, "node_modules/playwright"), { recursive: true });
        writeFileSync(
            join(cwd, "node_modules/playwright/cli.js"),
            `console.log(JSON.stringify(process.argv.slice(2))); process.exit(${status});`,
        );
        const result = spawnSync(process.execPath, [launcher, "--grep", "one|two words"], {
            cwd,
            encoding: "utf8",
        });
        expect(result.status).toBe(status);
        expect(JSON.parse(result.stdout)).toEqual(["test", "--grep", "one|two words"]);
    } finally {
        rmSync(cwd, { recursive: true, force: true });
    }
});

test("fails when Playwright cannot start", () => {
    const cwd = mkdtempSync(join(tmpdir(), "ogs-playwright-"));
    try {
        const result = spawnSync(process.execPath, [launcher], { cwd, encoding: "utf8" });
        expect(result.status).not.toBe(0);
    } finally {
        rmSync(cwd, { recursive: true, force: true });
    }
});
