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
import { fetch } from "@/lib/player_cache";

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

    it("settles a missing player and still loads the rest of the batch", async () => {
        jest.mocked(get)
            .mockRejectedValueOnce({
                responseJSON: { error: "Player 602 not found in cassandra" },
            })
            .mockResolvedValueOnce([
                { id: 601, username: "one", ui_class: "" },
                { id: 603, username: "three", ui_class: "bot" },
            ]);

        const first = fetch(601);
        const missing = fetch(602);
        const third = fetch(603);

        await flush();
        await expect(missing).rejects.toMatchObject({
            responseJSON: { error: "Player 602 not found in cassandra" },
        });

        await flush();
        await expect(first).resolves.toMatchObject({ id: 601, username: "one" });
        await expect(third).resolves.toMatchObject({ id: 603, username: "three", ui_class: "bot" });

        const ids = jest.mocked(get).mock.calls.map((call) => (call[1] as { ids: string }).ids);
        expect(ids).toEqual(["601.602.603", "601.603"]);
    });
});
