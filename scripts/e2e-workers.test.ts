import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const selector = join(__dirname, "e2e-workers.js");
const gib = 1024 ** 3;

test.each([
    { host: 8, expected: 2 },
    { host: 15.4, expected: 2 },
    { host: 16, expected: 2 },
    { host: 16.1, expected: 6 },
    { host: 24, expected: 6 },
    { host: 31, expected: 6 },
    { host: 31.3, expected: 8 },
    { host: 32, expected: 8 },
    { host: 40, expected: 8 },
    { host: 47, expected: 8 },
    { host: 47.3, expected: 16 },
    { host: 48, expected: 16 },
    { host: 64, expected: 16 },
    { host: 64, limit: 16, expected: 2 },
    { host: 64, limit: 24, expected: 6 },
    { host: 64, limit: 32 - 1 / gib, expected: 6 },
    { host: 64, limit: 32, expected: 8 },
    { host: 64, limit: 48 - 1 / gib, expected: 8 },
    { host: 64, limit: 48, expected: 16 },
    { host: 16, limit: 32, expected: 2 },
    { host: 24, limit: 2 ** 34, expected: 6 },
])("selects workers from RAM capacity and OS limits: %j", ({ host, limit = 0, expected }) => {
    const result = spawnSync(
        process.execPath,
        [
            "--input-type=module",
            "-e",
            `import { getE2EWorkers } from ${JSON.stringify(pathToFileURL(selector).href)};
             console.log(getE2EWorkers(JSON.parse(process.argv[1])));`,
            JSON.stringify({ totalMemory: host * gib, memoryLimit: limit * gib }),
        ],
        { encoding: "utf8", env: { ...process.env, E2E_WORKERS: "" } },
    );
    expect({ status: result.status, stderr: result.stderr, stdout: result.stdout }).toEqual({
        status: 0,
        stderr: "",
        stdout: `${expected}\n`,
    });
});

test.each(["1", "3", "16"])("the CLI preserves E2E_WORKERS=%s", (override) => {
    const result = spawnSync(process.execPath, [selector], {
        encoding: "utf8",
        env: { ...process.env, E2E_WORKERS: override },
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toBe(`${override}\n`);
});

test.each(["0", "-1", "1.5", "invalid", "Infinity", " "])(
    "rejects invalid E2E_WORKERS=%s",
    (override) => {
        const result = spawnSync(process.execPath, [selector], {
            encoding: "utf8",
            env: { ...process.env, E2E_WORKERS: override },
        });
        expect(result.status).toBe(1);
        expect(result.stdout).toBe("");
        expect(result.stderr).toContain("E2E_WORKERS must be a positive integer");
    },
);
