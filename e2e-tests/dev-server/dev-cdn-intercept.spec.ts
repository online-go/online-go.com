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
 * The first test fetches a fixture file we create at runtime (so no CDN or
 * cache can produce a false positive) and verifies the bytes round-trip.
 * The second seeds localStorage to trigger the cached-config rehydrate path
 * that previously clobbered cdn_release, then asserts the dev-server pin held.
 *
 * This spec is an intentional exception to the "avoid direct API calls" rule
 * in e2e-tests/CLAUDE.md — it is testing dev-server behavior, not user flows,
 * and the in-browser `fetch()` + fixture design is the only reliable way to
 * detect the failure modes above.
 */

import { expect } from "@playwright/test";
import { ogsTest } from "@helpers";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_IMG_DIR = path.resolve(currentDir, "../../assets/img");

ogsTest.describe("@DevServer dev-server /img middleware + cdn_release pin", () => {
    let fixtureName: string;
    let fixturePath: string;
    let expectedSha: string;

    ogsTest.beforeAll(async () => {
        const token = crypto.randomUUID();
        fixtureName = `__probe_${token}.bin`;
        fixturePath = path.join(ASSETS_IMG_DIR, fixtureName);
        const bytes = Buffer.from(`OGS-MIDDLEWARE-PROBE-${token}`);
        expectedSha = crypto.createHash("sha256").update(bytes).digest("hex");
        await fs.writeFile(fixturePath, bytes);
    });

    ogsTest.afterAll(async () => {
        await fs.unlink(fixturePath).catch(() => {});
    });

    ogsTest("/img/* serves fresh bytes from assets/img on disk", async ({ page }) => {
        await page.goto("/");
        const result = await page.evaluate(async (name: string) => {
            const res = await fetch(`/img/${name}`, { cache: "no-store" });
            const buf = new Uint8Array(await res.arrayBuffer());
            return { status: res.status, bytes: Array.from(buf) };
        }, fixtureName);

        expect(result.status).toBe(200);
        const actualSha = crypto
            .createHash("sha256")
            .update(Buffer.from(result.bytes))
            .digest("hex");
        expect(actualSha).toBe(expectedSha);
    });

    ogsTest("/img/* returns 404 on miss (not the SPA fallback)", async ({ page }) => {
        // If this starts returning 200, someone restored the `next()` path in the
        // /img middleware and broken textures will silently show as index.html.
        await page.goto("/");
        const missed = await page.evaluate(async () => {
            const res = await fetch(`/img/__does_not_exist_${Date.now()}.jpg`, {
                cache: "no-store",
            });
            return { status: res.status, ct: res.headers.get("content-type") };
        });
        expect(missed.status).toBe(404);
        expect(missed.ct).toMatch(/text\/plain/);
    });

    ogsTest("/img/* falls back to submodules/goban/assets/img (anime theme)", async ({ page }) => {
        // anime_*.svg only live in the goban submodule, not in the main repo's
        // assets/img/. Confirms the middleware searches multiple asset roots.
        await page.goto("/");
        const anime = await page.evaluate(async () => {
            const res = await fetch("/img/anime_board.svg", { cache: "no-store" });
            return {
                status: res.status,
                ct: res.headers.get("content-type"),
                size: (await res.blob()).size,
            };
        });
        expect(anime.status).toBe(200);
        expect(anime.ct).toMatch(/svg/);
        expect(anime.size).toBeGreaterThan(100);
    });

    ogsTest(
        "cdn_release stays pinned to the dev server across the cached-config rehydrate path",
        async ({ browser }) => {
            const ctx = await browser.newContext();
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
                    }),
                );
            });
            const page = await ctx.newPage();
            // Wait deterministically for the async ui/config refresh to complete —
            // proves the test exercised the full config rehydrate cycle rather than
            // reading a transient value set synchronously by main.tsx.
            const [_configResponse] = await Promise.all([
                page.waitForResponse(
                    (r) => /\/api\/v\d+\/ui\/config/.test(r.url()) && r.status() === 200,
                    { timeout: 15_000 },
                ),
                page.goto("/"),
            ]);

            const { cdnRelease, cdn } = await page.evaluate(() => ({
                cdnRelease: (
                    window as unknown as { data: { get: (k: string) => unknown } }
                ).data?.get?.("config.cdn_release"),
                cdn: (window as unknown as { data: { get: (k: string) => unknown } }).data?.get?.(
                    "config.cdn",
                ),
            }));
            await ctx.close();

            expect(cdnRelease).toEqual(expect.stringContaining("localhost"));
            expect(cdnRelease).not.toEqual(expect.stringContaining("cdn.online-go.com"));
            expect(cdn).toEqual(expect.stringContaining("localhost"));
        },
    );
});
