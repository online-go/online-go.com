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

export function is_valid_url(url: string): boolean {
    if (!url || typeof url !== "string") {
        return false;
    }
    return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)\/?$/.test(url.toLowerCase());
}

/**
 * Validates a `?next=` redirect target coming from the URL query string before
 * it is handed to `window.location` after sign-in or registration.
 *
 * Only same-origin targets are accepted. Anything else - off-site URLs,
 * `javascript:`, `data:`, and other non-http schemes - is rejected, since
 * assigning it to `location.href` would either redirect the user off the site
 * after authenticating, or, in the case of a `javascript:` URL, execute
 * attacker-controlled code in the OGS origin with the freshly-established
 * session.
 *
 * The value is always run through the URL parser rather than inspected with
 * string prefix checks. Prefix checks are unsafe here: browsers strip embedded
 * ASCII tab/newline characters while parsing a URL, so a value like `/%09/evil.com`
 * passes a `startsWith("/")` check but normalizes to `//evil.com` (an off-site
 * redirect) once assigned to `location.href`. The URL parser performs the same
 * normalization as the browser, so the origin comparison below sees exactly what
 * the browser would navigate to.
 *
 * Returns the trimmed safe target, or null if it is not safe to navigate to.
 */
export function valid_next_url(next: string | null): string | null {
    if (!next || typeof next !== "string") {
        return null;
    }

    const url = next.trim();
    if (url === "") {
        return null;
    }

    try {
        const parsed = new URL(url, window.location.origin);
        if (parsed.origin === window.location.origin) {
            return parsed.pathname + parsed.search + parsed.hash;
        }
    } catch {
        /* malformed URL, fall through to null */
    }

    return null;
}
