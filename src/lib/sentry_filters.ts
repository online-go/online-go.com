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

import type { ErrorEvent } from "@sentry/browser";

/* Several users have weird addons and extensions that cause errors that have
 * nothing to do with OGS. Sentry drops an error when its message contains one
 * of these strings, wherever the error comes from. Thus each string must be
 * specific enough that our own code cannot produce it. Errors that only the
 * source can identify go in `isThirdPartyError` instead. */
export const SENTRY_IGNORE_ERRORS: Array<string | RegExp> = [
    "ReferenceError",
    "coinbase",
    "ethereum",
    "hideMyLocation",
    "userAgent",
    "zaloJSV2", // cspell:disable-line
    "evaluating 'a.L'",
    "document.querySelector(\"[title='Kaya']\").style",
    "onHide is not defined",
    "outputCurrentConfiguration",
    "mvpConfig",
    "Cannot read properties of undefined (reading 'ns')",

    // Scripts that some Android apps and browsers (for example Baidu)
    // inject to call their native Java side.
    "window.android.unLoad",
    "Java bridge method invocation error",
    "Java object is gone",

    // A user script that polls `global_goban.engine`. Our code always
    // reads it as `window.global_goban`.
    "(evaluating 'global_goban.engine')",

    // Transient network failures when loading CSS for lazy chunks
    "Unable to preload CSS",

    // Library bugs
    ").ended is not a function", // d3

    // Safari bugs
    //   broken mac app WKWebView, see
    //   https://github.com/getsentry/sentry-javascript/issues/3040
    "evaluating 'window.webkit.messageHandlers'",
    //   Audio
    "cannot call stop without calling start first",
];

/**
 * Returns true when every stack frame of the error has the file name
 * "<anonymous>". Browser extensions, in-app browsers and automation tools
 * evaluate their scripts without a file name, so their frames look like this.
 * Our code always loads from a script file, so an error from our code has at
 * least one frame that names that file. (Chrome also uses "<anonymous>" for
 * built-in functions such as `JSON.parse`, but our code is always further up
 * the stack when it calls them.)
 */
export function isFromAnonymousScript(event: ErrorEvent): boolean {
    const values = event.exception?.values;
    if (!values?.length) {
        return false;
    }
    return values.every((value) => {
        const frames = value.stacktrace?.frames;
        return !!frames?.length && frames.every((frame) => frame.filename === "<anonymous>");
    });
}

const SCRIPT_FILE = /\.m?js(?:[?#]|$)/;

/**
 * Returns true for the `SyntaxError: Unexpected token 'else'` that one Android
 * in-app WebView reports (ONLINE-GOCOM-4R3). The error has one frame, on the
 * page URL (not a script file) at line 1, column 219. That position is inside
 * the <head> meta tags of the served page, before the first inline script, so
 * none of our code can be there. The same message from one of our script
 * files, for example a broken lazy chunk, does not match.
 */
export function isInjectedElseSyntaxError(event: ErrorEvent): boolean {
    const values = event.exception?.values;
    if (values?.length !== 1) {
        return false;
    }
    const [value] = values;
    if (value.type !== "SyntaxError" || value.value !== "Unexpected token 'else'") {
        return false;
    }
    const frames = value.stacktrace?.frames;
    if (frames?.length !== 1) {
        return false;
    }
    const [frame] = frames;
    return (
        frame.lineno === 1 &&
        frame.colno === 219 &&
        !!frame.filename &&
        !SCRIPT_FILE.test(frame.filename)
    );
}

/** Returns true when the error comes from a script that is not ours. */
export function isThirdPartyError(event: ErrorEvent): boolean {
    return isFromAnonymousScript(event) || isInjectedElseSyntaxError(event);
}
