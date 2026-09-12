import { spawn } from "node:child_process";
import { access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfigFromFile, preview } from "vite";
import { getE2EWorkers } from "./e2e-workers.js";

async function runNode(args, env = process.env) {
    const child = spawn(process.execPath, args, { stdio: "inherit", env });
    const interrupt = () => child.kill("SIGINT");
    const terminate = () => child.kill("SIGTERM");
    process.on("SIGINT", interrupt);
    process.on("SIGTERM", terminate);
    try {
        return await new Promise((resolve, reject) => {
            child.once("error", reject);
            child.once("exit", (code) => resolve(code ?? 1));
        });
    } finally {
        process.off("SIGINT", interrupt);
        process.off("SIGTERM", terminate);
    }
}

const buildFirst = process.argv.includes("--build");
const args = process.argv.slice(2).filter((arg) => arg !== "--build");
const nodeOptions = process.version.startsWith("v23") ? ["--no-experimental-strip-types"] : [];
const playwrightArgs = [...nodeOptions, resolve("node_modules/playwright/cli.js"), "test", ...args];
const inspectOnly = args.some((arg) => ["--list", "--help", "-h"].includes(arg));
if (inspectOnly || process.env.CI) {
    process.exit(await runNode(playwrightArgs));
}
if (!process.env.E2E_MODERATOR_PASSWORD) {
    console.error(
        "E2E_MODERATOR_PASSWORD is required for the automated suite. " +
            "Set it to the password used by init_e2e. " +
            "Docker exec does not inherit your shell variables; after exporting it, run:\n" +
            "  docker exec -e E2E_MODERATOR_PASSWORD ogs_ui_1 yarn test:e2e",
    );
    process.exit(1);
}

const workers = getE2EWorkers();
const frontend = new URL(process.env.FRONTEND_URL || "http://localhost:8080");
const port = Number(process.env.E2E_PREVIEW_PORT || 8081);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("E2E_PREVIEW_PORT must be a valid port number");
}
const builtURL = new URL(`http://localhost:${port}`);

// OGS builds bundles without an index. Use the local server's resolved template
// and replace only its development scripts and stylesheet with the built assets.
const response = await fetch(frontend, { signal: AbortSignal.timeout(15000) });
if (!response.ok) {
    throw new Error(`Frontend template request failed: ${response.status}`);
}
let html = await response.text();
if (!html.includes('src="/main.tsx"')) {
    throw new Error("FRONTEND_URL must serve the OGS Vite development template");
}
if (buildFirst) {
    const status = await runNode([
        resolve("node_modules/vite/bin/vite.js"),
        "build",
        "--emptyOutDir",
    ]);
    if (status !== 0) {
        process.exit(status);
    }
}
await access(resolve("dist/ogs.js"));
await access(resolve("dist/ogs.min.css"));

html = html
    .replace(/<script type="module">[\s\S]*?<\/script>/g, (tag) =>
        tag.includes("RefreshRuntime") ? "" : tag,
    )
    .replace(/<script type="module" src="\/@vite\/client"><\/script>/g, "")
    .replaceAll("/main.tsx", "/ogs.js")
    .replaceAll("ogs.css", "ogs.min.css")
    .replaceAll(frontend.host, builtURL.host);
await writeFile(resolve("dist/index.html"), html);

const loaded = await loadConfigFromFile({ command: "serve", mode: "production", isPreview: true });
if (!loaded?.config.server?.proxy) {
    throw new Error("Vite must define the OGS backend proxy routes");
}
// Forward through the supplied frontend so its backend selection and request
// headers also apply when this runner executes outside the frontend container.
const proxy = Object.fromEntries(
    Object.entries(loaded.config.server.proxy).map(([route, options]) => [
        route,
        {
            target: frontend.origin,
            changeOrigin: true,
            ...(typeof options === "object"
                ? {
                      ws: options.ws,
                      rewriteWsOrigin: options.rewriteWsOrigin,
                      bypass: options.bypass,
                  }
                : {}),
        },
    ]),
);
const server = await preview({
    ...loaded.config,
    configFile: false,
    preview: { host: "localhost", port, strictPort: true, proxy },
});
const connections = new Set();
server.httpServer.on("connection", (socket) => {
    connections.add(socket);
    socket.once("close", () => connections.delete(socket));
});
try {
    process.exitCode = await runNode(playwrightArgs, {
        ...process.env,
        E2E_WORKERS: String(workers),
        FRONTEND_URL: builtURL.origin,
        E2E_DEV_SERVER_URL: frontend.origin,
    });
} finally {
    server.config.logger.flushProxyWarnings?.();
    server.httpServer.close();
    for (const socket of connections) {
        socket.destroy();
    }
}
// Proxy websocket connections can outlive the HTTP listener. Playwright has
// exited and completed its reports, so release the runner's remaining sockets.
process.exit(process.exitCode ?? 0);
