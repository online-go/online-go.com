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
import type { GobanController } from "@/lib/GobanController";
import {
    chat_manager,
    updateCachedChannelInformation,
    type ChatChannelProxy,
    type ChatMessage,
    type TypedChatBody,
} from "@/lib/chat_manager";
import { del, get, post, put } from "@/lib/requests";
import { socket } from "@/lib/sockets";
import { push_manager } from "@/components/UIPush/UIPush";
import { interpolate, pgettext } from "@/lib/translate";
import type { User } from "goban";
import { getCurrentKibitzUser, isKibitzAccessBlockedForUser } from "./kibitzAnalysisPolicy";
import type {
    KibitzDebugState,
    KibitzPresetBlock,
    KibitzProposal,
    KibitzRoom,
    KibitzRoomSummary,
    KibitzRoomUser,
    KibitzSecondaryPaneState,
    KibitzStreamItem,
    KibitzStreamItemType,
    KibitzVariationSummary,
    KibitzWatchedGame,
    KibitzVariationLineTree,
} from "@/models/kibitz";
import { isKibitzVariationDebugEnabled, logKibitzVariationDebug } from "./kibitzVariationDebug";

interface KibitzControllerEvents {
    "rooms-changed": (rooms: KibitzRoomSummary[]) => void;
    "room-changed": (room: KibitzRoom | null) => void;
    "stream-changed": (items: KibitzStreamItem[]) => void;
    "proposals-changed": (proposals: KibitzProposal[]) => void;
    "variations-changed": (variations: KibitzVariationSummary[]) => void;
    "cached-games-changed": () => void;
    "secondary-pane-changed": (state: KibitzSecondaryPaneState) => void;
    "debug-changed": (state: KibitzDebugState) => void;
    "permissions-changed": (permissions: KibitzPermissions) => void;
    "access-changed": (block: KibitzAccessBlock | null) => void;
}

type UIPushHandler = ReturnType<typeof push_manager.on>;

interface BackendCurrentGamePlayerBlock {
    id: number;
    username: string;
    ranking: number;
    professional: boolean;
    ui_class: string;
    country?: string;
    icon?: string;
}

interface BackendCurrentGameBlock {
    game_id: number;
    board_size: `${number}x${number}`;
    title: string;
    black: BackendCurrentGamePlayerBlock | null;
    white: BackendCurrentGamePlayerBlock | null;
    tournament_name: string | null;
    move_number: number | null;
    live: boolean;
    analysis_disabled: boolean;
}

interface BackendKibitzRoom {
    id: string;
    channel: string;
    title: string;
    kind: "user" | "preset" | "broadcast";
    description: string | null;
    current_game_id: number | null;
    current_game?: BackendCurrentGameBlock | null;
    creator_id: number | null;
    created_at: string;
    last_activity_at: string;
    settings?: Record<string, unknown>;
    viewer_count?: number;
    preset?: KibitzPresetBlock | null;
}

interface BackendGameDetailsPlayer {
    id: number;
    username: string;
    ranking: number;
    professional: boolean;
    ui_class: string;
    country?: string;
    icon?: string;
}

interface BackendGameDetails {
    id: number;
    width: number;
    height: number;
    name: string;
    players: {
        black: BackendGameDetailsPlayer;
        white: BackendGameDetailsPlayer;
    };
    gamedata: {
        moves: unknown[];
        disable_analysis?: boolean | null;
    };
    ended: boolean | null;
    disable_analysis?: boolean | null;
    analysis_disabled?: boolean | null;
}

interface BackendRoomDetailResponse {
    room: BackendKibitzRoom;
    permissions: Record<string, boolean>;
}

interface KibitzAccessBlock {
    room_id: string;
    room_title: string;
}

const DIRECTORY_CHANNEL = "kibitz-rooms";

function mapBackendCurrentGamePlayer(raw: BackendCurrentGamePlayerBlock | null): KibitzRoomUser {
    if (raw === null) {
        return { id: 0, username: "", ranking: 0, professional: false, ui_class: "" };
    }
    return {
        id: raw.id,
        username: raw.username,
        ranking: raw.ranking,
        professional: raw.professional,
        ui_class: raw.ui_class,
        country: raw.country,
        icon: raw.icon,
    };
}

function mapBackendCurrentGameToWatched(backend: BackendCurrentGameBlock): KibitzWatchedGame {
    return {
        game_id: backend.game_id,
        board_size: backend.board_size,
        title: backend.title,
        black: mapBackendCurrentGamePlayer(backend.black),
        white: mapBackendCurrentGamePlayer(backend.white),
        tournament_name: backend.tournament_name ?? undefined,
        move_number: backend.move_number ?? undefined,
        live: backend.live,
        analysis_disabled: backend.analysis_disabled,
    };
}

function mapBackendRoomCurrentGame(
    backend: BackendKibitzRoom,
    existing?: KibitzRoomSummary,
): KibitzWatchedGame | undefined {
    if (backend.current_game === undefined) {
        return existing?.current_game;
    }
    return backend.current_game ? mapBackendCurrentGameToWatched(backend.current_game) : undefined;
}

function mapBackendGameDetailsPlayer(player: BackendGameDetailsPlayer): KibitzRoomUser {
    return {
        id: player.id,
        username: player.username,
        ranking: player.ranking,
        professional: player.professional,
        ui_class: player.ui_class,
        country: player.country,
        icon: player.icon,
    };
}

async function lookupGameForKibitz(gameId: number): Promise<KibitzWatchedGame | undefined> {
    try {
        const details = (await get(`games/${gameId}`)) as BackendGameDetails;
        if (!details) {
            return undefined;
        }

        return {
            game_id: details.id,
            board_size: `${details.width}x${details.height}` as KibitzWatchedGame["board_size"],
            title: details.name,
            black: mapBackendGameDetailsPlayer(details.players.black),
            white: mapBackendGameDetailsPlayer(details.players.white),
            move_number: details.gamedata.moves.length,
            live: !details.ended,
            analysis_disabled: Boolean(
                details.analysis_disabled ||
                details.disable_analysis ||
                details.gamedata.disable_analysis,
            ),
        };
    } catch (error) {
        console.warn("kibitz: game lookup failed", gameId, error);
        return undefined;
    }
}

function mapBackendRoomToSummary(
    backend: BackendKibitzRoom,
    existing?: KibitzRoomSummary,
): KibitzRoomSummary {
    return {
        id: backend.id,
        channel: backend.channel,
        title: backend.title,
        kind: backend.kind,
        creator_id: backend.creator_id,
        // Prefer the backend's viewer_count when present, then the existing
        // value we already know, then 0. UIPush payloads may omit it; we
        // must not zero out a good count on those events.
        viewer_count: backend.viewer_count ?? existing?.viewer_count ?? 0,
        description: backend.description ?? undefined,
        preset: backend.preset ?? undefined,
        current_game: mapBackendRoomCurrentGame(backend, existing),
    };
}

function sortRoomSummariesByPopulation(rooms: KibitzRoomSummary[]): KibitzRoomSummary[] {
    return [...rooms].sort((roomA, roomB) => {
        const viewerDiff = roomB.viewer_count - roomA.viewer_count;
        if (viewerDiff !== 0) {
            return viewerDiff;
        }

        return roomA.id.localeCompare(roomB.id);
    });
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

export interface KibitzPermissions {
    can_read: boolean;
    can_chat: boolean;
    can_post_variation: boolean;
    can_change_board_directly: boolean;
    can_create_room: boolean;
    can_edit_room: boolean;
    can_delete_room: boolean;
}

const DEFAULT_PERMISSIONS: KibitzPermissions = {
    can_read: true,
    can_chat: false,
    can_post_variation: false,
    can_change_board_directly: false,
    can_create_room: false,
    can_edit_room: false,
    can_delete_room: false,
};

function mapChatUserToKibitzUser(user: User): KibitzRoomUser {
    return {
        id: user.id,
        username: user.username,
        ranking: user.ranking ?? 0,
        professional: user.professional ?? false,
        ui_class: user.ui_class ?? "",
        country: user.country,
    };
}

interface AnalysisChatBody extends TypedChatBody {
    type: "analysis";
    from?: number;
    moves?: string;
    name?: string;
    marks?: Record<string, string>;
    pen_marks?: unknown[];
    line_tree?: KibitzVariationSummary["analysis_line_tree"];
    game_id?: number;
    kibitz_pending_id?: string;
}

function asAnalysisBody(value: unknown): AnalysisChatBody | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const candidate = value as Partial<AnalysisChatBody>;
    return candidate.type === "analysis" ? (candidate as AnalysisChatBody) : null;
}

function mapAnalysisToVariation(msg: ChatMessage, roomId: string): KibitzVariationSummary | null {
    const body = asAnalysisBody(msg.message.m);
    if (!body || body.game_id == null) {
        // Per briefing §2.9 the posting client embeds game_id in every analysis
        // body so the variation can be grouped by source game even after the
        // room's current_game changes. Bodies without it are pre-1C and ignored
        // — earlier versions fell back to the room's current_game, which made
        // variation rendering depend on the timing of GET /games/:id and
        // produced races where the list silently disappeared on slow backends.
        return null;
    }
    if (typeof body.from !== "number" || !Number.isFinite(body.from)) {
        console.warn("kibitz-post-variation:malformed-server-response", {
            roomId,
            chatMessageId: msg.message.i ?? null,
            rawBody: msg.message.m,
            reason: "missing-analysis-from",
        });
        return null;
    }
    if (typeof body.moves !== "string" || body.moves.trim().length === 0) {
        console.warn("kibitz-post-variation:malformed-server-response", {
            roomId,
            chatMessageId: msg.message.i ?? null,
            rawBody: msg.message.m,
            reason: "missing-analysis-moves",
        });
        return null;
    }
    const id = msg.message.i ?? `var-${msg.message.t}-${msg.id}`;
    const variation: KibitzVariationSummary = {
        id,
        room_id: roomId,
        source: "room",
        game_id: body.game_id,
        creator: {
            id: msg.id,
            username: msg.username,
            ranking: msg.ranking,
            professional: msg.professional,
            ui_class: msg.ui_class,
            country: msg.country,
        },
        created_at: (msg.message.t || 0) * 1000,
        viewer_count: 0,
        current_viewers: [],
        title: body.name,
        client_pending_id: body.kibitz_pending_id,
        analysis_from: body.from,
        analysis_moves: body.moves,
        analysis_marks: body.marks,
        analysis_pen_marks: body.pen_marks as KibitzVariationSummary["analysis_pen_marks"],
        analysis_line_tree: body.line_tree,
    };
    if (isKibitzVariationDebugEnabled()) {
        logKibitzVariationDebug("kibitz-post-variation:server-response", {
            roomId,
            chatMessageId: msg.message.i ?? null,
            rawBody: msg.message.m,
            normalizedVariation: {
                id: variation.id,
                game_id: variation.game_id,
                analysis_from: variation.analysis_from ?? null,
                analysis_moves: variation.analysis_moves ?? null,
                move_count: variation.move_count ?? null,
                client_pending_id: variation.client_pending_id ?? null,
            },
        });
    }
    return variation;
}

function mapChatToStreamItem(msg: ChatMessage, roomId: string): KibitzStreamItem {
    const m = msg.message.m;
    const id = msg.message.i ?? `chat-${msg.message.t}-${msg.id}`;
    const created_at = (msg.message.t || 0) * 1000;
    const author: KibitzRoomUser = {
        id: msg.id,
        username: msg.username,
        ranking: msg.ranking,
        professional: msg.professional,
        ui_class: msg.ui_class,
        country: msg.country,
    };

    if (msg.system) {
        return {
            id,
            room_id: roomId,
            type: "system",
            created_at,
            text: typeof m === "string" ? m : (m.text ?? ""),
        };
    }

    if (typeof m === "object" && m !== null) {
        const typed = m as TypedChatBody & { game_id?: number };
        if (typed.type === "system") {
            return {
                id,
                room_id: roomId,
                type: "system",
                created_at,
                author,
                text: typed.text ?? "",
            };
        }
        if (typed.type === "analysis") {
            return {
                id,
                room_id: roomId,
                type: "variation_posted",
                created_at,
                author,
                text: typed.name ?? "",
                variation_id: id,
                game_id: typed.game_id,
            };
        }
        return {
            id,
            room_id: roomId,
            type: "chat" as KibitzStreamItemType,
            created_at,
            author,
            text: typed.text ?? "",
        };
    }

    return {
        id,
        room_id: roomId,
        type: "chat",
        created_at,
        author,
        text: m,
    };
}

export class KibitzController extends EventEmitter<KibitzControllerEvents> {
    private _destroyed = false;
    private _rooms: KibitzRoomSummary[] = [];
    private _refresh_rooms_promise: Promise<void> | null = null;
    private _active_room: KibitzRoom | null = null;
    private _stream: KibitzStreamItem[] = [];
    private _proposals: KibitzProposal[] = [];
    private _variations: KibitzVariationSummary[] = [];
    private _secondary_pane: KibitzSecondaryPaneState = { collapsed: true, size: "small" };
    private _permissions: KibitzPermissions = DEFAULT_PERMISSIONS;
    private _access_blocked: KibitzAccessBlock | null = null;
    private _debug: KibitzDebugState = {
        socket_connected: socket.connected,
        status: "idle",
        rooms: [],
    };

    private _directory_handlers: UIPushHandler[] = [];
    private _active_room_handlers: UIPushHandler[] = [];
    private _active_room_channel: string | null = null;
    private _active_chat_proxy: ChatChannelProxy | null = null;

    /**
     * Monotonically increasing token incremented on every selectRoom call.
     * If the token changes between starting an async hydration and finishing
     * it, the result is stale and should be discarded.
     */
    private _select_room_token = 0;
    private _game_lookup_cache = new Map<number, KibitzWatchedGame>();
    private _game_lookup_inflight = new Map<number, Promise<KibitzWatchedGame | undefined>>();
    private _room_card_game_requests = new Map<string, number>();

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

    public getCachedGame(gameId: number): KibitzWatchedGame | undefined {
        return this._game_lookup_cache.get(gameId);
    }

    public async ensureGamesCached(gameIds: number[]): Promise<void> {
        const uniqueGameIds = [...new Set(gameIds)].filter((gameId) => Number.isFinite(gameId));

        await Promise.all(uniqueGameIds.map((gameId) => this.lookupGameForKibitzCached(gameId)));
    }

    public get secondary_pane(): KibitzSecondaryPaneState {
        return this._secondary_pane;
    }

    public get permissions(): KibitzPermissions {
        return this._permissions;
    }

    public get access_blocked(): KibitzAccessBlock | null {
        return this._access_blocked;
    }

    public setPermissions(permissions: KibitzPermissions): void {
        this._permissions = permissions;
        this.emit("permissions-changed", this._permissions);
    }

    public setAccessBlocked(block: KibitzAccessBlock | null): void {
        this._access_blocked = block;
        this.emit("access-changed", this._access_blocked);
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
            push_manager.on("room-updated", this.onRoomUpdated),
            push_manager.on("rooms-refresh", this.onRoomsRefresh),
            push_manager.on("viewer-count-changed", this.onViewerCountChanged),
        );
        push_manager.subscribe(DIRECTORY_CHANNEL);

        void this.refreshRoomDirectory();
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

    public refreshRoomDirectory(): Promise<void> {
        if (this._refresh_rooms_promise) {
            return this._refresh_rooms_promise;
        }

        this._refresh_rooms_promise = this.refreshRooms().finally(() => {
            this._refresh_rooms_promise = null;
        });

        return this._refresh_rooms_promise;
    }

    private clearAccessBlocked(): void {
        if (this._access_blocked !== null) {
            this.setAccessBlocked(null);
        }
    }

    private blockAccessToRoom(room: { id: string; title: string }): void {
        this.unsubscribeActiveRoom();
        this.setActiveRoom(null);
        this.setStream([]);
        this.setVariations([]);
        this.setProposals([]);
        this.setSecondaryPane({
            collapsed: true,
            size: "small",
        });
        this.setPermissions(DEFAULT_PERMISSIONS);
        this.setAccessBlocked({
            room_id: room.id,
            room_title: room.title,
        });
    }

    private async refreshRooms(): Promise<void> {
        this.setDebug({
            ...this._debug,
            socket_connected: socket.connected,
            status: "loading",
            error: undefined,
            last_hydration_started_at: Date.now(),
            rooms: [],
        });

        try {
            const payload = (await get("kibitz/directory")) as BackendKibitzRoom[];
            const rooms = sortRoomSummariesByPopulation(
                (payload ?? []).map((r) => mapBackendRoomToSummary(r)),
            );
            this.setRooms(rooms);
            const roomIds = new Set(rooms.map((room) => room.id));
            for (const roomId of Array.from(this._room_card_game_requests.keys())) {
                if (!roomIds.has(roomId)) {
                    this._room_card_game_requests.delete(roomId);
                }
            }
            this.setDebug({
                ...this._debug,
                status: "ready",
                last_hydration_finished_at: Date.now(),
            });

            // The destroyed-check skips the per-room game lookups after this
            // controller instance has been torn down. `setRooms` above still
            // needs to run so any mounted consumer gets the latest room list.
            if (this._destroyed) {
                return;
            }

            // Resolve each room's current_game in parallel so the room cards
            // keep showing the watched game metadata.
            for (const backend of payload ?? []) {
                if (backend.current_game_id) {
                    void this.hydrateRoomCardGame(backend.id, backend.current_game_id);
                }
            }
        } catch (error) {
            if (this._destroyed) {
                return;
            }
            this.setDebug({
                ...this._debug,
                status: "error",
                last_hydration_finished_at: Date.now(),
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    private lookupGameForKibitzCached(gameId: number): Promise<KibitzWatchedGame | undefined> {
        const cached = this._game_lookup_cache.get(gameId);
        if (cached) {
            return Promise.resolve(cached);
        }

        const inflight = this._game_lookup_inflight.get(gameId);
        if (inflight) {
            return inflight;
        }

        const promise = lookupGameForKibitz(gameId)
            .then((game) => {
                if (game) {
                    const hadGame = this._game_lookup_cache.has(gameId);
                    this._game_lookup_cache.set(gameId, game);
                    if (!hadGame) {
                        this.emit("cached-games-changed");
                    }
                }
                return game;
            })
            .finally(() => {
                this._game_lookup_inflight.delete(gameId);
            });

        this._game_lookup_inflight.set(gameId, promise);
        return promise;
    }

    private async hydrateRoomCardGame(roomId: string, gameId: number): Promise<void> {
        this._room_card_game_requests.set(roomId, gameId);

        const game = await this.lookupGameForKibitzCached(gameId);
        if (this._destroyed || this._room_card_game_requests.get(roomId) !== gameId || !game) {
            return;
        }
        let changed = false;
        const updated = this._rooms.map((room) => {
            if (room.id !== roomId) {
                return room;
            }

            if (room.current_game?.game_id === game.game_id) {
                return room;
            }

            changed = true;
            return { ...room, current_game: game };
        });
        if (changed) {
            this.setRooms(updated);
        }
    }

    private onRoomCreated = (incoming: BackendKibitzRoom) => {
        if (this._rooms.some((room) => room.id === incoming.id)) {
            return;
        }
        const summary = mapBackendRoomToSummary(incoming);
        this.setRooms([...this._rooms, summary]);
    };

    private applyBackendRoomUpdate(incoming: BackendKibitzRoom): void {
        const existing = this._rooms.find((r) => r.id === incoming.id);
        const summary = mapBackendRoomToSummary(incoming, existing);
        this.setRooms(
            this._rooms.map((room) => (room.id === incoming.id ? { ...room, ...summary } : room)),
        );
    }

    private onViewerCountChanged = (payload: { channel?: string; viewer_count?: number }) => {
        if (!payload?.channel || typeof payload.viewer_count !== "number") {
            return;
        }
        const index = this._rooms.findIndex((r) => r.channel === payload.channel);
        if (index === -1) {
            return;
        }
        if (this._rooms[index].viewer_count === payload.viewer_count) {
            return;
        }
        this.setRooms(
            this._rooms.map((r) =>
                r.channel === payload.channel ? { ...r, viewer_count: payload.viewer_count! } : r,
            ),
        );
        if (this._active_room?.channel === payload.channel) {
            this.setActiveRoom({ ...this._active_room, viewer_count: payload.viewer_count });
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
        if (this._access_blocked?.room_id === id) {
            this.clearAccessBlocked();
        }
    };

    private onRoomsRefresh = () => {
        void this.refreshRoomDirectory();
    };

    private onBoardChanged = (incoming: BackendKibitzRoom) => {
        if (!incoming || !incoming.id) {
            return;
        }
        this.applyBackendRoomUpdate(incoming);
        if (this._active_room?.id === incoming.id) {
            const summary = mapBackendRoomToSummary(incoming, this._active_room);
            // Backend is authoritative for preset state; the serializer always
            // emits the field (dict for preset rooms, null/undefined otherwise),
            // so we never need to fall back to the locally-cached value.
            const basePreset = summary.preset;
            // Clear pending preset state only when the board change matches the
            // pending game. Belt-and-braces against unrelated room-updated events
            // (which delegate to this handler) accidentally resolving the pending
            // state.
            const updatedPreset =
                basePreset &&
                basePreset.selection_status === "change_pending" &&
                basePreset.pending_game_id !== null &&
                incoming.current_game_id === basePreset.pending_game_id
                    ? {
                          ...basePreset,
                          selection_status: "watching" as const,
                          pending_game_id: null,
                          change_effective_at: null,
                      }
                    : basePreset;
            this.setActiveRoom({
                ...this._active_room,
                ...summary,
                preset: updatedPreset,
            });
        }
    };

    private onGameChangePending = (payload: {
        room_id?: string;
        pending_game_id?: number;
        change_effective_at?: string;
    }) => {
        if (!payload?.room_id || !this._active_room || this._active_room.id !== payload.room_id) {
            return;
        }
        if (typeof payload.pending_game_id !== "number" || !payload.change_effective_at) {
            return;
        }
        const existing = this._active_room.preset;
        if (!existing) {
            // Defensive: only preset rooms should ever receive this event.
            return;
        }
        this.setActiveRoom({
            ...this._active_room,
            preset: {
                ...existing,
                selection_status: "change_pending",
                pending_game_id: payload.pending_game_id,
                change_effective_at: payload.change_effective_at,
            },
        });
    };

    private onGameChangeCancelled = (payload: { room_id?: string }) => {
        if (!payload?.room_id || !this._active_room || this._active_room.id !== payload.room_id) {
            return;
        }
        const existing = this._active_room.preset;
        if (!existing) {
            return;
        }
        this.setActiveRoom({
            ...this._active_room,
            preset: {
                ...existing,
                selection_status: "watching",
                pending_game_id: null,
                change_effective_at: null,
            },
        });
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
            push_manager.on("room-game-change-pending", this.onGameChangePending),
            push_manager.on("room-game-change-cancelled", this.onGameChangeCancelled),
        );
        push_manager.subscribe(channel);
        this._active_room_channel = channel;
        this.joinActiveChat(channel);
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
        this.partActiveChat();
    }

    private joinActiveChat(channel: string): void {
        this.partActiveChat();
        const proxy = chat_manager.join(channel);
        this._active_chat_proxy = proxy;
        proxy.on("chat", this.onChatMessage);
        proxy.on("chat-removed", this.onChatMessageRemoved);
        proxy.on("join", this.syncPresenceFromChat);
        proxy.on("part", this.syncPresenceFromChat);
        proxy.on("user-metadata-update", this.syncPresenceFromChat);
        // Initial full sync; chat_log may already be populated if another
        // subscriber held the channel (e.g. KibitzSharedStreamPanel) and
        // gets fed by replay events afterwards.
        this.syncMessagesFromChat();
        this.syncPresenceFromChat();
    }

    private partActiveChat(): void {
        if (this._active_chat_proxy) {
            this._active_chat_proxy.off("chat", this.onChatMessage);
            this._active_chat_proxy.off("chat-removed", this.onChatMessageRemoved);
            this._active_chat_proxy.off("join", this.syncPresenceFromChat);
            this._active_chat_proxy.off("part", this.syncPresenceFromChat);
            this._active_chat_proxy.off("user-metadata-update", this.syncPresenceFromChat);
            this._active_chat_proxy.part();
            this._active_chat_proxy = null;
        }
    }

    // Full rebuild of stream/variations from the channel's chat_log. Used
    // for the initial sync only; per-message updates use the incremental
    // onChatMessage / onChatMessageRemoved handlers below to avoid O(n)
    // work per chat event over the room's lifetime.
    private syncMessagesFromChat = (): void => {
        const proxy = this._active_chat_proxy;
        const room = this._active_room;
        if (!proxy || !room) {
            return;
        }
        const items: KibitzStreamItem[] = [];
        const variations: KibitzVariationSummary[] = [];
        for (const msg of proxy.channel.chat_log) {
            items.push(mapChatToStreamItem(msg, room.id));
            const variation = mapAnalysisToVariation(msg, room.id);
            if (variation) {
                variations.push(variation);
            }
        }
        this.setStream(items);
        this.setVariations(variations);
    };

    // ChatChannelProxy._onChat / _onChatRemoved (chat_manager.ts:841-861)
    // collect (...args) and re-emit with args wrapped in an array
    // (`emit.apply(this, ["chat", args])`), so listeners can't trust the
    // event payload — every other consumer in the codebase ignores it and
    // re-derives from proxy.channel.chat_log. We do the same, but stay
    // incremental by inspecting whether the log grew by one (the common
    // path for both send and receive) vs. some other delta (initial sync,
    // bulk clear via clearSystemMessages, etc.) which falls back to a full
    // rebuild.
    private onChatMessage = (): void => {
        const proxy = this._active_chat_proxy;
        const room = this._active_room;
        if (!proxy || !room) {
            return;
        }
        const log = proxy.channel.chat_log;
        if (log.length !== this._stream.length + 1) {
            this.syncMessagesFromChat();
            return;
        }
        const msg = log[log.length - 1];
        const item = mapChatToStreamItem(msg, room.id);
        this.setStream([...this._stream, item]);
        const variation = mapAnalysisToVariation(msg, room.id);
        if (variation) {
            this.setVariations([...this._variations, variation]);
        }
    };

    private onChatMessageRemoved = (): void => {
        // chat-removed is a rare path; full rebuild from chat_log keeps
        // the controller honest about whatever just got spliced out
        // upstream without depending on the broken proxy payload.
        this.syncMessagesFromChat();
    };

    private syncPresenceFromChat = (): void => {
        const proxy = this._active_chat_proxy;
        const room = this._active_room;
        if (!proxy || !room) {
            return;
        }

        // users_by_join keeps insertion order (oldest-first); reverse so the
        // KibitzPresence roster shows newest joiners at the top.
        const users = [...proxy.channel.users_by_join].reverse().map(mapChatUserToKibitzUser);
        this.setActiveRoom({ ...room, users });
    };

    public async selectRoom(roomId: string | null): Promise<void> {
        const token = ++this._select_room_token;

        if (!roomId) {
            this.unsubscribeActiveRoom();
            this.setActiveRoom(null);
            this.setStream([]);
            this.setVariations([]);
            this.setProposals([]);
            this.setPermissions(DEFAULT_PERMISSIONS);
            this.clearAccessBlocked();
            return;
        }

        try {
            const payload = (await get(`kibitz/rooms/${roomId}`)) as BackendRoomDetailResponse;
            if (token !== this._select_room_token || this._destroyed) {
                return;
            }

            const full = mapBackendRoomToFull(payload.room);
            if (isKibitzAccessBlockedForUser(getCurrentKibitzUser(), full.current_game)) {
                this.blockAccessToRoom({
                    id: full.id,
                    title: full.title,
                });
                return;
            }

            this.clearAccessBlocked();
            this.setPermissions({ ...DEFAULT_PERMISSIONS, ...payload.permissions });
            // Ensure the active room is in the rail. The directory snapshot is
            // taken before the caller joins the chat channel, so a non-owned
            // room with no other watchers gets filtered out for viewer_count=0
            // even when the caller is about to become viewer #1. The rail must
            // always show the room the user is currently looking at, so merge
            // it in if missing.
            if (!this._rooms.some((r) => r.id === full.id)) {
                this.setRooms(
                    sortRoomSummariesByPopulation([
                        ...this._rooms,
                        mapBackendRoomToSummary(payload.room),
                    ]),
                );
            }
            // setActiveRoom must precede subscribeActiveRoom: joinActiveChat's
            // initial syncMessagesFromChat reads _active_room to decide which rooms
            // entry to mirror user_count into, and _active_chat_proxy for the
            // count. If set in the wrong order, we'd write the new proxy's
            // (empty, pre-roster) count to the OLD room's entry — zeroing it.
            this.setActiveRoom(full);
            // joinActiveChat fires syncMessagesFromChat and syncPresenceFromChat, which set stream/variations
            // from the channel's chat_log — empty if this is a fresh join,
            // populated if chat_manager was already holding the channel for
            // another subscriber (KibitzSharedStreamPanel also joins it). The
            // previous explicit setStream/setVariations([]) here was a leftover
            // placeholder from before 1C-b wired chat-derived state and would
            // wipe whatever syncMessagesFromChat had just produced.
            this.subscribeActiveRoom(full.channel);
            this.setProposals([]);
            this.setSecondaryPane({
                collapsed: true,
                size: "small",
            });
        } catch (error) {
            if (token !== this._select_room_token || this._destroyed) {
                return;
            }
            this.unsubscribeActiveRoom();
            this.setActiveRoom(null);
            this.setStream([]);
            this.setVariations([]);
            this.setProposals([]);
            this.clearAccessBlocked();
            console.warn("kibitz: failed to hydrate room", roomId, error);
        }
    }

    public async createRoom(
        game: KibitzWatchedGame,
        roomName: string,
        description: string,
    ): Promise<string | null> {
        try {
            // Frontend guard only. The backend must enforce the same rule on
            // room creation, board changes, room hydration, chat/presence join,
            // and variation posting.
            if (isKibitzAccessBlockedForUser(getCurrentKibitzUser(), game)) {
                return null;
            }
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
            // Frontend guard only. The backend must enforce the same rule on
            // room creation, board changes, room hydration, chat/presence join,
            // and variation posting.
            if (isKibitzAccessBlockedForUser(getCurrentKibitzUser(), game)) {
                return false;
            }
            const payload = (await post(`kibitz/rooms/${roomId}/change-board`, {
                game_id: game.game_id,
            })) as BackendKibitzRoom;

            // Apply locally; board-changed UIPush will arrive and be a no-op
            // because the resulting summary will already match.
            this.onBoardChanged(payload);
            // Per briefing § 2.8: the initiating client posts the resulting
            // system chat line so the room's stream has a record of the swap.
            this.postChangeBoardSystemMessage(game);
            return true;
        } catch (error) {
            console.warn("kibitz: changeBoard failed", roomId, error);
            return false;
        }
    }

    public async updateRoomDetails(
        roomId: string,
        title: string,
        description: string,
    ): Promise<boolean> {
        try {
            // Always send `description` as a string -- even empty -- so the
            // server can distinguish "user cleared the description" (empty
            // string) from "this is a partial update, leave description
            // alone" (key absent). The server's PUT handler preserves the
            // existing description when the key is missing.
            const payload = (await put(`kibitz/rooms/${roomId}`, {
                title: title.trim(),
                description: description.trim(),
            })) as BackendKibitzRoom;

            this.applyBackendRoomUpdate(payload);
            if (this._active_room?.id === roomId) {
                const summary = mapBackendRoomToSummary(payload, this._active_room);
                this.setActiveRoom({ ...this._active_room, ...summary });
            }
            return true;
        } catch (error) {
            console.warn("kibitz: updateRoomDetails failed", roomId, error);
            return false;
        }
    }

    public async deleteRoom(roomId: string): Promise<boolean> {
        try {
            await del(`kibitz/rooms/${roomId}`);
            this.onRoomRemoved(roomId);
            return true;
        } catch (error) {
            console.warn("kibitz: deleteRoom failed", roomId, error);
            return false;
        }
    }

    private postChangeBoardSystemMessage(game: KibitzWatchedGame): void {
        const user = getCurrentKibitzUser();
        if (!user || user.anonymous) {
            return;
        }
        const text = interpolate(
            pgettext(
                "Kibitz system message announcing the new watched game",
                "{{username}} changed the watched game to {{title}}",
            ),
            { username: user.username, title: game.title || `#${game.game_id}` },
        );
        this.sendTypedToActiveChannel({ type: "system", text });
    }

    private sendTypedToActiveChannel(body: TypedChatBody): void {
        const proxy = this._active_chat_proxy;
        if (!proxy) {
            return;
        }
        const user = getCurrentKibitzUser();
        if (!user || user.anonymous) {
            return;
        }
        proxy.channel.sendTypedBody(body);
    }

    public postVariation(
        roomId: string,
        boardController: GobanController,
        sourceGameId: number | undefined,
    ): AnalysisChatBody | null {
        const proxy = this._active_chat_proxy;
        if (!proxy || !this._active_room || this._active_room.id !== roomId) {
            return null;
        }
        const prepared = boardController.buildAnalysisSnapshot();
        if (prepared.is_duplicate) {
            return null;
        }
        if (!sourceGameId) {
            return null;
        }
        const pendingId = `kibitz-post:${Date.now()}:${Math.random().toString(36).slice(2)}`;
        const officialTailMoveNumber =
            boardController.goban.engine.last_official_move?.move_number ?? 0;
        const body = {
            ...prepared.analysis,
            game_id: sourceGameId,
            kibitz_pending_id: pendingId,
        } as AnalysisChatBody;
        if (isKibitzVariationDebugEnabled()) {
            logKibitzVariationDebug("kibitz-post-variation", {
                roomId,
                sourceGameId,
                officialTailMoveNumber,
                analysis_from: prepared.analysis.from ?? null,
                draft_end_move_number: prepared.move_count,
                decodedAnalysisMoveCount: prepared.moves.length,
            });
            logKibitzVariationDebug("kibitz-post-variation:payload", {
                roomId,
                sourceGameId,
                analysis_from: body.from ?? null,
                decodedAnalysisMoveCount: prepared.moves.length,
                encodedAnalysisMovesLength:
                    typeof body.moves === "string" ? body.moves.length : null,
                payload: body,
            });
        }
        if (
            typeof body.from !== "number" ||
            !Number.isFinite(body.from) ||
            typeof body.moves !== "string" ||
            body.moves.trim().length === 0
        ) {
            console.warn("kibitz-post-variation:refusing-malformed-payload", {
                roomId,
                sourceGameId,
                officialTailMoveNumber,
                payload: body,
            });
            return null;
        }
        if (
            this._active_room?.current_game?.game_id === sourceGameId &&
            typeof prepared.analysis.from === "number" &&
            prepared.analysis.from > officialTailMoveNumber
        ) {
            console.warn("kibitz-post-variation:analysis-from-ahead-of-official-tail", {
                roomId,
                sourceGameId,
                officialTailMoveNumber,
                analysis_from: prepared.analysis.from,
                draft_end_move_number: prepared.move_count,
                decodedAnalysisMoveCount: prepared.moves.length,
            });
        }
        this.sendTypedToActiveChannel(body);
        boardController.recordAnalysisSent(prepared.analysis);
        return body;
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
            variation_source_move_tree: undefined,
            variation_source_move_tree_id: undefined,
            variation_source_move_path: undefined,
            variation_draft_base_id: undefined,
        });
    }

    public startVariationFromCurrentBoard(
        variation_source_move_tree?: KibitzVariationLineTree,
        variation_source_move_path?: string,
        variation_source_move_tree_id?: number,
    ): void {
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
            variation_source_move_tree,
            variation_source_move_tree_id,
            variation_source_move_path,
            variation_draft_base_id: undefined,
        });
    }

    public startVariationFromPostedVariation(
        variation: KibitzVariationSummary,
        variation_source_move_tree?: KibitzVariationLineTree,
        variation_source_move_path?: string,
        variation_source_move_tree_id?: number,
    ): void {
        const sourceGame =
            this._active_room?.current_game?.game_id === variation.game_id
                ? this._active_room.current_game
                : undefined;

        this.setSecondaryPane({
            ...this._secondary_pane,
            collapsed: false,
            size: "equal",
            preview_game_id: variation.game_id,
            variation_id: undefined,
            variation_source_game_id: variation.game_id,
            variation_source_game: sourceGame ? { ...sourceGame } : undefined,
            variation_source_move_tree,
            variation_source_move_tree_id,
            variation_source_move_path,
            variation_draft_base_id: variation.id,
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
            variation_source_move_tree: undefined,
            variation_source_move_tree_id: undefined,
            variation_source_move_path: undefined,
            variation_draft_base_id: undefined,
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
            variation_source_move_tree: undefined,
            variation_source_move_tree_id: undefined,
            variation_source_move_path: undefined,
            variation_draft_base_id: undefined,
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
        // Only the active room carries a roster: syncPresenceFromChat writes
        // active_room.users from the chat-channel join event, and there is
        // no equivalent state for non-active rooms. Callers asking about a
        // different room get an empty list.
        return this._active_room?.id === roomId ? this._active_room.users : [];
    }
}
