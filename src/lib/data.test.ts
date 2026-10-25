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
 * The socket calls a request callback as `cb(data, error)`. When the request
 * fails (server exception, closed socket, worker error) `data` is null or
 * undefined. A write that is queued while the socket is down is sent on
 * reconnect, and the write ahead log also re-sends it, so one key can get two
 * replies. These tests drive the remote storage code through those cases.
 */

import * as data from "@/lib/data";
import { socket } from "@/lib/sockets";

const USER_ID = 9876;
const KEY = "learning-hub.data-test" as const;
const WAL_KEY = `ogs-remote-storage-wal.${USER_ID}.${KEY}`;

const TEST_USER: rest_api.UserConfig = {
    anonymous: false,
    id: USER_ID,
    username: "test_user",
    registration_date: "2022-05-10 11:03:24.299562+00:00",
    ratings: {
        version: 5,
        overall: { rating: 1500, deviation: 350, volatility: 0.06 },
    },
    country: "un",
    professional: false,
    ranking: 23,
    provisional: 0,
    can_create_tournaments: true,
    is_moderator: false,
    is_superuser: false,
    moderator_powers: 0,
    offered_moderator_powers: 0,
    is_tournament_moderator: false,
    supporter: true,
    supporter_level: 4,
    tournament_admin: false,
    ui_class: "",
    icon: "",
    email: "",
    email_validated: false,
    is_announcer: false,
    last_supporter_trial: "",
};

type Callback = (res: unknown, err?: unknown) => void;
interface SentRequest {
    command: string;
    args: unknown;
    cb?: Callback;
}

describe("remote storage socket callbacks", () => {
    let sent: SentRequest[];
    let send: jest.SpyInstance;

    function sentFor(command: string): SentRequest[] {
        return sent.filter((r) => r.command === command);
    }

    beforeEach(() => {
        jest.useFakeTimers();
        localStorage.clear();
        data.set("config.user", TEST_USER);
        data.set("user", TEST_USER);
        sent = [];
        send = jest.spyOn(socket, "send").mockImplementation(((
            command: string,
            args: unknown,
            cb?: Callback,
        ) => {
            sent.push({ command, args, cb });
        }) as unknown as typeof socket.send);
    });

    afterEach(() => {
        // Acknowledge any write still in flight so that it does not stay
        // marked as in progress for the next test.
        for (const r of sent) {
            r.cb?.({ success: true });
        }
        // A disconnect cancels a pending wal retry timer.
        socket.emit("disconnect", 1006);
        send.mockRestore();
        jest.useRealTimers();
    });

    function reconnect() {
        socket.emit("disconnect", 1006);
        socket.emit("connect");
        jest.advanceTimersByTime(1);
    }

    test("two replies for one write after a reconnect do not throw", () => {
        data.set(KEY, { 1: true }, data.Replication.LOCAL_OVERWRITES_REMOTE);
        reconnect();

        const writes = sentFor("remote_storage/set");
        expect(writes).toHaveLength(2);

        expect(() => writes[0].cb?.({ success: true })).not.toThrow();
        expect(() => writes[1].cb?.({ success: true })).not.toThrow();
        expect(localStorage.getItem(WAL_KEY)).toBeNull();
    });

    test("replies that arrive in reverse order do not throw", () => {
        data.set(KEY, { 2: true }, data.Replication.LOCAL_OVERWRITES_REMOTE);
        reconnect();

        const writes = sentFor("remote_storage/set");
        expect(writes).toHaveLength(2);

        expect(() => writes[1].cb?.({ success: true })).not.toThrow();
        expect(() => writes[0].cb?.({ success: true })).not.toThrow();
        expect(localStorage.getItem(WAL_KEY)).toBeNull();
    });

    test("a failed write keeps the wal entry and is sent again", () => {
        data.set(KEY, { 3: true }, data.Replication.LOCAL_OVERWRITES_REMOTE);

        const writes = sentFor("remote_storage/set");
        expect(writes).toHaveLength(1);

        expect(() => writes[0].cb?.(undefined, new Error("Worker error"))).not.toThrow();
        expect(localStorage.getItem(WAL_KEY)).not.toBeNull();

        jest.advanceTimersByTime(6000);
        const retries = sentFor("remote_storage/set");
        expect(retries).toHaveLength(2);
        expect(retries[1].args).toEqual(writes[0].args);

        retries[1].cb?.({ success: true });
        expect(localStorage.getItem(WAL_KEY)).toBeNull();
    });

    test("a write that the server answers with null data is sent again", () => {
        data.set(KEY, { 4: true }, data.Replication.LOCAL_OVERWRITES_REMOTE);

        const writes = sentFor("remote_storage/set");
        expect(() => writes[0].cb?.(null, { code: "error", message: "boom" })).not.toThrow();

        jest.advanceTimersByTime(6000);
        expect(sentFor("remote_storage/set")).toHaveLength(2);
    });

    test("a failed sync does not throw and a later sync can run", () => {
        reconnect();

        const syncs = sentFor("remote_storage/sync");
        expect(syncs).toHaveLength(1);
        expect(() => syncs[0].cb?.(undefined, new Error("Socket disconnected"))).not.toThrow();
        expect(() => syncs[0].cb?.(null, { code: "error", message: "boom" })).not.toThrow();

        reconnect();
        expect(sentFor("remote_storage/sync")).toHaveLength(2);
    });

    for (const failure of ["socket error", "server retry"] as const) {
        test(`failing writes for several keys retry at a bounded rate (${failure})`, () => {
            let failing = true;
            send.mockImplementation(((command: string, args: unknown, cb?: Callback) => {
                sent.push({ command, args, cb });
                if (command !== "remote_storage/set") {
                    return;
                }
                setTimeout(() => {
                    if (!failing) {
                        cb?.({ success: true });
                    } else if (failure === "socket error") {
                        cb?.(undefined, { code: "error", message: "boom" });
                    } else {
                        cb?.({ error: "db down", retry: true });
                    }
                }, 100);
            }) as unknown as typeof socket.send);
            const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
            const error = jest.spyOn(console, "error").mockImplementation(() => {});
            // The retry delay is 3 s + 3 s * Math.random(). With the 100 ms
            // reply delay, these values start rounds 3.1 s to 5.8 s apart. The
            // values differ so that separate retry timers do not fire together.
            const random_values = [0, 0.5, 0.9];
            let random_calls = 0;
            const random = jest
                .spyOn(Math, "random")
                .mockImplementation(() => random_values[random_calls++ % random_values.length]);

            const keys = [
                "learning-hub.rate-1",
                "learning-hub.rate-2",
                "learning-hub.rate-3",
            ] as const;
            for (const key of keys) {
                data.set(key, { 1: true }, data.Replication.LOCAL_OVERWRITES_REMOTE);
            }
            expect(sentFor("remote_storage/set")).toHaveLength(keys.length);

            // Each 6 s window holds one or two retry rounds of one send per key.
            for (let round = 0; round < 20; ++round) {
                const before = sentFor("remote_storage/set").length;
                jest.advanceTimersByTime(6000);
                const sends = sentFor("remote_storage/set").length - before;
                expect(sends).toBeGreaterThanOrEqual(keys.length);
                expect(sends).toBeLessThanOrEqual(2 * keys.length);
                expect(jest.getTimerCount()).toBeLessThanOrEqual(keys.length + 1);
            }

            // Once the server accepts the writes, the wal empties.
            failing = false;
            jest.advanceTimersByTime(7000);
            for (const key of keys) {
                expect(localStorage.getItem(`ogs-remote-storage-wal.${USER_ID}.${key}`)).toBeNull();
            }

            warn.mockRestore();
            error.mockRestore();
            random.mockRestore();
        });
    }
});
