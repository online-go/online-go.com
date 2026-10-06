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

import type { DeviceInfo } from "goban";
import type { GameLayoutMode } from "@/components/GobanView/layout";

/** Mirrors `ogs/services/_shared/protocols/KibitzTelemetry.ts`. The server
 *  whitelists every value, so a drift here degrades to "unknown" there. */
export type KibitzTelemetryEvent =
    | "enter"
    | "leave"
    | "load_room"
    | "create_room"
    | "change_board"
    | "send_message"
    | "start_variation"
    | "post_variation"
    | "open_variation"
    | "heartbeat";

export type KibitzRoomKind = "preset" | "user" | "unknown";

export interface KibitzTelemetryPayload {
    event: KibitzTelemetryEvent;
    outcome: "ok" | "error";
    layout: GameLayoutMode | "unknown";
    room_kind: KibitzRoomKind;
    room_id: string | null;
    source?: "chat" | "list";
    reason?: "initial" | "switch";
    error?: string;
    active_ms?: number;
    device_info: DeviceInfo;
}

export interface KibitzTelemetryOptions {
    outcome?: "ok" | "error";
    source?: "chat" | "list";
    reason?: "initial" | "switch";
    error?: string;
}

export interface KibitzTelemetryDeps {
    send: (payload: KibitzTelemetryPayload) => void;
    deviceInfo: DeviceInfo;
}

const HEARTBEAT_MS = 60_000;

export function kibitzRoomKind(roomId: string | null): KibitzRoomKind {
    if (roomId?.startsWith("preset-")) {
        return "preset";
    }
    if (roomId?.startsWith("user-")) {
        return "user";
    }
    return "unknown";
}

/**
 * One Kibitz session's telemetry: context (room, layout), the visible-time
 * clock, the heartbeat, and the wire format. A no-op until `configure` gives
 * it a transport, so importing it costs nothing in tests and nothing on
 * pages that never enter Kibitz.
 */
export class KibitzTelemetry {
    private deps: KibitzTelemetryDeps | null = null;
    private active = false;
    private roomId: string | null = null;
    private layout: GameLayoutMode | "unknown" = "unknown";
    private visibleSince: number | null = null;
    private activeMs = 0;
    private heartbeat: ReturnType<typeof setInterval> | null = null;

    configure(deps: KibitzTelemetryDeps): void {
        this.deps = deps;
    }

    enter(): void {
        if (!this.deps || this.active) {
            return;
        }
        this.active = true;
        this.activeMs = 0;
        this.visibleSince = this.isVisible() ? Date.now() : null;
        document.addEventListener("visibilitychange", this.onVisibilityChange);
        window.addEventListener("pagehide", this.onPageHide);
        this.heartbeat = setInterval(() => {
            if (this.isVisible()) {
                this.send("heartbeat", {});
            }
        }, HEARTBEAT_MS);
        this.send("enter", {});
    }

    leave(): void {
        if (!this.active) {
            return;
        }
        this.settleClock();
        this.send("leave", { active_ms: this.activeMs });
        this.active = false;
        // The context belongs to the session that just ended; the next
        // session reports its own room and layout as it learns them.
        this.roomId = null;
        this.layout = "unknown";
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
        window.removeEventListener("pagehide", this.onPageHide);
        if (this.heartbeat) {
            clearInterval(this.heartbeat);
            this.heartbeat = null;
        }
    }

    setRoom(roomId: string | null): void {
        this.roomId = roomId;
    }

    setLayout(mode: GameLayoutMode): void {
        this.layout = mode;
    }

    record(event: KibitzTelemetryEvent, options: KibitzTelemetryOptions = {}): void {
        if (!this.active) {
            return;
        }
        this.send(event, options);
    }

    private send(
        event: KibitzTelemetryEvent,
        extra: KibitzTelemetryOptions & { active_ms?: number },
    ): void {
        if (!this.deps) {
            return;
        }
        const payload: KibitzTelemetryPayload = {
            event,
            outcome: extra.outcome ?? "ok",
            layout: this.layout,
            room_kind: kibitzRoomKind(this.roomId),
            room_id: this.roomId,
            device_info: this.deps.deviceInfo,
        };
        if (extra.source) {
            payload.source = extra.source;
        }
        if (extra.reason) {
            payload.reason = extra.reason;
        }
        if (extra.error) {
            payload.error = extra.error;
        }
        if (extra.active_ms !== undefined) {
            payload.active_ms = extra.active_ms;
        }
        this.deps.send(payload);
    }

    private isVisible(): boolean {
        return document.visibilityState === "visible";
    }

    /** Folds the current visible stretch into `activeMs` and restarts it if
     *  still visible. */
    private settleClock(): void {
        const now = Date.now();
        if (this.visibleSince !== null) {
            this.activeMs += now - this.visibleSince;
        }
        this.visibleSince = this.isVisible() ? now : null;
    }

    private onVisibilityChange = (): void => {
        this.settleClock();
    };

    private onPageHide = (): void => {
        this.leave();
    };
}

export const kibitzTelemetry = new KibitzTelemetry();
