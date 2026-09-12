import { spawn, spawnSync } from "node:child_process";
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

test.each([
    { build: false, buildStatus: 0, status: 0 },
    { build: false, buildStatus: 0, status: 7 },
    { build: true, buildStatus: 0, status: 0 },
    { build: true, buildStatus: 9, status: 0 },
    { build: false, buildStatus: 0, status: 0, workers: "" },
])("built runner handles build and test status: %j", async (options) => {
    const { build, buildStatus, status, workers = "3" } = options;
    const cwd = mkdtempSync(join(tmpdir(), "ogs-built-e2e-"));
    const frontend = createServer((_request, response) => {
        response.end(
            '<script type="module" src="/@vite/client"></script>' +
                '<script type="module" src="/main.tsx"></script><link href="/ogs.css">',
        );
    });
    await new Promise<void>((resolve) => frontend.listen(0, "127.0.0.1", resolve));
    const address = frontend.address();
    if (!address || typeof address === "string") {
        throw new Error("Expected an HTTP listener");
    }
    const frontendURL = `http://127.0.0.1:${address.port}`;
    try {
        mkdirSync(join(cwd, "node_modules/vite/bin"), { recursive: true });
        mkdirSync(join(cwd, "node_modules/playwright"), { recursive: true });
        writeFileSync(join(cwd, "package.json"), '{"type":"module"}');
        if (!build) {
            mkdirSync(join(cwd, "dist"));
            writeFileSync(join(cwd, "dist/ogs.js"), "");
            writeFileSync(join(cwd, "dist/ogs.min.css"), "");
        }
        copyFileSync(join(__dirname, "run-e2e-built.js"), join(cwd, "runner.js"));
        copyFileSync(join(__dirname, "e2e-workers.js"), join(cwd, "e2e-workers.js"));
        writeFileSync(
            join(cwd, "node_modules/vite/package.json"),
            '{"type":"module","exports":"./index.js"}',
        );
        writeFileSync(
            join(cwd, "node_modules/vite/index.js"),
            `import { createServer } from "node:http";
             import { writeFileSync } from "node:fs";
             export async function loadConfigFromFile() {
                 return { config: { server: { proxy: {
                     "/api": { target: "https://example.invalid", rewrite: () => "wrong-backend" },
                     "^/$": { ws: true, bypass: (req) => req.url }
                 } } } };
             }
             export async function preview(config) {
                 writeFileSync("proxy.json", JSON.stringify(config.preview.proxy));
                 const httpServer = createServer();
                 await new Promise(resolve => httpServer.listen(0, "127.0.0.1", resolve));
                 return { httpServer };
             }`,
        );
        writeFileSync(
            join(cwd, "node_modules/vite/bin/vite.js"),
            `import { mkdirSync, writeFileSync } from "node:fs";
             writeFileSync("build.json", JSON.stringify(process.argv.slice(2)));
             if (${buildStatus}) process.exit(${buildStatus});
             mkdirSync("dist");
             writeFileSync("dist/ogs.js", "");
             writeFileSync("dist/ogs.min.css", "");`,
        );
        writeFileSync(
            join(cwd, "node_modules/playwright/cli.js"),
            `import { writeFileSync } from "node:fs";
             writeFileSync("playwright-started", "");
             console.log(JSON.stringify({ args: process.argv.slice(2), frontend: process.env.FRONTEND_URL,
                dev: process.env.E2E_DEV_SERVER_URL, workers: process.env.E2E_WORKERS }));
             process.exit(${status});`,
        );
        const args = [
            join(cwd, "runner.js"),
            ...(build ? ["--build"] : []),
            "--grep",
            "one|two words",
        ];
        const child = spawn(process.execPath, args, {
            cwd,
            env: {
                ...process.env,
                CI: "",
                E2E_MODERATOR_PASSWORD: "fixture-password",
                FRONTEND_URL: frontendURL,
                E2E_PREVIEW_PORT: "18081",
                E2E_WORKERS: workers,
            },
            stdio: ["ignore", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk: Buffer) => {
            stdout += chunk.toString();
        });
        child.stderr.on("data", (chunk: Buffer) => {
            stderr += chunk.toString();
        });
        const timeout = setTimeout(() => child.kill("SIGKILL"), 4000);
        try {
            const code = await new Promise<number | null>((resolve, reject) => {
                child.once("exit", resolve);
                child.once("error", reject);
            });
            expect({ code, stderr }).toEqual({ code: buildStatus || status, stderr: "" });
            if (build) {
                expect(JSON.parse(readFileSync(join(cwd, "build.json"), "utf8"))).toEqual([
                    "build",
                    "--emptyOutDir",
                ]);
            }
            if (buildStatus) {
                expect(existsSync(join(cwd, "playwright-started"))).toBe(false);
                expect(existsSync(join(cwd, "proxy.json"))).toBe(false);
                return;
            }
            expect(JSON.parse(stdout)).toEqual({
                args: ["test", "--grep", "one|two words"],
                frontend: "http://localhost:18081",
                dev: frontendURL,
                workers:
                    workers ||
                    spawnSync(process.execPath, [join(cwd, "e2e-workers.js")], {
                        encoding: "utf8",
                        env: { ...process.env, E2E_WORKERS: "" },
                    }).stdout.trim(),
            });
            expect(JSON.parse(readFileSync(join(cwd, "proxy.json"), "utf8"))).toEqual({
                "/api": { target: frontendURL, changeOrigin: true },
                "^/$": { target: frontendURL, changeOrigin: true, ws: true },
            });
            const html = readFileSync(join(cwd, "dist/index.html"), "utf8");
            expect(html).toContain('src="/ogs.js"');
            expect(html).toContain('href="/ogs.min.css"');
            expect(html).not.toContain("/@vite/client");
        } finally {
            clearTimeout(timeout);
            if (child.exitCode === null) child.kill("SIGKILL");
        }
    } finally {
        frontend.closeAllConnections();
        await new Promise<void>((resolve) => frontend.close(() => resolve()));
        rmSync(cwd, { recursive: true, force: true });
    }
});

test.each([
    { args: [], ci: "", expectedStatus: 1, startsPlaywright: false },
    { args: ["--list"], ci: "", expectedStatus: 0, startsPlaywright: true },
    { args: ["--help"], ci: "", expectedStatus: 0, startsPlaywright: true },
    { args: [], ci: "true", expectedStatus: 0, startsPlaywright: true },
])("checks prerequisites before building or opening browsers: %j", async (options) => {
    const cwd = mkdtempSync(join(tmpdir(), "ogs-e2e-prerequisites-"));
    try {
        mkdirSync(join(cwd, "node_modules/vite"), { recursive: true });
        mkdirSync(join(cwd, "node_modules/playwright"), { recursive: true });
        writeFileSync(join(cwd, "package.json"), '{"type":"module"}');
        copyFileSync(join(__dirname, "run-e2e-built.js"), join(cwd, "runner.js"));
        copyFileSync(join(__dirname, "e2e-workers.js"), join(cwd, "e2e-workers.js"));
        writeFileSync(
            join(cwd, "node_modules/vite/package.json"),
            '{"type":"module","exports":"./index.js"}',
        );
        writeFileSync(
            join(cwd, "node_modules/vite/index.js"),
            'export function loadConfigFromFile() { throw Error("Unexpected config load"); }' +
                'export function preview() { throw Error("Unexpected preview"); }',
        );
        writeFileSync(
            join(cwd, "node_modules/playwright/cli.js"),
            "console.log(JSON.stringify(process.argv.slice(2)));",
        );
        const child = spawn(
            process.execPath,
            [join(cwd, "runner.js"), "--build", ...options.args],
            {
                cwd,
                env: {
                    ...process.env,
                    CI: options.ci,
                    E2E_MODERATOR_PASSWORD: "",
                    FRONTEND_URL: "http://127.0.0.1:1",
                },
                stdio: ["ignore", "pipe", "pipe"],
            },
        );
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk: Buffer) => {
            stdout += chunk.toString();
        });
        child.stderr.on("data", (chunk: Buffer) => {
            stderr += chunk.toString();
        });
        const timeout = setTimeout(() => child.kill("SIGKILL"), 4000);
        try {
            const code = await new Promise<number | null>((resolve, reject) => {
                child.once("exit", resolve);
                child.once("error", reject);
            });
            expect(code).toBe(options.expectedStatus);
            if (options.startsPlaywright) {
                expect(JSON.parse(stdout)).toEqual(["test", ...options.args]);
                expect(stderr).toBe("");
            } else {
                expect(stdout).toBe("");
                expect(stderr).toContain("E2E_MODERATOR_PASSWORD is required");
                expect(stderr).toContain("docker exec -e E2E_MODERATOR_PASSWORD");
            }
        } finally {
            clearTimeout(timeout);
            if (child.exitCode === null) child.kill("SIGKILL");
        }
    } finally {
        rmSync(cwd, { recursive: true, force: true });
    }
});
