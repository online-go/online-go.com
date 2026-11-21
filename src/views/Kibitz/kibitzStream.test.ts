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

import {
    isValidStreamChannel,
    readStreamChoice,
    resolveKibitzStream,
    twitchChatUrl,
    twitchPlayerUrl,
    writeStreamChoice,
} from "./kibitzStream";

const roomStream = { source: "twitch" as const, channel: "RoomChannel" };

describe("resolveKibitzStream", () => {
    it("shows nothing when the room has no stream and the viewer chose none", () => {
        expect(resolveKibitzStream(null, undefined)).toEqual({
            channel: null,
            isRoomStream: false,
            hidden: false,
        });
    });

    it("shows the room's stream by default", () => {
        expect(resolveKibitzStream(roomStream, undefined)).toEqual({
            channel: "RoomChannel",
            isRoomStream: true,
            hidden: false,
        });
    });

    it("prefers the viewer's own stream over the room's", () => {
        expect(resolveKibitzStream(roomStream, { channel: "other" })).toEqual({
            channel: "other",
            isRoomStream: false,
            hidden: false,
        });
    });

    it("treats the room's channel in another case as the room's stream", () => {
        expect(resolveKibitzStream(roomStream, { channel: "roomchannel" }).isRoomStream).toBe(true);
    });

    it("lets a viewer watch a stream in a room that has none", () => {
        expect(resolveKibitzStream(null, { channel: "other" }).channel).toBe("other");
    });

    it("hides the stream for a viewer who hid it", () => {
        expect(resolveKibitzStream(roomStream, { hidden: true })).toEqual({
            channel: null,
            isRoomStream: false,
            hidden: true,
        });
    });

    it("ignores a hidden flag when there is no stream to hide", () => {
        expect(resolveKibitzStream(null, { hidden: true }).hidden).toBe(false);
    });

    it("never plays a malformed channel", () => {
        const bad = { source: "twitch" as const, channel: "x&parent=evil.example" };
        expect(resolveKibitzStream(bad, undefined).channel).toBeNull();
        expect(resolveKibitzStream(roomStream, { channel: "../x" }).channel).toBe("RoomChannel");
    });
});

describe("isValidStreamChannel", () => {
    it.each([
        ["gochannel", true],
        ["Go_Channel_42", true],
        ["", false],
        ["has space", false],
        ["a".repeat(26), false],
    ])("%s → %s", (channel, valid) => {
        expect(isValidStreamChannel(channel)).toBe(valid);
    });
});

describe("stream choice storage", () => {
    it("keeps each room's choice apart and forgets an empty one", () => {
        writeStreamChoice("room-a", { hidden: true });
        writeStreamChoice("room-b", { channel: "other" });
        expect(readStreamChoice("room-a")).toEqual({ hidden: true });
        expect(readStreamChoice("room-b")).toEqual({ channel: "other" });

        writeStreamChoice("room-a", undefined);
        expect(readStreamChoice("room-a")).toBeUndefined();
        expect(readStreamChoice("room-b")).toEqual({ channel: "other" });
    });
});

describe("embed urls", () => {
    it("names the page's host as the parent Twitch requires", () => {
        const url = new URL(twitchPlayerUrl("gochannel"));
        expect(url.host).toBe("player.twitch.tv");
        expect(url.searchParams.get("channel")).toBe("gochannel");
        expect(url.searchParams.get("parent")).toBe(window.location.hostname);
    });

    it("asks for the dark chat only on a dark theme", () => {
        expect(twitchChatUrl("gochannel", true)).toContain("darkpopout");
        expect(twitchChatUrl("gochannel", false)).not.toContain("darkpopout");
    });
});
