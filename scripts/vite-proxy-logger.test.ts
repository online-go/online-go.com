import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import type { Logger } from "vite";
import { createProxyWarningLogger } from "./vite-proxy-logger";

function setup() {
    const base: Logger = {
        hasWarned: false,
        info: jest.fn(),
        warn: jest.fn(function (this: Logger) {
            this.hasWarned = true;
        }),
        warnOnce: jest.fn(),
        error: jest.fn(),
        clearScreen: jest.fn(),
        hasErrorLogged: jest.fn(() => false),
    };
    return { base, logger: createProxyWarningLogger(base) };
}

function reset() {
    return Object.assign(new Error("write ECONNRESET"), { code: "ECONNRESET" });
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test.each(["ws proxy error:", "ws proxy socket error:", "\u001b[31mws proxy error:\u001b[39m"])(
    "reports %s as a concise warning without its stack",
    (prefix) => {
        const { base, logger } = setup();
        const options = { error: reset(), timestamp: true };
        logger.error(`${prefix}\n${options.error.stack}`, options);
        expect(base.warn).toHaveBeenCalledWith(
            "WebSocket proxy connection reset (ECONNRESET).",
            options,
        );
        expect(base.error).not.toHaveBeenCalled();
        expect(logger.hasWarned).toBe(true);
        expect(logger.hasErrorLogged(options.error)).toBe(true);
        jest.advanceTimersByTime(5000);
        expect(base.warn).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
    },
);

test("combines a burst, deduplicates Vite handlers, and starts a new window", () => {
    const { base, logger } = setup();
    for (let i = 0; i < 4; ++i) {
        const error = reset();
        logger.error("ws proxy error:", { error });
        logger.error("ws proxy socket error:", { error });
    }
    expect(base.warn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(4999);
    expect(base.warn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    expect(base.warn).toHaveBeenLastCalledWith(
        "Additional WebSocket proxy connection resets (ECONNRESET): 3.",
        { timestamp: true },
    );
    expect(base.warn).toHaveBeenCalledTimes(2);
    logger.error("ws proxy error:", { error: reset() });
    expect(base.warn).toHaveBeenCalledTimes(3);
});

test("continuous resets cannot postpone the summary indefinitely", () => {
    const { base, logger } = setup();
    for (let i = 0; i < 5; ++i) {
        logger.error("ws proxy error:", { error: reset() });
        jest.advanceTimersByTime(1000);
    }
    expect(base.warn).toHaveBeenCalledTimes(2);
    expect(base.warn).toHaveBeenLastCalledWith(
        "Additional WebSocket proxy connection resets (ECONNRESET): 4.",
        { timestamp: true },
    );
});

test("flushes pending counts at shutdown and cancels the timer", () => {
    const { base, logger } = setup();
    logger.error("ws proxy error:", { error: reset() });
    logger.error("ws proxy error:", { error: reset() });
    logger.flushProxyWarnings();
    expect(base.warn).toHaveBeenLastCalledWith(
        "Additional WebSocket proxy connection resets (ECONNRESET): 1.",
        { timestamp: true },
    );
    expect(jest.getTimerCount()).toBe(0);
    logger.flushProxyWarnings();
    jest.advanceTimersByTime(5000);
    expect(base.warn).toHaveBeenCalledTimes(2);
});

test.each([
    { message: "ws proxy error:", code: "ECONNREFUSED" },
    { message: "ws proxy error:", code: "ETIMEDOUT" },
    { message: "ws proxy socket error:", code: "EPIPE" },
    { message: "http proxy error: /api/v1/me", code: "ECONNRESET" },
    { message: "ws proxy bypass error:", code: "ECONNRESET" },
    { message: "Plugin failed", code: "ECONNRESET" },
    { message: "ws proxy error: ECONNRESET", code: undefined },
])("preserves other errors and their details: %j", ({ message, code }) => {
    const { base, logger } = setup();
    const options = { error: Object.assign(new Error(message), { code }), timestamp: true };
    logger.error(message, options);
    expect(base.error).toHaveBeenCalledWith(message, options);
    expect(base.warn).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
});

test("forwards other logger methods and preserves their receiver", () => {
    const { base, logger } = setup();
    const options = { timestamp: true };
    logger.info("info", options);
    logger.warn("warning", options);
    logger.warnOnce("once", options);
    logger.clearScreen("info");
    const error = new Error("other error");
    expect(logger.hasErrorLogged(error)).toBe(false);
    expect(base.hasErrorLogged).toHaveBeenCalledWith(error);
    expect(base.info).toHaveBeenCalledWith("info", options);
    expect(base.warn).toHaveBeenCalledWith("warning", options);
    expect(base.warnOnce).toHaveBeenCalledWith("once", options);
    expect(base.clearScreen).toHaveBeenCalledWith("info");
    expect(logger.hasWarned).toBe(true);
});

test("Vite config preserves log levels and live logger state", () => {
    const result = spawnSync(
        process.execPath,
        [
            "--input-type=module",
            "-e",
            `import assert from "node:assert/strict";
             import { createLogger, loadConfigFromFile, resolveConfig } from "vite";
             const loaded = await loadConfigFromFile({ command: "serve", mode: "development" });
             const plugin = loaded.config.plugins.flat().find(p => p?.name === "proxy-warning-logger");
             assert.ok(plugin);
             for (const customLogger of [undefined, createLogger("silent")]) {
                 const config = await resolveConfig({
                     configFile: false, plugins: [plugin], logLevel: "silent", customLogger
                 }, "serve");
                 const warnings = [];
                 const originalWarn = console.warn;
                 console.warn = (...args) => warnings.push(args);
                 try {
                     const error = Object.assign(new Error("write ECONNRESET"), { code: "ECONNRESET" });
                     config.logger.error("ws proxy socket error:", { error });
                     config.logger.flushProxyWarnings();
                     assert.equal(config.logger.hasWarned, true);
                     assert.equal(config.logger.hasErrorLogged(error), true);
                     assert.equal(warnings.length, 0);
                 } finally { console.warn = originalWarn; }
             }`,
        ],
        {
            cwd: resolve(__dirname, ".."),
            encoding: "utf8",
            env: { ...process.env, OGS_BACKEND: "LOCAL" },
            timeout: 10000,
        },
    );
    expect({ status: result.status, error: result.status ? result.stderr : "" }).toEqual({
        status: 0,
        error: "",
    });
});
