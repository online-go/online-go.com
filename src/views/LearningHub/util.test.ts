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
    parsePageParam,
    canonicalPagePath,
    nextPageHref,
    pageHref,
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

describe("learning hub page URLs", () => {
    test.each<[string | undefined, number | undefined]>([
        ["23It", 23],
        ["10~~", 10],
        ["16     poti sa vezi cum se rezolva: ca nu stiu", 16],
        ["4. 這題怎樣解", 4],
        ["6c", 6],
        ["1.5", 1],
        ["07", 7],
        ["0", 0],
        ["abc", undefined],
        ["Infinity", undefined],
        ["-2", undefined],
        ["", undefined],
        [undefined, undefined],
    ])("parsePageParam(%j) is %j", (raw, expected) => {
        expect(parsePageParam(raw)).toBe(expected);
    });

    const CANONICAL_CASES: Array<[string, string | undefined, string | null]> = [
        ["/learn-to-play-go/bl1-ladder/10~~", "10~~", "/learn-to-play-go/bl1-ladder/10"],
        ["/learn-to-play-go/bl1-ladder/10%7E%7E", "10~~", "/learn-to-play-go/bl1-ladder/10"],
        [
            "/learn-to-play-go/bl1-calculate-escape/23It",
            "23It",
            "/learn-to-play-go/bl1-calculate-escape/23",
        ],
        [
            "/learn-to-play-go/bl1-capture3/16%20%20poti",
            "16  poti",
            "/learn-to-play-go/bl1-capture3/16",
        ],
        ["/docs/learn-to-play-go/ko/abc", "abc", "/docs/learn-to-play-go/ko"],
        ["/learning-hub/ko/99~~", "99~~", "/learning-hub/ko/99"],
        ["/learn-to-play-go/ko/abc/", "abc", "/learn-to-play-go/ko"],
        ["/learn-to-play-go/ko/4", "4", null],
        ["/learn-to-play-go/ko/07", "07", null],
        ["/learn-to-play-go/ko/99", "99", null],
        ["/learn-to-play-go/ko/0", "0", null],
        ["/learn-to-play-go/ko", undefined, null],
    ];

    test.each(CANONICAL_CASES)("canonicalPagePath(%j, %j) is %j", (pathname, raw, expected) => {
        expect(canonicalPagePath(pathname, raw)).toBe(expected);
    });

    test.each(CANONICAL_CASES.filter((c) => c[2] !== null))(
        "the redirect target for %j is already canonical",
        (_pathname, _raw, expected) => {
            const target = expected as string;
            const last = target.slice(target.lastIndexOf("/") + 1);
            const raw = /^[0-9]+$/.test(last) ? last : undefined;
            expect(canonicalPagePath(target, raw)).toBeNull();
        },
    );

    const canonicalPaths = CANONICAL_CASES.map(([pathname, , expected]) =>
        expected === null ? pathname : expected,
    );

    test.each(canonicalPaths)("navigation from canonical path %j stays in the section", (path) => {
        const match = /\/([0-9]+)$/.exec(path);
        const base = match ? path.slice(0, match.index) : path;
        const cur = match ? parseInt(match[1], 10) : 0;
        expect(nextPageHref(path, cur + 1)).toBe(`${base}/${cur + 1}`);
        expect(pageHref(path, 3)).toBe(`${base}/3`);
    });

    test("page dots on a path with a trailing slash append to the page segment", () => {
        expect(pageHref("/learn-to-play-go/ko/4/", 5)).toBe("/learn-to-play-go/ko/4/5");
    });

    test("next on a path with a junk suffix moves the suffix into the section segment", () => {
        expect(nextPageHref("/learn-to-play-go/bl1-ladder/10~~", 11)).toBe(
            "/learn-to-play-go/bl1-ladder~~/11",
        );
    });
});
