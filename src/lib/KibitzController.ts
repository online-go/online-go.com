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

function formatProposalSummary(game: KibitzRoomSummary["current_game"]): string {
    if (!game) {
        return "";
    }

    return `switching main game to ${game.title} (${game.black.username} vs ${game.white.username}, ${game.board_size}, move ${game.move_number ?? 0})`;
}

export class KibitzController extends EventEmitter<KibitzControllerEvents> {
    private _mode: KibitzMode;
    private _rooms: KibitzRoomSummary[] = [];
    private _active_room: KibitzRoom | null = null;
    private _stream: KibitzStreamItem[] = [];
    private _proposals: KibitzProposal[] = [];
    private _variations: KibitzVariationSummary[] = [];
    private _secondary_pane: KibitzSecondaryPaneState = { collapsed: true, size: "small" };
    private _mock_service: KibitzMockService | null = null;
    private _mock_sync_timer: ReturnType<typeof setInterval> | null = null;
    private _destroyed = false;
    private _debug: KibitzDebugState = {
        mode: "live",
        socket_connected: socket.connected,
        status: "idle",
        rooms: [],
    };

    public get mode(): KibitzMode {
        return this._mode;
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

    public get destroyed(): boolean {
        return this._destroyed;
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
            this._mock_sync_timer = setInterval(() => {
                this.syncFromMockService();
            }, 1000);
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
        if (this._mock_sync_timer) {
            clearInterval(this._mock_sync_timer);
            this._mock_sync_timer = null;
        }
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

    private syncDemoSecondaryPaneWithActiveProposal(proposals: KibitzProposal[]): void {
        const activeProposal = proposals.find((proposal) => proposal.status === "active");

        if (this._secondary_pane.variation_id) {
            return;
        }

        if (activeProposal) {
            const nextPreviewGameId = activeProposal.proposed_game.game_id;

            if (this._secondary_pane.preview_game_id !== nextPreviewGameId) {
                this.setSecondaryPane({
                    ...this._secondary_pane,
                    preview_game_id: nextPreviewGameId,
                    variation_id: undefined,
                });
            }
            return;
        }

        if (this._secondary_pane.preview_game_id) {
            this.setSecondaryPane({
                ...this._secondary_pane,
                preview_game_id: undefined,
                variation_id: undefined,
            });
        }
    }

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
            const proposals = this._mock_service.getProposals(this._active_room.id);
            this.setProposals(proposals);
            this.setVariations(this._mock_service.getVariations(this._active_room.id));
            this.syncDemoSecondaryPaneWithActiveProposal(proposals);
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
        });
    }

    public clearPreviewGame(): void {
        this.setSecondaryPane({
            ...this._secondary_pane,
            size: this._secondary_pane.size ?? "small",
            preview_game_id: undefined,
            variation_id: undefined,
        });
    }

    public openVariation(variationId: string): void {
        this.setSecondaryPane({
            ...this._secondary_pane,
            collapsed: false,
            size: this._secondary_pane.size ?? "small",
            preview_game_id: undefined,
            variation_id: variationId,
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

    public proposePreviewedGame(roomId: string): void {
        const previewGameId = this._secondary_pane.preview_game_id;
        if (!previewGameId) {
            return;
        }

        const room = this._rooms.find((entry) => entry.id === roomId);
        const sourceRoom = this._rooms.find(
            (entry) => entry.current_game?.game_id === previewGameId,
        );
        const proposedGame = sourceRoom?.current_game;

        if (!room || !proposedGame) {
            return;
        }

        if (this._mode === "demo" && this._mock_service) {
            this._mock_service.createProposal(roomId, createCurrentUser(), proposedGame);
            this.clearPreviewGame();
            return;
        }

        const activeProposalExists = this._proposals.some(
            (proposal) => proposal.status === "active",
        );
        const proposer = createCurrentUser();
        const proposal: KibitzProposal = {
            id: `proposal-${Date.now()}`,
            room_id: roomId,
            proposer,
            proposed_game: proposedGame,
            status: activeProposalExists ? "queued" : "active",
            created_at: Date.now(),
            cooldown_seconds: 30,
            vote_state: {
                change_votes: [],
                keep_votes: [],
                abstain_count: 0,
                ends_at: Date.now() + 30_000,
            },
        };

        this.setProposals([...this._proposals, proposal]);
        this.setStream([
            ...this._stream,
            {
                id: `${proposal.id}-started`,
                room_id: roomId,
                type: "proposal_started",
                created_at: Date.now(),
                author: proposer,
                text: `${proposer.username} proposed ${formatProposalSummary(proposedGame)}.`,
                game_id: proposedGame.game_id,
                proposal_id: proposal.id,
            },
        ]);
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

        this.clearPreviewGame();
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
            });
            this.syncDemoSecondaryPaneWithActiveProposal(proposals);
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

    public sendMessage(roomId: string, text: string): void {
        if (this._mode === "demo" && this._mock_service) {
            this._mock_service.appendMessage(roomId, createCurrentUser(), text);
        }
    }

    public getRoomUsers(roomId: string): KibitzRoomUser[] {
        if (this._mode === "demo" && this._mock_service) {
            return this._mock_service.getRoom(roomId)?.users ?? [];
        }

        return this._active_room?.id === roomId ? this._active_room.users : [];
    }
}
