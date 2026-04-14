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

/* cspell: words cooldown */

import { EventEmitter } from "eventemitter3";
import * as data from "@/lib/data";
import { GobanController } from "@/lib/GobanController";
import { updateCachedChannelInformation } from "@/lib/chat_manager";
import { KibitzMockService } from "@/lib/KibitzMockService";
import { get } from "@/lib/requests";
import { socket } from "@/lib/sockets";
import type {
    KibitzDebugCandidate,
    KibitzDebugRoomHydration,
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

interface ObservedGameResult {
    id: number;
    name: string;
    width: number;
    height: number;
    black: {
        id: number;
        username: string;
    };
    white: {
        id: number;
        username: string;
    };
    json?: {
        moves?: unknown[];
    };
}

interface ActivePlayerGameResult extends ObservedGameResult {}

function createUser(id: number, username: string, ranking: number): KibitzRoom["users"][number] {
    return {
        id,
        username,
        ranking,
        professional: false,
        ui_class: "",
    };
}

function createCurrentUser(): KibitzRoom["users"][number] {
    const user = data.get("config.user");
    if (user && !user.anonymous) {
        return {
            id: user.id,
            username: user.username,
            ranking: user.ranking,
            professional: user.professional,
            ui_class: user.ui_class,
            country: user.country,
            icon: user.icon,
        };
    }

    return createUser(-1, "You", 0);
}

function getCurrentUserId(): number | null {
    const user = data.get("config.user");
    if (user && !user.anonymous) {
        return user.id;
    }

    return null;
}

function createSeededRooms(): KibitzRoomSummary[] {
    return [
        {
            id: "top-19x19",
            channel: "kibitz-top-19x19",
            title: "Top 19x19",
            kind: "preset",
            viewer_count: 18,
            proposals_enabled: true,
        },
        {
            id: "tournament-pick",
            channel: "kibitz-tournament-pick",
            title: "Tournament Pick",
            kind: "preset",
            viewer_count: 11,
            proposals_enabled: true,
        },
        {
            id: "top-9x9",
            channel: "kibitz-top-9x9",
            title: "Top 9x9",
            kind: "preset",
            viewer_count: 7,
            proposals_enabled: true,
        },
    ];
}

function mapObservedGameToWatchedGame(game: ObservedGameResult) {
    return {
        game_id: game.id,
        board_size: `${game.width}x${game.height}` as const,
        title: game.name,
        black: createUser(game.black.id, game.black.username, 0),
        white: createUser(game.white.id, game.white.username, 0),
        move_number: game.json?.moves?.length ?? 0,
        live: true,
    };
}

function findObservedGame(
    games: ObservedGameResult[],
    predicate: (game: ObservedGameResult) => boolean,
): ObservedGameResult | null {
    return games.find(predicate) ?? null;
}

function findObservedGameForUser(
    games: ObservedGameResult[],
    userId: number | null,
    predicate?: (game: ObservedGameResult) => boolean,
): ObservedGameResult | null {
    if (userId == null) {
        return null;
    }

    return (
        games.find((game) => {
            const isParticipant = game.black.id === userId || game.white.id === userId;
            return isParticipant && (predicate ? predicate(game) : true);
        }) ?? null
    );
}

function matchesBoardSize(game: ObservedGameResult, width: number, height: number): boolean {
    return Number(game.width) === width && Number(game.height) === height;
}

async function resolveObservedGameByBoardSize(
    games: ObservedGameResult[],
    width: number,
    height: number,
    preferredUserId?: number | null,
): Promise<{
    game: ObservedGameResult | null;
    picked_via?: "query" | "details";
    error?: string;
}> {
    const userMatch = findObservedGameForUser(games, preferredUserId ?? null, (game) =>
        matchesBoardSize(game, width, height),
    );
    if (userMatch) {
        return {
            game: userMatch,
            picked_via: "query",
        };
    }

    const directMatch = findObservedGame(games, (game) => matchesBoardSize(game, width, height));
    if (directMatch) {
        return {
            game: directMatch,
            picked_via: "query",
        };
    }

    for (const candidate of games.slice(0, 5)) {
        try {
            const details = await get(`games/${candidate.id}`);
            if (details.width === width && details.height === height) {
                return {
                    game: {
                        ...candidate,
                        width: details.width,
                        height: details.height,
                    },
                    picked_via: "details",
                };
            }
        } catch (error) {
            return {
                game: null,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    return {
        game: null,
    };
}

function pickBroadFallbackGame(
    games: ObservedGameResult[],
    width: number,
    height: number,
    preferredUserId?: number | null,
): ObservedGameResult | null {
    const userSizedGame = findObservedGameForUser(games, preferredUserId ?? null, (game) =>
        matchesBoardSize(game, width, height),
    );
    if (userSizedGame) {
        return userSizedGame;
    }

    const sizedGame = findObservedGame(games, (game) => matchesBoardSize(game, width, height));
    if (sizedGame) {
        return sizedGame;
    }

    const userGame = findObservedGameForUser(games, preferredUserId ?? null);
    if (userGame) {
        return userGame;
    }

    return games[0] ?? null;
}

function createDebugCandidate(game: ObservedGameResult): KibitzDebugCandidate {
    return {
        id: game.id,
        title: game.name,
        width: game.width,
        height: game.height,
        move_count: game.json?.moves?.length,
    };
}

async function queryCurrentUserActiveGames(): Promise<ActivePlayerGameResult[]> {
    const userId = getCurrentUserId();
    if (userId == null) {
        return [];
    }

    const response = await get(`players/${userId}/full`);
    return (response.active_games ?? []) as ActivePlayerGameResult[];
}

function queryObservedGames(where: Record<string, boolean>): Promise<ObservedGameResult[]> {
    return new Promise((resolve) => {
        socket.send(
            "gamelist/query",
            {
                list: "live",
                sort_by: "rank",
                where,
                from: 0,
                limit: 25,
            },
            (res) => {
                resolve((res?.results ?? []) as ObservedGameResult[]);
            },
        );
    });
}

function createRoomDetails(summary: KibitzRoomSummary): KibitzRoom {
    const users = [
        createUser(201, "TesujiTom", 12),
        createUser(202, "ShapeStudy", 9),
        createUser(203, "Probe", 15),
    ];

    return {
        ...summary,
        users,
        active_chatters: users.slice(0, 2),
        friends_in_room: users.slice(2, 3),
        active_variation_ids: [],
    };
}

function createRoomStream(room: KibitzRoomSummary): KibitzStreamItem[] {
    return [
        {
            id: `${room.id}-system-1`,
            room_id: room.id,
            type: "system",
            created_at: Date.now(),
            text: `Watching ${room.current_game?.title ?? room.title}`,
            game_id: room.current_game?.game_id,
        },
        {
            id: `${room.id}-chat-1`,
            room_id: room.id,
            type: "chat",
            created_at: Date.now(),
            author: createUser(201, "TesujiTom", 12),
            text: "This room is ready for chat-backed kibitz wiring.",
            game_id: room.current_game?.game_id,
        },
    ];
}

export class KibitzController extends EventEmitter<KibitzControllerEvents> {
    private _mode: KibitzMode;
    private _destroyed = false;
    private _rooms: KibitzRoomSummary[] = [];
    private _active_room: KibitzRoom | null = null;
    private _stream: KibitzStreamItem[] = [];
    private _proposals: KibitzProposal[] = [];
    private _variations: KibitzVariationSummary[] = [];
    private _secondary_pane: KibitzSecondaryPaneState = { collapsed: true, size: "small" };
    private _local_room_sequence = 1;
    private _mock_service: KibitzMockService | null = null;
    private _debug: KibitzDebugState = {
        mode: "live",
        socket_connected: socket.connected,
        status: "idle",
        rooms: [],
    };

    public get mode(): KibitzMode {
        return this._mode;
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

        const rooms = createSeededRooms();
        this._mode = this.detectMode();
        this._debug.mode = this._mode;
        this.setRooms(rooms);
        if (this._mode === "demo") {
            this._mock_service = new KibitzMockService();
            this._mock_service.on("changed", this.onMockServiceChanged);
            this.syncFromMockService();
        } else {
            socket.on("connect", this.onSocketConnect);

            if (socket.connected) {
                void this.hydrateSeededRoomsFromLiveGames();
            }
        }
    }

    public destroy(): void {
        if (this._destroyed) {
            return;
        }

        this._destroyed = true;
        socket.off("connect", this.onSocketConnect);
        this._mock_service?.off("changed", this.onMockServiceChanged);
        this._mock_service?.destroy();
        this._mock_service = null;
    }

    private detectMode(): KibitzMode {
        const params = new URLSearchParams(window.location.search);
        if (params.get("live-kibitz") === "1") {
            return "live";
        }
        if (params.get("demo-kibitz") === "1") {
            return "demo";
        }

        return /beta|dev/i.test(window.location.hostname) ? "demo" : "live";
    }

    private onSocketConnect = () => {
        void this.hydrateSeededRoomsFromLiveGames();
    };

    private onMockServiceChanged = () => {
        this.syncFromMockService();
    };

    private syncFromMockService(): void {
        if (!this._mock_service) {
            return;
        }

        const rooms = this._mock_service.listRooms();
        this.setRooms(rooms);
        this.setDebug({
            mode: "demo",
            socket_connected: false,
            status: "ready",
            last_hydration_started_at: this._debug.last_hydration_started_at,
            last_hydration_finished_at: Date.now(),
            rooms: rooms.map((room) => ({
                room_id: room.id,
                requested_size: room.current_game?.board_size,
                query_count: 1,
                query_source: "broad-fallback",
                picked_game_id: room.current_game?.game_id,
                picked_via: "query",
                candidates: room.current_game
                    ? [
                          {
                              id: room.current_game.game_id,
                              title: room.current_game.title,
                              width: room.current_game.mock_game_data?.width,
                              height: room.current_game.mock_game_data?.height,
                              move_count: room.current_game.move_number,
                          },
                      ]
                    : [],
            })),
        });

        if (this._active_room?.id) {
            const room = this._mock_service.getRoom(this._active_room.id);
            this.setActiveRoom(room);
            this.setStream(this._mock_service.getStream(this._active_room.id));
            this.setProposals(this._mock_service.getProposals(this._active_room.id));
            this.setVariations(this._mock_service.getVariations(this._active_room.id));
        }
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

    private async hydrateSeededRoomsFromLiveGames(): Promise<void> {
        const currentUserId = getCurrentUserId();

        this.setDebug({
            ...this._debug,
            mode: this._mode,
            socket_connected: socket.connected,
            status: "loading",
            error: undefined,
            last_hydration_started_at: Date.now(),
            rooms: [],
        });

        try {
            const [top19Games, tournamentGames, top9Games, broadGames, activeGames] =
                await Promise.all([
                    queryObservedGames({
                        hide_unranked: true,
                        hide_13x13: true,
                        hide_9x9: true,
                        hide_other: true,
                    }),
                    queryObservedGames({
                        hide_open: true,
                        hide_ladder: true,
                    }),
                    queryObservedGames({
                        hide_unranked: true,
                        hide_19x19: true,
                        hide_13x13: true,
                        hide_other: true,
                    }),
                    queryObservedGames({}),
                    queryCurrentUserActiveGames(),
                ]);

            const [top19Resolution, top9Resolution] = await Promise.all([
                resolveObservedGameByBoardSize(top19Games, 19, 19, currentUserId),
                resolveObservedGameByBoardSize(top9Games, 9, 9, currentUserId),
            ]);
            const tournamentCandidates = tournamentGames.filter(
                (game) => game.width > 0 && game.height > 0,
            );
            const tournamentUserGame = findObservedGameForUser(tournamentCandidates, currentUserId);
            const tournamentPick =
                tournamentUserGame ??
                (tournamentCandidates.length > 0
                    ? tournamentCandidates[Math.floor(Math.random() * tournamentCandidates.length)]
                    : null) ??
                pickBroadFallbackGame(broadGames, 19, 19, currentUserId);
            const top19Final =
                top19Resolution.game ??
                pickBroadFallbackGame(broadGames, 19, 19, currentUserId) ??
                pickBroadFallbackGame(activeGames, 19, 19, currentUserId);
            const top9Final =
                top9Resolution.game ??
                pickBroadFallbackGame(broadGames, 9, 9, currentUserId) ??
                pickBroadFallbackGame(activeGames, 9, 9, currentUserId);

            const roomUpdates: Record<string, ObservedGameResult | null> = {
                "top-19x19": top19Final,
                "tournament-pick": tournamentPick,
                "top-9x9": top9Final,
            };

            const roomDebug: KibitzDebugRoomHydration[] = [
                {
                    room_id: "top-19x19",
                    requested_size: "19x19",
                    query_count:
                        top19Games.length > 0
                            ? top19Games.length
                            : broadGames.length > 0
                              ? broadGames.length
                              : activeGames.length,
                    query_source:
                        top19Games.length > 0
                            ? "filtered"
                            : broadGames.length > 0
                              ? "broad-fallback"
                              : "active-games-fallback",
                    picked_game_id: top19Final?.id,
                    picked_via: top19Resolution.game
                        ? top19Resolution.picked_via
                        : top19Final
                          ? "query"
                          : undefined,
                    error: top19Resolution.error,
                    candidates: (top19Games.length > 0
                        ? top19Games
                        : broadGames.length > 0
                          ? broadGames
                          : activeGames
                    )
                        .slice(0, 5)
                        .map(createDebugCandidate),
                },
                {
                    room_id: "tournament-pick",
                    query_count:
                        tournamentGames.length > 0 ? tournamentGames.length : broadGames.length,
                    query_source: tournamentGames.length > 0 ? "filtered" : "broad-fallback",
                    picked_game_id: tournamentPick?.id,
                    picked_via: tournamentPick ? "query" : undefined,
                    candidates: (tournamentGames.length > 0 ? tournamentGames : broadGames)
                        .slice(0, 5)
                        .map(createDebugCandidate),
                },
                {
                    room_id: "top-9x9",
                    requested_size: "9x9",
                    query_count:
                        top9Games.length > 0
                            ? top9Games.length
                            : broadGames.length > 0
                              ? broadGames.length
                              : activeGames.length,
                    query_source:
                        top9Games.length > 0
                            ? "filtered"
                            : broadGames.length > 0
                              ? "broad-fallback"
                              : "active-games-fallback",
                    picked_game_id: top9Final?.id,
                    picked_via: top9Resolution.game
                        ? top9Resolution.picked_via
                        : top9Final
                          ? "query"
                          : undefined,
                    error: top9Resolution.error,
                    candidates: (top9Games.length > 0
                        ? top9Games
                        : broadGames.length > 0
                          ? broadGames
                          : activeGames
                    )
                        .slice(0, 5)
                        .map(createDebugCandidate),
                },
            ];

            const nextRooms = this._rooms.map((room) => {
                const observedGame = roomUpdates[room.id];
                if (!observedGame) {
                    return room;
                }

                return {
                    ...room,
                    current_game: mapObservedGameToWatchedGame(observedGame),
                };
            });

            this.setRooms(nextRooms);
            this.setDebug({
                mode: this._mode,
                socket_connected: socket.connected,
                status: "ready",
                last_hydration_started_at: this._debug.last_hydration_started_at,
                last_hydration_finished_at: Date.now(),
                rooms: roomDebug,
            });

            if (this._active_room?.id) {
                const refreshedActiveRoom =
                    nextRooms.find((room) => room.id === this._active_room?.id) ?? null;
                if (refreshedActiveRoom) {
                    this.setActiveRoom(createRoomDetails(refreshedActiveRoom));
                }
            }
        } catch (error) {
            this.setDebug({
                mode: this._mode,
                socket_connected: socket.connected,
                status: "error",
                last_hydration_started_at: this._debug.last_hydration_started_at,
                last_hydration_finished_at: Date.now(),
                error: error instanceof Error ? error.message : String(error),
                rooms: [],
            });
        }
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

    public voteOnProposal(proposalId: string, choice: "change" | "keep"): void {
        const voter = createCurrentUser();
        if (this._mode === "demo" && this._mock_service && this._active_room?.id) {
            this._mock_service.voteOnProposal(this._active_room.id, proposalId, voter, choice);
            return;
        }

        let resolvedProposal: KibitzProposal | null = null;

        const proposals = this._proposals.map((proposal) => {
            if (
                proposal.id !== proposalId ||
                !proposal.vote_state ||
                proposal.status !== "active"
            ) {
                return proposal;
            }

            const alreadyVoted =
                proposal.vote_state.change_votes.some((entry) => entry.id === voter.id) ||
                proposal.vote_state.keep_votes.some((entry) => entry.id === voter.id);
            if (alreadyVoted) {
                return proposal;
            }

            const nextProposal: KibitzProposal = {
                ...proposal,
                vote_state: {
                    ...proposal.vote_state,
                    change_votes:
                        choice === "change"
                            ? [...proposal.vote_state.change_votes, voter]
                            : proposal.vote_state.change_votes,
                    keep_votes:
                        choice === "keep"
                            ? [...proposal.vote_state.keep_votes, voter]
                            : proposal.vote_state.keep_votes,
                },
                status: choice === "change" ? "accepted" : "rejected",
            };
            resolvedProposal = nextProposal;
            return nextProposal;
        });

        this.setProposals(proposals);

        if (!resolvedProposal) {
            return;
        }

        const finalProposal = resolvedProposal as KibitzProposal;

        if (finalProposal.status === "accepted") {
            this.applyProposal(finalProposal);
        } else {
            this.rejectProposal(finalProposal);
        }
    }

    private applyProposal(proposal: KibitzProposal): void {
        this._rooms = this._rooms.map((room) =>
            room.id === proposal.room_id
                ? {
                      ...room,
                      current_game: proposal.proposed_game,
                  }
                : room,
        );
        this.emit("rooms-changed", this._rooms);

        if (this._active_room?.id === proposal.room_id) {
            this.setActiveRoom(
                createRoomDetails(
                    this._rooms.find((room) => room.id === proposal.room_id) as KibitzRoomSummary,
                ),
            );
        }

        this.setStream([
            ...this._stream,
            {
                id: `${proposal.id}-accepted`,
                room_id: proposal.room_id,
                type: "proposal_result",
                created_at: Date.now(),
                text: `Change board won. Switched to ${proposal.proposed_game.title}.`,
                game_id: proposal.proposed_game.game_id,
                proposal_id: proposal.id,
            },
        ]);

        if (!this._secondary_pane.variation_source_game) {
            this.clearPreviewGame();
        }
        this.advanceProposalQueue(proposal.id);
    }

    private rejectProposal(proposal: KibitzProposal): void {
        this.setStream([
            ...this._stream,
            {
                id: `${proposal.id}-rejected`,
                room_id: proposal.room_id,
                type: "proposal_result",
                created_at: Date.now(),
                text: `Keeping current board in ${proposal.room_id}.`,
                game_id: proposal.proposed_game.game_id,
                proposal_id: proposal.id,
            },
        ]);

        this.advanceProposalQueue(proposal.id);
    }

    private advanceProposalQueue(resolvedProposalId: string): void {
        const remaining = this._proposals.filter((proposal) => proposal.id !== resolvedProposalId);
        const firstQueued = remaining.find((proposal) => proposal.status === "queued");
        if (firstQueued) {
            firstQueued.status = "active";
        }
        this.setProposals(remaining);
    }

    public selectRoom(roomId: string): void {
        if (this._mode === "demo" && this._mock_service) {
            const room = this._mock_service.getRoom(roomId);

            if (!room) {
                this.setActiveRoom(null);
                this.setStream([]);
                this.setProposals([]);
                this.setVariations([]);
                return;
            }

            this.setActiveRoom(room);
            this.setStream(this._mock_service.getStream(roomId));
            const proposals = this._mock_service.getProposals(roomId);
            this.setProposals(proposals);
            this.setVariations(this._mock_service.getVariations(roomId));
            this.setSecondaryPane({
                collapsed: true,
                size: "small",
                preview_game_id: undefined,
                variation_id: undefined,
                variation_source_game_id: undefined,
                variation_source_game: undefined,
            });
            return;
        }

        const room = this._rooms.find((entry) => entry.id === roomId) ?? null;

        if (!room) {
            this.setActiveRoom(null);
            this.setStream([]);
            this.setProposals([]);
            this.setVariations([]);
            return;
        }

        this.setActiveRoom(createRoomDetails(room));
        this.setStream(createRoomStream(room));
        this.setProposals([]);
        this.setVariations([]);
    }

    public createRoom(
        game: KibitzWatchedGame,
        roomName: string,
        description: string,
    ): string | null {
        if (this._mode === "demo" && this._mock_service) {
            const room = this._mock_service.createRoom(game, roomName, description);
            this.selectRoom(room.id);
            return room.id;
        }

        const roomId = `user-room-${this._local_room_sequence++}`;
        const room: KibitzRoomSummary = {
            id: roomId,
            channel: `kibitz-${roomId}`,
            title: roomName.trim() || game.title,
            kind: "user",
            viewer_count: 1,
            description: description.trim() || undefined,
            proposals_enabled: true,
            current_game: game,
        };

        this.setRooms([room, ...this._rooms]);
        this.selectRoom(roomId);
        return roomId;
    }

    public changeBoard(roomId: string, game: KibitzWatchedGame): boolean {
        if (this._mode === "demo" && this._mock_service) {
            return this._mock_service.changeBoard(roomId, game) !== null;
        }

        let found = false;
        const nextRooms = this._rooms.map((room) => {
            if (room.id !== roomId) {
                return room;
            }

            found = true;
            return {
                ...room,
                current_game: game,
            };
        });

        if (!found) {
            return false;
        }

        this.setRooms(nextRooms);
        if (this._active_room?.id === roomId) {
            this.selectRoom(roomId);
        }

        return true;
    }

    public findRoomByGameId(gameId: number): KibitzRoomSummary | null {
        if (this._mode === "demo" && this._mock_service) {
            return this._mock_service.findRoomByGameId(gameId);
        }

        return this._rooms.find((room) => room.current_game?.game_id === gameId) ?? null;
    }

    public sendMessage(roomId: string, text: string): void {
        if (this._mode === "demo" && this._mock_service) {
            this._mock_service.appendMessage(roomId, createCurrentUser(), text);
        }
    }

    public postVariation(roomId: string, boardController: GobanController): boolean {
        const prepared = boardController.buildAnalysisSnapshot();
        if (prepared.is_duplicate) {
            return false;
        }

        const sourceGameId = this.resolveSecondarySourceGameId();
        if (!sourceGameId) {
            return false;
        }

        if (this._mode === "demo" && this._mock_service) {
            const variation = this._mock_service.createVariation(
                roomId,
                createCurrentUser(),
                sourceGameId,
                prepared,
            );

            if (variation) {
                boardController.recordAnalysisSent(prepared.analysis);
                this.openVariation(variation.id);
                return true;
            }

            return false;
        }

        console.warn("Live kibitz variation posting is not wired yet");
        return false;
    }

    public getRoomUsers(roomId: string): KibitzRoomUser[] {
        if (this._mode === "demo" && this._mock_service) {
            return this._mock_service.getRoom(roomId)?.users ?? [];
        }

        return this._active_room?.id === roomId ? this._active_room.users : [];
    }

    private resolveSecondarySourceGameId(): number | undefined {
        if (this._secondary_pane.variation_id) {
            return this._variations.find(
                (variation) => variation.id === this._secondary_pane.variation_id,
            )?.game_id;
        }

        return this._secondary_pane.preview_game_id ?? this._active_room?.current_game?.game_id;
    }
}
