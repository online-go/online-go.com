/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { eventFiltersIntegration } from "@sentry/browser";
import type { BrowserClient, ErrorEvent, StackFrame } from "@sentry/browser";
import {
    isFromAnonymousScript,
    isInjectedElseSyntaxError,
    isThirdPartyError,
    SENTRY_IGNORE_ERRORS,
} from "./sentry_filters";

const APP_FRAME: StackFrame = {
    filename: "https://online-go.com/assets/Game-123.js",
    lineno: 1,
    colno: 100,
};
const ANONYMOUS_FRAME: StackFrame = { filename: "<anonymous>", lineno: 3, colno: 15 };
const INJECTED_ELSE_FRAME: StackFrame = {
    filename: "https://online-go.com/play",
    lineno: 1,
    colno: 219,
};

function makeEvent(type: string, value: string, ...frame_lists: StackFrame[][]): ErrorEvent {
    return {
        type: undefined,
        exception: {
            values: frame_lists.map((frames) => ({
                type,
                value,
                stacktrace: { frames },
            })),
        },
    };
}

function elseError(...frames: StackFrame[]): ErrorEvent {
    return makeEvent("SyntaxError", "Unexpected token 'else'", frames);
}

/** Runs the event through the same message filter that Sentry.init uses. */
function droppedByIgnoreErrors(event: ErrorEvent): boolean {
    const integration = eventFiltersIntegration({ ignoreErrors: SENTRY_IGNORE_ERRORS });
    const client = { getOptions: () => ({}) } as unknown as BrowserClient;
    return integration.processEvent?.(event, {}, client) === null;
}

/** True when Sentry would send the event. */
function isReported(event: ErrorEvent): boolean {
    return !droppedByIgnoreErrors(event) && !isThirdPartyError(event);
}

describe("isFromAnonymousScript", () => {
    test("drops an error whose frames are all anonymous", () => {
        const event = makeEvent("TypeError", "x is undefined", [ANONYMOUS_FRAME, ANONYMOUS_FRAME]);
        expect(isFromAnonymousScript(event)).toBe(true);
        expect(isReported(event)).toBe(false);
    });

    test("drops a chained error when every exception has only anonymous frames", () => {
        const event = makeEvent(
            "TypeError",
            "x is undefined",
            [ANONYMOUS_FRAME],
            [ANONYMOUS_FRAME],
        );
        expect(isFromAnonymousScript(event)).toBe(true);
    });

    test("keeps an error with one application frame among anonymous frames", () => {
        const event = makeEvent("TypeError", "x is undefined", [ANONYMOUS_FRAME, APP_FRAME]);
        expect(isFromAnonymousScript(event)).toBe(false);
        expect(isReported(event)).toBe(true);
    });

    test("keeps a chained error when one exception has an application frame", () => {
        const event = makeEvent("TypeError", "x is undefined", [ANONYMOUS_FRAME], [APP_FRAME]);
        expect(isFromAnonymousScript(event)).toBe(false);
    });

    test("keeps an error with only application frames", () => {
        const event = makeEvent("TypeError", "x is undefined", [APP_FRAME]);
        expect(isFromAnonymousScript(event)).toBe(false);
        expect(isReported(event)).toBe(true);
    });

    test("keeps an error with no frames", () => {
        expect(isFromAnonymousScript(makeEvent("TypeError", "x is undefined", []))).toBe(false);
        expect(isFromAnonymousScript({ type: undefined, message: "hello" })).toBe(false);
        expect(isFromAnonymousScript({ type: undefined, exception: { values: [] } })).toBe(false);
        expect(
            isFromAnonymousScript({
                type: undefined,
                exception: { values: [{ type: "TypeError", value: "x is undefined" }] },
            }),
        ).toBe(false);
    });
});

describe("isInjectedElseSyntaxError", () => {
    test("drops the injected WebView error from ONLINE-GOCOM-4R3", () => {
        const event = elseError(INJECTED_ELSE_FRAME);
        expect(isInjectedElseSyntaxError(event)).toBe(true);
        expect(isReported(event)).toBe(false);
    });

    test("keeps the same message from an application script", () => {
        const event = elseError(APP_FRAME);
        expect(isInjectedElseSyntaxError(event)).toBe(false);
        expect(isReported(event)).toBe(true);
    });

    test("keeps the same message from an application script at the same position", () => {
        const event = elseError({ ...INJECTED_ELSE_FRAME, filename: APP_FRAME.filename });
        expect(isInjectedElseSyntaxError(event)).toBe(false);
        expect(
            isInjectedElseSyntaxError(
                elseError({
                    ...INJECTED_ELSE_FRAME,
                    filename: "https://cdn.online-go.com/5.1/ogs.5.1-1-gabc.js?v=1",
                }),
            ),
        ).toBe(false);
    });

    test("keeps the same message at another position in the page", () => {
        expect(isInjectedElseSyntaxError(elseError({ ...INJECTED_ELSE_FRAME, lineno: 4 }))).toBe(
            false,
        );
        expect(isInjectedElseSyntaxError(elseError({ ...INJECTED_ELSE_FRAME, colno: 6000 }))).toBe(
            false,
        );
    });

    test("keeps the same message with more than one frame or no frames", () => {
        expect(isInjectedElseSyntaxError(elseError(INJECTED_ELSE_FRAME, APP_FRAME))).toBe(false);
        expect(isInjectedElseSyntaxError(elseError())).toBe(false);
    });

    test("keeps a different error at the same position", () => {
        expect(
            isInjectedElseSyntaxError(
                makeEvent("SyntaxError", "Unexpected token ')'", [INJECTED_ELSE_FRAME]),
            ),
        ).toBe(false);
    });
});
