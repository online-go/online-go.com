/*
 * Copyright (C) Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 */

// Cached IANA timezone (e.g. "America/Los_Angeles") detected once
// per session from the browser. We pass this to Django on register,
// login, and config refreshes so Player.timezone tracks the user's
// actual zone without requiring them to update their settings page.

let cached: string | null = null;

export function get_browser_timezone(): string {
    if (cached !== null) {
        return cached;
    }
    try {
        cached = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
        cached = "UTC";
    }
    return cached;
}
