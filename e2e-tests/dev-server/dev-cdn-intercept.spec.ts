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

/*
 * OGS's dev server maps assets/img/* to /img/* via a middleware in
 * vite.config.ts so board textures and other repo assets load from local disk
 * during development. Two regressions silently break that flow:
 *
 *   1. Removing or bypassing the /img/* middleware — asset requests fall
 *      through to Vite's SPA catch-all and return index.html at HTTP 200,
 *      which a less strict assertion would happily accept.
 *   2. Letting the backend's ui/config cdn_release clobber the localhost
 *      override in src/main.tsx / src/lib/cached.ts — textures start loading
 *      from the prod CDN, so local changes appear to do nothing.
 *
 * The HTTP tests read a runtime fixture, a missing path, and a submodule
 * asset without loading the application. The browser test seeds localStorage
 * to trigger the cached-config rehydrate path
 * that previously clobbered cdn_release, then asserts the dev-server pin held.
 *
 * Asset serving is tested through Playwright's uncached HTTP client. Only
 * cached-config rehydration requires a browser and application startup.
 */

import { BrowserContext, expect } from "@playwright/test";
import { CreateContextOptions, ogsTest } from "@helpers";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_IMG_DIR = path.resolve(currentDir, "../../assets/img");

ogsTest.describe("@DevServer dev-server /img middleware + cdn_release pin", () => {
    ogsTest("/img/* serves fresh bytes from assets/img on disk", async ({ request }) => {
        const token = crypto.randomUUID();
        const fixtureName = `__probe_${token}.bin`;
        const fixturePath = path.join(ASSETS_IMG_DIR, fixtureName);
        const bytes = Buffer.from(`OGS-MIDDLEWARE-PROBE-${token}`);
        await fs.writeFile(fixturePath, bytes);
        try {
            const response = await request.get(`/img/${fixtureName}`);
            expect(
                response.status(),
                "The development server must read the fixture from this checkout",
            ).toBe(200);
            const actualSha = crypto
                .createHash("sha256")
                .update(await response.body())
                .digest("hex");
            const expectedSha = crypto.createHash("sha256").update(bytes).digest("hex");
            expect(actualSha).toBe(expectedSha);
        } finally {
            await fs.rm(fixturePath, { force: true });
        }
    });

    ogsTest("/img/* returns 404 on miss (not the SPA fallback)", async ({ request }) => {
        const response = await request.get(`/img/__does_not_exist_${crypto.randomUUID()}.jpg`);
        expect(response.status()).toBe(404);
        expect(response.headers()["content-type"]).toMatch(/text\/plain/);
    });

    ogsTest(
        "/img/* falls back to submodules/goban/assets/img (anime theme)",
        async ({ request }) => {
            const response = await request.get("/img/anime_board.svg");
            expect(response.status()).toBe(200);
            expect(response.headers()["content-type"]).toMatch(/svg/);
            expect((await response.body()).length).toBeGreaterThan(100);
        },
    );

    ogsTest(
        "cdn_release stays pinned to the dev server across the cached-config rehydrate path",
        async ({
            createContext,
        }: {
            createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
        }) => {
            const ctx = await createContext();
            // Seed localStorage to trigger the main.tsx cached-config rehydrate
            // branch that previously overwrote config.cdn_release on every reload.
            await ctx.addInitScript(() => {
                localStorage.setItem(
                    "ogs.cached.config",
                    JSON.stringify({
                        cdn_release: "https://cdn.online-go.com/5.1",
                        cdn: "https://cdn.online-go.com/",
                        cdn_host: "cdn.online-go.com",
                        user: { anonymous: true, id: 0, username: "Guest" },
                        e2e_rehydrate_pending: true,
                    }),
                );
            });
            const page = await ctx.newPage();
            // Wait deterministically for the async ui/config refresh to complete —
            // proves the test exercised the full config rehydrate cycle rather than
            // reading a transient value set synchronously by main.tsx.
            const [configResponse] = await Promise.all([
                page.waitForResponse(
                    (r) =>
                        r.request().method() === "GET" &&
                        /^\/api\/v\d+\/ui\/config$/.test(new URL(r.url()).pathname),
                    { timeout: 45_000 },
                ),
                page.goto("/"),
            ]);
            expect(configResponse.ok(), `Config response: HTTP ${configResponse.status()}`).toBe(
                true,
            );
            expect(await configResponse.finished()).toBeNull();
            await page.waitForFunction(() => {
                const config = (
                    window as unknown as { data?: { get: (key: string) => unknown } }
                ).data?.get("cached.config");
                return (
                    typeof config === "object" &&
                    config !== null &&
                    !("e2e_rehydrate_pending" in config)
                );
            });

            const { cdnRelease, cdn } = await page.evaluate(() => ({
                cdnRelease: (
                    window as unknown as { data: { get: (k: string) => unknown } }
                ).data?.get?.("config.cdn_release"),
                cdn: (window as unknown as { data: { get: (k: string) => unknown } }).data?.get?.(
                    "config.cdn",
                ),
            }));

            expect(cdnRelease).toEqual(expect.stringContaining("localhost"));
            expect(cdnRelease).not.toEqual(expect.stringContaining("cdn.online-go.com"));
            expect(cdn).toEqual(expect.stringContaining("localhost"));
        },
    );
});
