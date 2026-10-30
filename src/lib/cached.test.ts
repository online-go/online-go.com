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

import "@/lib/data";
import "@/lib/sockets";
import { get, put } from "@/lib/requests";
import cached from "@/lib/cached";

let mockLanguage = "fr";

jest.mock("@/lib/translate", () => ({
    ...jest.requireActual("@/lib/translate"),
    get current_language() {
        return mockLanguage;
    },
}));

jest.mock("@/lib/requests", () => ({
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    del: jest.fn(),
}));

async function loadConfig(user: Partial<rest_api.UserConfig>) {
    jest.mocked(get).mockResolvedValue({ user });
    await new Promise<void>((resolve) => cached.refresh.config(resolve));
}

beforeEach(() => {
    jest.mocked(put).mockReset().mockResolvedValue({});
    mockLanguage = "fr";
});

test("the server is told the language the site is shown in when it has another one recorded", async () => {
    await loadConfig({ id: 1, anonymous: false, language: "auto" });

    expect(put).toHaveBeenCalledWith("me/settings", { site_preferences: { language: "fr" } });
});

test("the server is not told a language it already has recorded", async () => {
    await loadConfig({ id: 1, anonymous: false, language: "fr" });

    expect(put).not.toHaveBeenCalled();
});

test("a server that doesn't send the recorded language isn't told one", async () => {
    await loadConfig({ id: 1, anonymous: false });

    expect(put).not.toHaveBeenCalled();
});

test("the debug pseudo-language is not recorded", async () => {
    mockLanguage = "debug";

    await loadConfig({ id: 1, anonymous: false, language: "en" });

    expect(put).not.toHaveBeenCalled();
});

test("an anonymous visitor's language is not recorded", async () => {
    await loadConfig({ id: -1, anonymous: true });

    expect(put).not.toHaveBeenCalled();
});
