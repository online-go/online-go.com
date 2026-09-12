import { stripVTControlCharacters } from "node:util";
import type { Logger } from "vite";

export type ProxyWarningLogger = Logger & { flushProxyWarnings(): void };

/** Summarize WebSocket resets while retaining Vite's other logging behavior. */
export function createProxyWarningLogger(logger: Logger): ProxyWarningLogger {
    const reported = new WeakSet<object>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let repeats = 0;

    function flushProxyWarnings() {
        clearTimeout(timer);
        timer = undefined;
        if (repeats > 0) {
            logger.warn(`Additional WebSocket proxy connection resets (ECONNRESET): ${repeats}.`, {
                timestamp: true,
            });
            repeats = 0;
        }
    }

    return {
        info: logger.info.bind(logger),
        warn: logger.warn.bind(logger),
        warnOnce: logger.warnOnce.bind(logger),
        clearScreen: logger.clearScreen.bind(logger),
        get hasWarned() {
            return logger.hasWarned;
        },
        error(message, options) {
            const error = options?.error as NodeJS.ErrnoException | undefined;
            if (
                error?.code !== "ECONNRESET" ||
                !/^ws proxy(?: socket)? error:/.test(stripVTControlCharacters(message))
            ) {
                logger.error(message, options);
                return;
            }
            // Vite can report the same error from both the proxy and its socket.
            if (reported.has(error)) return;
            reported.add(error);
            if (timer) {
                ++repeats;
                return;
            }
            logger.warn("WebSocket proxy connection reset (ECONNRESET).", options);
            timer = setTimeout(flushProxyWarnings, 5000);
            timer.unref?.();
        },
        hasErrorLogged(error) {
            return reported.has(error) || logger.hasErrorLogged(error);
        },
        flushProxyWarnings,
    };
}
