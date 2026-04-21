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

import { EventEmitter } from "eventemitter3";
import * as data from "@/lib/data";
import type { GobanController } from "@/lib/GobanController";
import { updateCachedChannelInformation } from "@/lib/chat_manager";
import { get, post } from "@/lib/requests";
import { socket } from "@/lib/sockets";
import { push_manager } from "@/components/UIPush/UIPush";
import type {
    KibitzDebugState,
    KibitzMode,
    KibitzProposal,
    KibitzRoom,
    KibitzRoomSummary,
    KibitzRoomUser,
    KibitzSecondaryPaneState,
    KibitzStreamItem,
    KibitzVariationSummary,
    KibitzWatchedGame,
} from "@/models/kibitz";

interface KibitzControllerEvents {
    "rooms-changed": (rooms: KibitzRoomSummary[]) => void;
    "room-changed": (room: KibitzRoom | null) => void;
    "stream-changed": (items: KibitzStreamItem[]) => void;
    "proposals-changed": (proposals: KibitzProposal[]) => void;
    "variations-changed": (variations: KibitzVariationSummary[]) => void;
    "secondary-pane-changed": (state: KibitzSecondaryPaneState) => void;
    "debug-changed": (state: KibitzDebugState) => void;
}

type UIPushHandler = ReturnType<typeof push_manager.on>;

interface BackendKibitzRoom {
    id: string;
    channel: string;
    title: string;
    kind: "user" | "preset" | "broadcast";
    description: string | null;
    current_game_id: number | null;
    creator_id: number | null;
    created_at: string;
    last_activity_at: string;
    settings?: Record<string, unknown>;
    viewer_count?: number;
}

interface BackendRoomDetailResponse {
    room: BackendKibitzRoom;
    permissions: Record<string, boolean>;
}

const DIRECTORY_CHANNEL = "kibitz-rooms";

function mapBackendRoomToSummary(backend: BackendKibitzRoom): KibitzRoomSummary {
    return {
        id: backend.id,
        channel: backend.channel,
        title: backend.title,
        kind: backend.kind,
        viewer_count: backend.viewer_count ?? 0,
        description: backend.description ?? undefined,
    };
}

function mapBackendRoomToFull(backend: BackendKibitzRoom): KibitzRoom {
    return {
        ...mapBackendRoomToSummary(backend),
        users: [],
        active_chatters: [],
        friends_in_room: [],
        active_variation_ids: [],
    };
}

interface BackendGameForKibitz {
    id: number;
    name?: string | null;
    width?: number;
    height?: number;
    black?: { id: number; username: string; ranking?: number } | null;
    white?: { id: number; username: string; ranking?: number } | null;
    ended?: string | null;
    json?: { moves?: unknown[] } | null;
    tournament_name?: string;
}

function mapBackendUser(
    raw: { id: number; username: string; ranking?: number } | null | undefined,
): KibitzRoomUser {
    if (!raw) {
        return { id: 0, username: "", ranking: 0, professional: false, ui_class: "" };
    }
    return {
        id: raw.id,
        username: raw.username,
        ranking: raw.ranking ?? 0,
        professional: false,
        ui_class: "",
    };
}

function mapBackendGameToWatched(game: BackendGameForKibitz): KibitzWatchedGame | undefined {
    if (typeof game.width !== "number" || typeof game.height !== "number") {
        return undefined;
    }
    return {
        game_id: game.id,
        board_size: `${game.width}x${game.height}` as `${number}x${number}`,
        title: game.name ?? "",
        black: mapBackendUser(game.black),
        white: mapBackendUser(game.white),
        tournament_name: game.tournament_name,
        move_number: game.json?.moves?.length,
        live: game.ended == null,
    };
}

async function lookupGameForKibitz(gameId: number): Promise<KibitzWatchedGame | undefined> {
    try {
        const game = (await get(`games/${gameId}`)) as BackendGameForKibitz;
        return mapBackendGameToWatched(game);
    } catch (error) {
        console.warn("kibitz: game lookup failed", gameId, error);
        return undefined;
    }
}

export class KibitzController extends EventEmitter<KibitzControllerEvents> {
    private _destroyed = false;
    private _rooms: KibitzRoomSummary[] = [];
    private _active_room: KibitzRoom | null = null;
    private _stream: KibitzStreamItem[] = [];
    private _proposals: KibitzProposal[] = [];
    private _variations: KibitzVariationSummary[] = [];
    private _secondary_pane: KibitzSecondaryPaneState = { collapsed: true, size: "small" };
    private _debug: KibitzDebugState = {
        mode: "live",
        socket_connected: socket.connected,
        status: "idle",
        rooms: [],
    };

    private _directory_handlers: UIPushHandler[] = [];
    private _active_room_handlers: UIPushHandler[] = [];
    private _active_room_channel: string | null = null;

    /**
     * Monotonically increasing token incremented on every selectRoom call.
     * If the token changes between starting an async hydration and finishing
     * it, the result is stale and should be discarded.
     */
    private _select_room_token = 0;

    public get mode(): KibitzMode {
        return "live";
    }

    public get destroyed(): boolean {
        return this._destroyed;
    }

    public get rooms(): KibitzRoomSummary[] {
        return this._rooms;
    }

    public get active_room(): KibitzRoom | null {
        return this._active_room;
    }

    public get stream(): KibitzStreamItem[] {
        return this._stream;
    }

    public get proposals(): KibitzProposal[] {
        return this._proposals;
    }

    public get variations(): KibitzVariationSummary[] {
        return this._variations;
    }

    public get secondary_pane(): KibitzSecondaryPaneState {
        return this._secondary_pane;
    }

    public get debug(): KibitzDebugState {
        return this._debug;
    }

    public get default_room_id(): string | null {
        return this._rooms[0]?.id ?? null;
    }

    constructor() {
        super();

        this._directory_handlers.push(
            push_manager.on("room-created", this.onRoomCreated),
            push_manager.on("room-removed", this.onRoomRemoved),
        );
        push_manager.subscribe(DIRECTORY_CHANNEL);

        void this.refreshRooms();
    }

    public destroy(): void {
        if (this._destroyed) {
            return;
        }
        this._destroyed = true;

        for (const handler of this._directory_handlers) {
            push_manager.off(handler);
        }
        this._directory_handlers = [];
        push_manager.unsubscribe(DIRECTORY_CHANNEL);

        this.unsubscribeActiveRoom();
    }

    public setRooms(rooms: KibitzRoomSummary[]): void {
        this._rooms = rooms;
        for (const room of rooms) {
            updateCachedChannelInformation(room.channel, {
                id: room.channel,
                name: room.title,
            });
        }
        this.emit("rooms-changed", this._rooms);
    }

    public setActiveRoom(room: KibitzRoom | null): void {
        this._active_room = room;
        this.emit("room-changed", this._active_room);
    }

    public setStream(items: KibitzStreamItem[]): void {
        this._stream = items;
        this.emit("stream-changed", this._stream);
    }

    public setProposals(proposals: KibitzProposal[]): void {
        this._proposals = proposals;
        this.emit("proposals-changed", this._proposals);
    }

    public setVariations(variations: KibitzVariationSummary[]): void {
        this._variations = variations;
        this.emit("variations-changed", this._variations);
    }

    public setSecondaryPane(state: KibitzSecondaryPaneState): void {
        this._secondary_pane = state;
        this.emit("secondary-pane-changed", this._secondary_pane);
    }

    public setDebug(state: KibitzDebugState): void {
        this._debug = state;
        this.emit("debug-changed", this._debug);
    }

    private async refreshRooms(): Promise<void> {
        this.setDebug({
            ...this._debug,
            mode: "live",
            socket_connected: socket.connected,
            status: "loading",
            error: undefined,
            last_hydration_started_at: Date.now(),
            rooms: [],
        });

        try {
            const payload = (await get("kibitz/rooms")) as BackendKibitzRoom[];
            const rooms = (payload ?? []).map(mapBackendRoomToSummary);
            this.setRooms(rooms);
            this.setDebug({
                ...this._debug,
                status: "ready",
                last_hydration_finished_at: Date.now(),
            });

            // Resolve each room's current_game in parallel so the room cards
            // show the watched game instead of "No game selected".
            for (const backend of payload ?? []) {
                if (backend.current_game_id) {
                    void this.hydrateRoomCardGame(backend.id, backend.current_game_id);
                }
            }
        } catch (error) {
            this.setDebug({
                ...this._debug,
                status: "error",
                last_hydration_finished_at: Date.now(),
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    private async hydrateRoomCardGame(roomId: string, gameId: number): Promise<void> {
        const game = await lookupGameForKibitz(gameId);
        if (this._destroyed || !game) {
            return;
        }
        const updated = this._rooms.map((room) =>
            room.id === roomId ? { ...room, current_game: game } : room,
        );
        // Reference equality check: only update if something actually changed.
        if (updated.some((room, i) => room !== this._rooms[i])) {
            this.setRooms(updated);
        }
    }

    private onRoomCreated = (incoming: BackendKibitzRoom) => {
        if (this._rooms.some((room) => room.id === incoming.id)) {
            return;
        }
        const summary = mapBackendRoomToSummary(incoming);
        this.setRooms([summary, ...this._rooms]);
        if (incoming.current_game_id) {
            void this.hydrateRoomCardGame(incoming.id, incoming.current_game_id);
        }
    };

    private onRoomRemoved = (payload: { id?: string } | string | undefined) => {
        const id = typeof payload === "string" ? payload : payload?.id;
        if (!id) {
            return;
        }
        this.setRooms(this._rooms.filter((room) => room.id !== id));
        if (this._active_room?.id === id) {
            this.unsubscribeActiveRoom();
            this.setActiveRoom(null);
            this.setStream([]);
            this.setVariations([]);
        }
    };

    private onBoardChanged = (incoming: BackendKibitzRoom) => {
        if (!incoming || !incoming.id) {
            return;
        }
        const summary = mapBackendRoomToSummary(incoming);
        this.setRooms(
            this._rooms.map((room) => (room.id === incoming.id ? { ...room, ...summary } : room)),
        );
        if (this._active_room?.id === incoming.id) {
            this.setActiveRoom({
                ...this._active_room,
                ...summary,
            });
            void this.hydrateActiveRoomGame(incoming.current_game_id, this._select_room_token);
        }
        if (incoming.current_game_id) {
            void this.hydrateRoomCardGame(incoming.id, incoming.current_game_id);
        }
    };

    private onRoomUpdated = (incoming: BackendKibitzRoom) => {
        // Same handling as board-changed: refresh local copies of the room.
        this.onBoardChanged(incoming);
    };

    private subscribeActiveRoom(channel: string): void {
        if (this._active_room_channel === channel) {
            return;
        }
        this.unsubscribeActiveRoom();

        this._active_room_handlers.push(
            push_manager.on("board-changed", this.onBoardChanged),
            push_manager.on("room-updated", this.onRoomUpdated),
        );
        push_manager.subscribe(channel);
        this._active_room_channel = channel;
    }

    private unsubscribeActiveRoom(): void {
        for (const handler of this._active_room_handlers) {
            push_manager.off(handler);
        }
        this._active_room_handlers = [];
        if (this._active_room_channel) {
            push_manager.unsubscribe(this._active_room_channel);
            this._active_room_channel = null;
        }
    }

    public async selectRoom(roomId: string | null): Promise<void> {
        const token = ++this._select_room_token;

        if (!roomId) {
            this.unsubscribeActiveRoom();
            this.setActiveRoom(null);
            this.setStream([]);
            this.setVariations([]);
            this.setProposals([]);
            return;
        }

        try {
            const payload = (await get(`kibitz/rooms/${roomId}`)) as BackendRoomDetailResponse;
            if (token !== this._select_room_token || this._destroyed) {
                return;
            }

            const full = mapBackendRoomToFull(payload.room);
            this.subscribeActiveRoom(full.channel);
            this.setActiveRoom(full);
            // Stream + variations come from chat history in 1C-b; empty for now.
            this.setStream([]);
            this.setVariations([]);
            this.setProposals([]);
            this.setSecondaryPane({
                collapsed: true,
                size: "small",
            });

            void this.hydrateActiveRoomGame(payload.room.current_game_id, token);
        } catch (error) {
            if (token !== this._select_room_token || this._destroyed) {
                return;
            }
            this.unsubscribeActiveRoom();
            this.setActiveRoom(null);
            this.setStream([]);
            this.setVariations([]);
            this.setProposals([]);
            console.warn("kibitz: failed to hydrate room", roomId, error);
        }
    }

    /**
     * Resolve `current_game_id` to a populated `KibitzWatchedGame` for the
     * active room. Fired async after hydration / board changes so the board
     * pane can render the actual game rather than a placeholder.
     */
    private async hydrateActiveRoomGame(
        gameId: number | null | undefined,
        token: number,
    ): Promise<void> {
        if (!gameId) {
            return;
        }
        const game = await lookupGameForKibitz(gameId);
        if (token !== this._select_room_token || this._destroyed) {
            return;
        }
        if (!game) {
            return;
        }
        if (this._active_room && this._active_room.current_game?.game_id !== gameId) {
            this.setActiveRoom({ ...this._active_room, current_game: game });
        } else if (this._active_room) {
            // Same game id; refresh in case other fields changed.
            this.setActiveRoom({ ...this._active_room, current_game: game });
        }
    }

    public async createRoom(
        game: KibitzWatchedGame,
        roomName: string,
        description: string,
    ): Promise<string | null> {
        try {
            const payload = (await post("kibitz/rooms", {
                source_game_id: game.game_id,
                title: roomName.trim() || game.title,
                description: description.trim() || undefined,
            })) as BackendKibitzRoom;

            // Insert locally so the UI updates immediately; the room-created
            // UIPush broadcast will arrive too and be deduped by id.
            this.onRoomCreated(payload);
            void this.selectRoom(payload.id);
            return payload.id;
        } catch (error) {
            console.warn("kibitz: createRoom failed", error);
            return null;
        }
    }

    public async changeBoard(roomId: string, game: KibitzWatchedGame): Promise<boolean> {
        try {
            const payload = (await post(`kibitz/rooms/${roomId}/change-board`, {
                game_id: game.game_id,
            })) as BackendKibitzRoom;

            // Apply locally; board-changed UIPush will arrive and be a no-op
            // because the resulting summary will already match.
            this.onBoardChanged(payload);
            return true;
        } catch (error) {
            console.warn("kibitz: changeBoard failed", roomId, error);
            return false;
        }
    }

    /**
     * Phase 1C-a: chat send is not yet wired (1C-b will route through
     * chat_manager). Keep the signature so callers in Kibitz.tsx don't break.
     */
    public sendMessage(_roomId: string, _text: string): void {
        // 1C-b
    }

    /**
     * Phase 1C-a: variation posting is not yet wired (1C-b adapts shareAnalysis).
     * Keep the signature so callers in Kibitz.tsx don't break.
     */
    public postVariation(_roomId: string, _boardController: GobanController): boolean {
        return false;
    }

    /**
     * Phase 2 — proposals/voting are out of scope; signature preserved.
     */
    public voteOnProposal(_proposalId: string, _choice: "change" | "keep"): void {
        // Phase 2
    }

    public previewGame(gameId: number): void {
        this.setSecondaryPane({
            ...this._secondary_pane,
            collapsed: false,
            size: this._secondary_pane.size ?? "small",
            preview_game_id: gameId,
            variation_id: undefined,
            variation_source_game_id: undefined,
            variation_source_game: undefined,
        });
    }

    public startVariationFromCurrentBoard(): void {
        const currentGameId = this._active_room?.current_game?.game_id;
        if (!currentGameId) {
            return;
        }

        this.setSecondaryPane({
            ...this._secondary_pane,
            collapsed: false,
            size: "equal",
            preview_game_id: currentGameId,
            variation_id: undefined,
            variation_source_game_id: currentGameId,
            variation_source_game: this._active_room?.current_game
                ? { ...this._active_room.current_game }
                : undefined,
        });
    }

    public clearPreviewGame(): void {
        this.setSecondaryPane({
            ...this._secondary_pane,
            size: this._secondary_pane.size ?? "small",
            preview_game_id: undefined,
            variation_id: undefined,
            variation_source_game_id: undefined,
            variation_source_game: undefined,
        });
    }

    public openVariation(variationId: string): void {
        this.setSecondaryPane({
            ...this._secondary_pane,
            collapsed: false,
            size: "equal",
            preview_game_id: undefined,
            variation_id: variationId,
            variation_source_game_id: undefined,
            variation_source_game: undefined,
        });
    }

    public setSecondaryPaneMode(mode: "hidden" | "small" | "equal"): void {
        if (mode === "hidden") {
            this.setSecondaryPane({
                ...this._secondary_pane,
                collapsed: true,
                size: this._secondary_pane.size ?? "small",
            });
            return;
        }

        this.setSecondaryPane({
            ...this._secondary_pane,
            collapsed: false,
            size: mode,
        });
    }

    public increaseSecondaryPaneSize(): void {
        if (this._secondary_pane.collapsed) {
            this.setSecondaryPane({
                ...this._secondary_pane,
                collapsed: false,
                size: "small",
            });
            return;
        }

        if ((this._secondary_pane.size ?? "small") === "small") {
            this.setSecondaryPane({
                ...this._secondary_pane,
                collapsed: false,
                size: "equal",
            });
        }
    }

    public decreaseSecondaryPaneSize(): void {
        if ((this._secondary_pane.size ?? "small") === "equal") {
            this.setSecondaryPane({
                ...this._secondary_pane,
                collapsed: false,
                size: "small",
            });
            return;
        }

        if (!this._secondary_pane.collapsed) {
            this.setSecondaryPane({
                ...this._secondary_pane,
                collapsed: true,
                size: "small",
            });
        }
    }

    public getRoomUsers(roomId: string): KibitzRoomUser[] {
        // 1C-a has no presence wiring; the chat-channel join in 1C-b will
        // populate active_room.users from the chat-join roster event.
        return this._active_room?.id === roomId ? this._active_room.users : [];
    }
}

// Suppress unused-import warning while we keep `data` available for Phase 1C-b
// (it is used to read config.user when wiring chat-side identity).
void data;
