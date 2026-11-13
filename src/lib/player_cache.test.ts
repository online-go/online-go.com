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

import { get } from "@/lib/requests";
import { fetch, Subscriber, update } from "@/lib/player_cache";

jest.mock("@/lib/debug", () => ({
    __esModule: true,
    default: function Debug() {
        return { log() {}, warn() {}, error() {} };
    },
}));

jest.mock("@/lib/requests", () => ({
    get: jest.fn(),
}));

function flush(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("player_cache.fetch", () => {
    beforeEach(() => {
        jest.mocked(get).mockReset();
    });

    it("rejects a batch with no responseJSON, clears it, and allows a retry", async () => {
        jest.mocked(get).mockRejectedValueOnce(new Error("network"));
        const pending = fetch(501);
        await flush();
        await expect(pending).rejects.toThrow("network");

        jest.mocked(get).mockResolvedValueOnce([{ id: 501, username: "retry", ui_class: "" }]);
        const again = fetch(501);
        await flush();
        await expect(again).resolves.toMatchObject({ id: 501, username: "retry" });
        expect(get).toHaveBeenCalledTimes(2);
    });

    it("does not refetch a missing player when an icon listener asks again", async () => {
        const calls: string[] = [];
        jest.mocked(get).mockImplementation((_url: string, params?: { ids?: string }) => {
            const ids = params?.ids ?? "";
            calls.push(ids);
            if (ids.split(".").includes("602")) {
                return Promise.reject({ error: "Player 602 not found in cassandra" });
            }
            return Promise.resolve(
                ids.split(".").map((id) => ({
                    id: Number(id),
                    username: id === "601" ? "one" : "three",
                    ui_class: id === "603" ? "bot" : "",
                })),
            );
        });

        // Same path as PlayerIcon: a cache update with no icon fetches ["icon"].
        const subscriber = new Subscriber((player) => {
            if (!player.icon) {
                void fetch(player.id, ["icon"]).catch(() => undefined);
            }
        });
        subscriber.on(602);

        const first = fetch(601);
        const missing = fetch(602);
        const third = fetch(603);

        await flush();
        await expect(missing).rejects.toEqual({ error: "Player 602 not found in cassandra" });
        await flush();
        await flush();

        expect(calls).toEqual(["601.602.603", "601.603"]);
        await expect(first).resolves.toMatchObject({ id: 601, username: "one" });
        await expect(third).resolves.toMatchObject({ id: 603, ui_class: "bot" });
        subscriber.off(602);
    });

    it("refetches ui_class when the cached value is [ERROR] or undefined", async () => {
        update({ id: 702, username: "Partial", ui_class: undefined });
        jest.mocked(get).mockResolvedValueOnce([{ id: 702, username: "Partial", ui_class: "" }]);
        const missing = fetch(702, ["ui_class"]);
        await flush();
        await expect(missing).resolves.toMatchObject({ id: 702, ui_class: "" });

        jest.mocked(get).mockResolvedValueOnce([{ id: 701, username: "Broken" }]);
        const broken = fetch(701, ["ui_class"]);
        await flush();
        await expect(broken).resolves.toMatchObject({ ui_class: "[ERROR]" });

        const callsAfterError = jest.mocked(get).mock.calls.length;
        await expect(fetch(701, ["ui_class"])).resolves.toMatchObject({ ui_class: "[ERROR]" });
        expect(jest.mocked(get).mock.calls.length).toBe(callsAfterError);

        jest.mocked(get).mockResolvedValueOnce([{ id: 701, username: "Broken", ui_class: "bot" }]);
        const refreshed = fetch(701, ["ui_class"], { refresh: true });
        await flush();
        await expect(refreshed).resolves.toMatchObject({ ui_class: "bot" });
        expect(jest.mocked(get).mock.calls.length).toBe(callsAfterError + 1);
    });
});
