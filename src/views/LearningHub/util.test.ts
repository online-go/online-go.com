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
 * Lesson progress is one object per section, `learning-hub.<section>`, mapping
 * completed page numbers to true. Each device may hold pages the server has
 * not seen (completed while logged out, or before progress was replicated),
 * so reads must union the local and server copies, and writes must send that
 * union. These tests drive the real data module and deliver server rows the
 * way the socket does.
 */

import * as data from "@/lib/data";
import { socket } from "@/lib/sockets";
import {
    getSectionCompletion,
    getFirstUncompletedPage,
    setSectionPageCompleted,
    resetProgress,
} from "./util";

const SECTION = "rules-intro";
const KEY = `learning-hub.${SECTION}` as const;

const TEST_USER: rest_api.UserConfig = {
    anonymous: false,
    id: 123,
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

function serverRow(value: { [page: number]: true } | undefined, replication: data.Replication) {
    socket.emit("remote_storage/update", {
        key: KEY,
        value,
        replication: replication as unknown as number,
        modified: "2026-01-01T00:00:00.000Z",
    } as any);
}

describe("Learning Hub progress merging", () => {
    let send: jest.SpyInstance;

    beforeEach(() => {
        data.set("config.user", TEST_USER);
        // Setting "user" loads remote storage for that user id; acknowledgements
        // for sends made under any other id are discarded.
        data.set("user", TEST_USER);
        data.remove(KEY);
        serverRow(undefined, data.Replication.LOCAL_OVERWRITES_REMOTE);
        // Acknowledge every send so the write-ahead log does not leave a key
        // marked in flight from one test to the next.
        send = jest
            .spyOn(socket, "send")
            .mockImplementation(((_cmd: string, _args: unknown, cb?: (r: unknown) => void) =>
                cb?.({ success: true })) as unknown as typeof socket.send);
    });

    afterEach(() => {
        send.mockRestore();
    });

    test("counts pages completed on this device that the server copy lacks", () => {
        data.set(KEY, { 0: true, 1: true });
        serverRow({ 2: true }, data.Replication.LOCAL_OVERWRITES_REMOTE);

        expect(getSectionCompletion(SECTION).finished).toBe(3);
        expect(getFirstUncompletedPage(SECTION)).toBe(3);
    });

    test("completing a page sends the union of local and server progress", () => {
        data.set(KEY, { 0: true, 1: true });
        serverRow({ 2: true }, data.Replication.LOCAL_OVERWRITES_REMOTE);

        setSectionPageCompleted(SECTION, 3);

        expect(send).toHaveBeenCalledWith(
            "remote_storage/set",
            expect.objectContaining({
                key: KEY,
                value: { 0: true, 1: true, 2: true, 3: true },
                replication: data.Replication.LOCAL_OVERWRITES_REMOTE,
            }),
            expect.any(Function),
        );
        expect(getSectionCompletion(SECTION).finished).toBe(4);
    });

    test("reset clears progress on this device and removes it from the server", () => {
        data.set(KEY, { 0: true });
        serverRow({ 1: true }, data.Replication.LOCAL_OVERWRITES_REMOTE);

        resetProgress();

        expect(getSectionCompletion(SECTION).finished).toBe(0);
        expect(localStorage.getItem(`ogs.${KEY}`)).toBeNull();
        expect(send).toHaveBeenCalledWith(
            "remote_storage/remove",
            expect.objectContaining({
                key: KEY,
                replication: data.Replication.REMOTE_OVERWRITES_LOCAL,
            }),
            expect.any(Function),
        );
    });

    test("a reset replicated from another device clears this device's progress", () => {
        data.set(KEY, { 0: true, 1: true });
        serverRow({ 2: true }, data.Replication.LOCAL_OVERWRITES_REMOTE);
        expect(getSectionCompletion(SECTION).finished).toBe(3);

        serverRow(undefined, data.Replication.REMOTE_OVERWRITES_LOCAL);

        expect(getSectionCompletion(SECTION).finished).toBe(0);
    });
});
