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

import { KibitzTelemetry, type KibitzTelemetryPayload } from "./kibitzTelemetry";

function setVisibility(state: DocumentVisibilityState) {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
    document.dispatchEvent(new Event("visibilitychange"));
}

describe("KibitzTelemetry", () => {
    let sent: KibitzTelemetryPayload[];
    let telemetry: KibitzTelemetry;

    beforeEach(() => {
        jest.useFakeTimers();
        setVisibility("visible");
        sent = [];
        telemetry = new KibitzTelemetry();
        telemetry.configure({
            send: (payload) => sent.push(payload),
            deviceInfo: {
                mobile: false,
                manufacturer: "Apple",
                os_name: "macOS",
                browser_name: "Chrome",
                useragent: "test-agent",
            },
        });
    });

    afterEach(() => {
        telemetry.leave();
        jest.useRealTimers();
    });

    it("sends nothing before enter or after leave", () => {
        telemetry.record("create_room");
        expect(sent).toHaveLength(0);
        telemetry.enter();
        telemetry.leave();
        telemetry.record("create_room");
        expect(sent.map((p) => p.event)).toEqual(["enter", "leave"]);
    });

    it("stamps room, room_kind, layout and device info on every event", () => {
        telemetry.enter();
        telemetry.setLayout("compactHorizontal");
        telemetry.setRoom("preset-english-chat-live");
        telemetry.record("send_message");
        expect(sent[1]).toEqual({
            event: "send_message",
            outcome: "ok",
            layout: "compactHorizontal",
            room_kind: "preset",
            room_id: "preset-english-chat-live",
            device_info: {
                mobile: false,
                manufacturer: "Apple",
                os_name: "macOS",
                browser_name: "Chrome",
                useragent: "test-agent",
            },
        });
        telemetry.setRoom("user-42");
        telemetry.record("open_variation", { source: "list" });
        expect(sent[2].room_kind).toBe("user");
        expect(sent[2].source).toBe("list");
        telemetry.setRoom(null);
        telemetry.record("load_room", { outcome: "error", error: "boom", reason: "switch" });
        expect(sent[3]).toMatchObject({
            room_kind: "unknown",
            room_id: null,
            outcome: "error",
            error: "boom",
            reason: "switch",
        });
    });

    it("reports layout as unknown until setLayout is called", () => {
        telemetry.enter();
        expect(sent[0].layout).toBe("unknown");
    });

    it("heartbeats every 60 seconds only while the tab is visible", () => {
        telemetry.enter();
        jest.advanceTimersByTime(60_000);
        expect(sent.filter((p) => p.event === "heartbeat")).toHaveLength(1);
        setVisibility("hidden");
        jest.advanceTimersByTime(180_000);
        expect(sent.filter((p) => p.event === "heartbeat")).toHaveLength(1);
        setVisibility("visible");
        jest.advanceTimersByTime(60_000);
        expect(sent.filter((p) => p.event === "heartbeat")).toHaveLength(2);
    });

    it("counts only visible time in leave.active_ms", () => {
        telemetry.enter();
        jest.advanceTimersByTime(30_000);
        setVisibility("hidden");
        jest.advanceTimersByTime(3_600_000);
        setVisibility("visible");
        jest.advanceTimersByTime(15_000);
        telemetry.leave();
        const leave = sent.find((p) => p.event === "leave");
        expect(leave?.active_ms).toBe(45_000);
    });

    it("sends leave on pagehide and does not send it twice", () => {
        telemetry.enter();
        window.dispatchEvent(new Event("pagehide"));
        telemetry.leave();
        expect(sent.filter((p) => p.event === "leave")).toHaveLength(1);
    });

    it("is a no-op before configure", () => {
        const bare = new KibitzTelemetry();
        expect(() => {
            bare.enter();
            bare.record("create_room");
            bare.leave();
        }).not.toThrow();
    });
});
