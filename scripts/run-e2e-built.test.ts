import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

test.each([0, 7])("built runner closes its server and returns exit status %i", async (status) => {
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
        mkdirSync(join(cwd, "dist"));
        mkdirSync(join(cwd, "node_modules/vite"), { recursive: true });
        mkdirSync(join(cwd, "node_modules/playwright"), { recursive: true });
        writeFileSync(join(cwd, "package.json"), '{"type":"module"}');
        writeFileSync(join(cwd, "dist/ogs.js"), "");
        writeFileSync(join(cwd, "dist/ogs.min.css"), "");
        copyFileSync(join(__dirname, "run-e2e-built.js"), join(cwd, "runner.js"));
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
            join(cwd, "node_modules/playwright/cli.js"),
            `console.log(JSON.stringify({ args: process.argv.slice(2), frontend: process.env.FRONTEND_URL,
                dev: process.env.E2E_DEV_SERVER_URL, workers: process.env.E2E_WORKERS }));
             process.exit(${status});`,
        );
        const child = spawn(process.execPath, [join(cwd, "runner.js"), "--grep", "one|two words"], {
            cwd,
            env: {
                ...process.env,
                FRONTEND_URL: frontendURL,
                E2E_PREVIEW_PORT: "18081",
                E2E_WORKERS: "3",
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
            expect({ code, stderr }).toEqual({ code: status, stderr: "" });
            expect(JSON.parse(stdout)).toEqual({
                args: ["test", "--grep", "one|two words"],
                frontend: "http://localhost:18081",
                dev: frontendURL,
                workers: "3",
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
