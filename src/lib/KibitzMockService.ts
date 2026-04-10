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

/* cspell: words cooldown moyo Niko Sabaki tenukis endgame Maru Miri Noor */

import { EventEmitter } from "eventemitter3";
import { encodeMove } from "goban";
import type { PreparedAnalysisSnapshot } from "@/lib/GobanController";
import type {
    KibitzProposal,
    KibitzRoom,
    KibitzRoomSummary,
    KibitzRoomUser,
    KibitzStreamItem,
    KibitzVariationSummary,
    KibitzWatchedGame,
} from "@/models/kibitz";

interface KibitzMockServiceEvents {
    changed: () => void;
}

interface MockRoomState {
    room: KibitzRoom;
    stream: KibitzStreamItem[];
    proposals: KibitzProposal[];
    variations: KibitzVariationSummary[];
    messagePool: string[];
    proposalPool?: KibitzWatchedGame[];
    nextProposalAt?: number;
    proposalCursor?: number;
    viewerFloor: number;
    viewerCeiling: number;
}

function hashUsername(username: string): number {
    return username.split("").reduce((value, character) => value + character.charCodeAt(0), 0);
}

function createMiniAvatar(id: number, username: string): string {
    const hue = (id * 37 + hashUsername(username) * 11) % 360;
    const hue2 = (hue + 32) % 360;
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
            <defs>
                <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stop-color="hsl(${hue} 72% 58%)" />
                    <stop offset="100%" stop-color="hsl(${hue2} 68% 44%)" />
                </linearGradient>
            </defs>
            <rect width="40" height="40" rx="8" fill="url(#g)" />
            <circle cx="20" cy="14.5" r="6.25" fill="rgba(255,255,255,0.86)" />
            <path d="M9.5 32c1.3-5.3 5.6-8.3 10.5-8.3S29.2 26.7 30.5 32" fill="rgba(255,255,255,0.86)" />
            <circle cx="14" cy="11" r="2" fill="rgba(255,255,255,0.12)" />
        </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createUser(
    id: number,
    username: string,
    ranking: number,
    overrides: Partial<KibitzRoomUser> = {},
): KibitzRoomUser {
    return {
        id,
        username,
        ranking,
        professional: false,
        ui_class: "",
        icon: createMiniAvatar(id, username),
        ...overrides,
    };
}

function createMoves(coords: Array<[number, number]>): Array<{ x: number; y: number }> {
    return coords.map(([x, y]) => ({ x, y }));
}

function createMockGame(
    gameId: number,
    boardSize: 9 | 19,
    title: string,
    black: KibitzRoomUser,
    white: KibitzRoomUser,
    moves: Array<[number, number]>,
    tournamentName?: string,
): KibitzWatchedGame {
    return {
        game_id: gameId,
        board_size: `${boardSize}x${boardSize}`,
        title,
        black,
        white,
        tournament_name: tournamentName,
        move_number: moves.length,
        live: true,
        mock_game_data: {
            width: boardSize,
            height: boardSize,
            game_name: title,
            players: {
                black,
                white,
            },
            moves: createMoves(moves),
            phase: "play",
            komi: boardSize === 9 ? 6.5 : 7.5,
            initial_player: "black",
        },
    };
}

function formatProposalSummary(game: KibitzWatchedGame): string {
    return `switching main game to ${game.title} (${game.black.username} vs ${game.white.username}, ${game.board_size}, move ${game.move_number ?? 0})`;
}

function choice<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
    const next = [...items];

    for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }

    return next;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function buildEncodedMoves(moves: Array<{ x: number; y: number }>): string {
    return moves.map((move) => encodeMove(move.x, move.y)).join("");
}

function pickActiveChatters(users: KibitzRoomUser[], count: number): KibitzRoomUser[] {
    return shuffle(users).slice(0, Math.min(users.length, count));
}

function createRooms(): MockRoomState[] {
    const vera = createUser(5001, "VeraFuseki", 29, { country: "KR" });
    const jun = createUser(5002, "JunShape", 27, { country: "JP" });
    const ona = createUser(5003, "OnaSabaki", 24, { country: "DE" });
    const pax = createUser(5004, "PaxCut", 25, { country: "US" });
    const rei = createUser(5005, "ReiProbe", 22, { country: "TW" });
    const mia = createUser(5006, "MiaClamp", 19, { country: "NL" });

    const topRoomUsers = [
        vera,
        jun,
        createUser(5010, "LioThickness", 20, { country: "CA" }),
        createUser(5011, "KaraAji", 17, { country: "FR" }),
        createUser(5016, "MaruFuseki", 23, { country: "SE" }),
        createUser(5017, "HanaProbe", 18, { country: "FI" }),
        createUser(5018, "DaeTerritory", 16, { country: "KR" }),
        createUser(5019, "GioMoyo", 15, { country: "IT" }),
        createUser(5020, "UmaJoseki", 21, { country: "BR" }),
        createUser(5021, "RinEndgame", 14, { country: "JP" }),
        createUser(5022, "CatoInfluence", 13, { country: "GB" }),
        createUser(5023, "MiriPeep", 12, { country: "PL" }),
    ];
    const tournamentUsers = [
        ona,
        pax,
        createUser(5012, "NikoReview", 18, { country: "NL" }),
        createUser(5013, "SaeTesuji", 21, { country: "JP" }),
        createUser(5024, "BexEndgame", 17, { country: "GB" }),
        createUser(5025, "RookShape", 16, { country: "US" }),
        createUser(5026, "LenaCount", 19, { country: "DE" }),
        createUser(5027, "PoriClamp", 14, { country: "SE" }),
        createUser(5028, "AkiMoyo", 20, { country: "JP" }),
    ];
    const fastUsers = [
        rei,
        mia,
        createUser(5014, "TaoSnapback", 16, { country: "CN" }),
        createUser(5015, "EliKo", 14, { country: "US" }),
        createUser(5029, "JinAtari", 13, { country: "KR" }),
        createUser(5030, "PiaCapture", 11, { country: "NO" }),
        createUser(5031, "KioLadder", 12, { country: "FI" }),
    ];

    const currentGame19 = createMockGame(910001, 19, "Wide moyo pressure test", vera, jun, [
        [3, 3],
        [15, 15],
        [15, 3],
        [3, 15],
        [10, 16],
        [16, 10],
        [4, 10],
        [10, 4],
        [6, 15],
        [13, 3],
        [5, 5],
        [14, 14],
        [3, 10],
        [16, 4],
        [10, 3],
        [9, 15],
    ]);
    const tournamentGame = createMockGame(
        910002,
        19,
        "Semifinal game three",
        ona,
        pax,
        [
            [15, 3],
            [3, 15],
            [3, 3],
            [15, 15],
            [10, 3],
            [3, 10],
            [16, 10],
            [10, 16],
            [5, 15],
            [14, 5],
            [6, 4],
            [13, 16],
            [7, 15],
            [12, 4],
        ],
        "OGS Beta Cup",
    );
    const currentGame9 = createMockGame(910003, 9, "9x9 opening knife fight", rei, mia, [
        [2, 2],
        [6, 6],
        [6, 2],
        [2, 6],
        [4, 2],
        [4, 6],
        [2, 4],
        [6, 4],
        [4, 4],
        [3, 3],
        [5, 5],
        [3, 5],
    ]);
    const tournamentProposalGameA = createMockGame(
        910004,
        19,
        "Center reduction race",
        createUser(5007, "SoraInfluence", 26, { country: "JP" }),
        createUser(5008, "MikTerritory", 25, { country: "RU" }),
        [
            [3, 3],
            [15, 15],
            [15, 3],
            [3, 15],
            [10, 16],
            [16, 10],
            [4, 10],
            [10, 4],
            [5, 5],
            [14, 14],
            [6, 10],
            [13, 9],
        ],
        "OGS Beta Cup",
    );
    const tournamentProposalGameB = createMockGame(
        910005,
        19,
        "Lower side squeeze test",
        createUser(5032, "ToriInfluence", 22, { country: "JP" }),
        createUser(5033, "MaxAji", 23, { country: "US" }),
        [
            [15, 15],
            [3, 3],
            [3, 15],
            [15, 3],
            [10, 3],
            [4, 10],
            [16, 10],
            [10, 16],
            [7, 4],
            [12, 15],
            [6, 6],
            [13, 13],
            [4, 6],
            [15, 12],
        ],
        "OGS Beta Cup",
    );
    const tournamentProposalGameC = createMockGame(
        910006,
        19,
        "Ko timing fight",
        createUser(5034, "RaeSente", 21, { country: "CA" }),
        createUser(5035, "NoorCut", 22, { country: "FR" }),
        [
            [3, 3],
            [15, 3],
            [3, 15],
            [15, 15],
            [10, 4],
            [4, 10],
            [16, 10],
            [10, 16],
            [6, 6],
            [14, 14],
            [7, 10],
            [13, 10],
            [9, 14],
            [11, 6],
        ],
        "OGS Beta Cup",
    );
    const topProposalGameA = createMockGame(910007, 19, "Top side squeeze fight", vera, jun, [
        [3, 3],
        [15, 15],
        [15, 3],
        [3, 15],
        [10, 16],
        [16, 10],
        [4, 10],
        [10, 4],
        [5, 14],
        [14, 6],
        [7, 15],
        [12, 13],
        [8, 14],
        [11, 12],
    ]);
    const topProposalGameB = createMockGame(910008, 19, "Right side forcing race", vera, jun, [
        [3, 3],
        [15, 15],
        [15, 3],
        [3, 15],
        [10, 16],
        [16, 10],
        [4, 10],
        [10, 4],
        [14, 10],
        [5, 15],
        [13, 11],
        [6, 14],
        [15, 12],
        [7, 13],
    ]);

    return [
        {
            room: {
                id: "top-19x19",
                channel: "kibitz-top-19x19",
                title: "Top 19x19",
                kind: "preset",
                viewer_count: 18,
                proposals_enabled: true,
                current_game: currentGame19,
                users: topRoomUsers,
                active_chatters: pickActiveChatters(topRoomUsers, 5),
                friends_in_room: topRoomUsers.slice(5, 8),
                active_variation_ids: ["var-top-1"],
            },
            stream: [
                {
                    id: "top-19x19-sys",
                    room_id: "top-19x19",
                    type: "system",
                    created_at: Date.now() - 300_000,
                    text: "Room primed in demo mode with a seeded board discussion.",
                    game_id: currentGame19.game_id,
                },
                {
                    id: "top-19x19-join-1",
                    room_id: "top-19x19",
                    type: "system",
                    created_at: Date.now() - 285_000,
                    text: `${topRoomUsers[3].username} joined chat.`,
                    game_id: currentGame19.game_id,
                },
                {
                    id: "top-19x19-chat-1",
                    room_id: "top-19x19",
                    type: "chat",
                    created_at: Date.now() - 240_000,
                    author: topRoomUsers[2],
                    text: "Black is framing the top while keeping sente for the right side.",
                    game_id: currentGame19.game_id,
                },
                {
                    id: "top-19x19-chat-2",
                    room_id: "top-19x19",
                    type: "chat",
                    created_at: Date.now() - 210_000,
                    author: topRoomUsers[6],
                    text: "The shoulder-hit still feels biggest if white settles too calmly.",
                    game_id: currentGame19.game_id,
                },
                {
                    id: "top-19x19-var-post-1",
                    room_id: "top-19x19",
                    type: "variation_posted",
                    created_at: Date.now() - 170_000,
                    author: topRoomUsers[1],
                    text: "Posted a variation: Black shoulder-hit follow-up.",
                    game_id: currentGame19.game_id,
                    variation_id: "var-top-1",
                },
            ],
            proposals: [],
            variations: [
                {
                    id: "var-top-1",
                    room_id: "top-19x19",
                    game_id: currentGame19.game_id,
                    creator: topRoomUsers[1],
                    created_at: Date.now() - 180_000,
                    viewer_count: 4,
                    current_viewers: topRoomUsers.slice(0, 4),
                    move_count: 7,
                    title: "Black shoulder-hit follow-up",
                    mock_game_data: {
                        width: 19,
                        height: 19,
                        game_name: "Black shoulder-hit follow-up",
                        players: {
                            black: vera,
                            white: jun,
                        },
                        moves: createMoves([
                            [3, 3],
                            [15, 15],
                            [15, 3],
                            [3, 15],
                            [10, 16],
                            [16, 10],
                            [4, 10],
                            [10, 4],
                            [11, 15],
                            [11, 13],
                            [9, 14],
                            [13, 12],
                            [8, 15],
                            [12, 14],
                        ]),
                        phase: "play",
                        komi: 7.5,
                        initial_player: "black",
                    },
                },
            ],
            messagePool: [
                "Black is framing the top while keeping sente for the right side.",
                "The room is converging on the same shape judgment now.",
                "White probably wants outside influence more than immediate territory here.",
                "That peep matters more as a forcing move than as an endgame point.",
                "This is the kind of line that deserves a side variation, not a board switch.",
                "If white answers solidly, black keeps the better direction of play.",
                "A lighter answer on the upper side might preserve more aji.",
                "The moyo looks big, but the cuts are doing a lot of hidden work.",
            ],
            viewerFloor: 16,
            viewerCeiling: 22,
            proposalPool: [topProposalGameA, topProposalGameB],
            nextProposalAt: Date.now() + 18_000,
            proposalCursor: 0,
        },
        {
            room: {
                id: "tournament-pick",
                channel: "kibitz-tournament-pick",
                title: "Tournament Pick",
                kind: "preset",
                viewer_count: 11,
                proposals_enabled: true,
                current_game: tournamentGame,
                users: tournamentUsers,
                active_chatters: pickActiveChatters(tournamentUsers, 4),
                friends_in_room: tournamentUsers.slice(4, 7),
                active_variation_ids: [],
            },
            stream: [
                {
                    id: "tournament-pick-chat-1",
                    room_id: "tournament-pick",
                    type: "chat",
                    created_at: Date.now() - 160_000,
                    author: tournamentUsers[3],
                    text: "If white tenukis again, the lower side gets severe quickly.",
                    game_id: tournamentGame.game_id,
                },
                {
                    id: "tournament-pick-chat-2",
                    room_id: "tournament-pick",
                    type: "chat",
                    created_at: Date.now() - 130_000,
                    author: tournamentUsers[6],
                    text: "This one might actually be worth switching to if the vote gets moving.",
                    game_id: tournamentGame.game_id,
                },
                {
                    id: "tournament-pick-proposal-seeded",
                    room_id: "tournament-pick",
                    type: "proposal_started",
                    created_at: Date.now() - 100_000,
                    author: tournamentUsers[2],
                    text: `${tournamentUsers[2].username} proposed ${formatProposalSummary(tournamentProposalGameA)}.`,
                    game_id: tournamentProposalGameA.game_id,
                    proposal_id: "tournament-pick-proposal-1",
                },
            ],
            proposals: [
                {
                    id: "tournament-pick-proposal-1",
                    room_id: "tournament-pick",
                    proposer: tournamentUsers[2],
                    proposed_game: tournamentProposalGameA,
                    status: "active",
                    created_at: Date.now() - 10_000,
                    cooldown_seconds: 45,
                    vote_state: {
                        change_votes: [tournamentUsers[3], tournamentUsers[6]],
                        keep_votes: [tournamentUsers[1]],
                        abstain_count: 0,
                        ends_at: Date.now() + 35_000,
                    },
                },
            ],
            variations: [],
            messagePool: [
                "This candidate feels sharper than the current semifinal board.",
                "The room seems split between steady territory and a more tactical fight.",
                "If the timer gets low, late voters probably swing to keep current.",
                "This proposal has more immediate contact play, which is why chat is reacting to it.",
                "The current board is calmer, but this candidate is definitely spicier.",
                "I can see the argument for keeping the main stream stable a little longer.",
                "Change board might win if two more people pile in now.",
                "The tournament room always wakes up when the proposal clock gets below ten seconds.",
            ],
            proposalPool: [
                tournamentProposalGameA,
                tournamentProposalGameB,
                tournamentProposalGameC,
            ],
            nextProposalAt: Date.now() + 50_000,
            proposalCursor: 1,
            viewerFloor: 10,
            viewerCeiling: 16,
        },
        {
            room: {
                id: "top-9x9",
                channel: "kibitz-top-9x9",
                title: "Top 9x9",
                kind: "preset",
                viewer_count: 7,
                proposals_enabled: true,
                current_game: currentGame9,
                users: fastUsers,
                active_chatters: pickActiveChatters(fastUsers, 4),
                friends_in_room: fastUsers.slice(4),
                active_variation_ids: [],
            },
            stream: [
                {
                    id: "top-9x9-chat-1",
                    room_id: "top-9x9",
                    type: "chat",
                    created_at: Date.now() - 90_000,
                    author: fastUsers[2],
                    text: "Everything here is one tempo away from collapse.",
                    game_id: currentGame9.game_id,
                },
                {
                    id: "top-9x9-chat-2",
                    room_id: "top-9x9",
                    type: "chat",
                    created_at: Date.now() - 70_000,
                    author: fastUsers[4],
                    text: "A single bad shape move here and the corner is just gone.",
                    game_id: currentGame9.game_id,
                },
            ],
            proposals: [],
            variations: [],
            messagePool: [
                "Everything here is one tempo away from collapse.",
                "On 9x9 that peep is basically asking to start a fight immediately.",
                "You can almost count liberties faster than points in this one.",
                "If black misses the shape point now, the whole side caves in.",
                "This room wakes up whenever someone suggests a snapback that almost works.",
                "The corner is alive-ish, which is the most dangerous kind of alive.",
            ],
            viewerFloor: 6,
            viewerCeiling: 10,
        },
    ];
}

export class KibitzMockService extends EventEmitter<KibitzMockServiceEvents> {
    private rooms = new Map<string, MockRoomState>();
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private activityTimer: ReturnType<typeof setInterval> | null = null;
    private proposalSequence = 100;
    private variationSequence = 100;

    constructor() {
        super();

        for (const room of createRooms()) {
            this.rooms.set(room.room.id, room);
        }

        this.heartbeatTimer = setInterval(this.tickHeartbeat, 1000);
        this.activityTimer = setInterval(this.simulateActivity, 2500);
    }

    public destroy(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }

        if (this.activityTimer) {
            clearInterval(this.activityTimer);
            this.activityTimer = null;
        }
    }

    public listRooms(): KibitzRoomSummary[] {
        return Array.from(this.rooms.values()).map((entry) => ({ ...entry.room }));
    }

    public getRoom(roomId: string): KibitzRoom | null {
        const room = this.rooms.get(roomId);
        return room ? { ...room.room } : null;
    }

    public getStream(roomId: string): KibitzStreamItem[] {
        return [...(this.rooms.get(roomId)?.stream ?? [])];
    }

    public getProposals(roomId: string): KibitzProposal[] {
        return [...(this.rooms.get(roomId)?.proposals ?? [])];
    }

    public getVariations(roomId: string): KibitzVariationSummary[] {
        return [...(this.rooms.get(roomId)?.variations ?? [])];
    }

    public appendMessage(roomId: string, author: KibitzRoomUser, text: string): void {
        const room = this.rooms.get(roomId);
        if (!room || !text.trim()) {
            return;
        }

        this.pushStreamItem(room, {
            id: `${roomId}-chat-${Date.now()}`,
            room_id: roomId,
            type: "chat",
            created_at: Date.now(),
            author,
            text: text.trim(),
            game_id: room.room.current_game?.game_id,
        });
        this.emit("changed");
    }

    public createProposal(
        roomId: string,
        proposer: KibitzRoomUser,
        proposedGame: KibitzWatchedGame,
    ): void {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }

        const proposal = this.startProposal(room, proposer, proposedGame, 30);
        if (proposal) {
            this.emit("changed");
        }
    }

    public voteOnProposal(
        roomId: string,
        proposalId: string,
        voter: KibitzRoomUser,
        choice: "change" | "keep",
    ): void {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }

        const proposal = room.proposals.find((entry) => entry.id === proposalId);
        if (!proposal || proposal.status !== "active" || !proposal.vote_state) {
            return;
        }

        const alreadyVoted =
            proposal.vote_state.change_votes.some((entry) => entry.id === voter.id) ||
            proposal.vote_state.keep_votes.some((entry) => entry.id === voter.id);
        if (alreadyVoted) {
            return;
        }

        if (choice === "change") {
            proposal.vote_state.change_votes.push(voter);
        } else {
            proposal.vote_state.keep_votes.push(voter);
        }

        this.pushStreamItem(room, {
            id: `${proposal.id}-vote-${voter.id}-${Date.now()}`,
            room_id: roomId,
            type: "system",
            created_at: Date.now(),
            text: `${voter.username} voted to ${choice === "change" ? "change board" : "keep current"}.`,
            game_id: proposal.proposed_game.game_id,
            proposal_id: proposal.id,
        });
        this.emit("changed");
    }

    public createVariation(
        roomId: string,
        creator: KibitzRoomUser,
        sourceGameId: number,
        snapshot: PreparedAnalysisSnapshot,
    ): KibitzVariationSummary | null {
        const room = this.rooms.get(roomId);
        if (!room) {
            return null;
        }

        const variation: KibitzVariationSummary = {
            id: `${roomId}-variation-${this.variationSequence}`,
            room_id: roomId,
            game_id: sourceGameId,
            creator,
            created_at: Date.now(),
            viewer_count: 1,
            current_viewers: [creator],
            move_count: snapshot.move_count,
            title: snapshot.analysis.name,
            analysis_from: snapshot.analysis.from,
            analysis_moves: snapshot.analysis.moves,
            analysis_marks: snapshot.analysis.marks,
            analysis_pen_marks: snapshot.analysis.pen_marks,
            mock_game_data: {
                width: snapshot.width,
                height: snapshot.height,
                game_name: snapshot.analysis.name,
                players: {
                    black: createUser(
                        snapshot.players.black.id,
                        snapshot.players.black.username,
                        0,
                    ),
                    white: createUser(
                        snapshot.players.white.id,
                        snapshot.players.white.username,
                        0,
                    ),
                },
                moves: snapshot.moves,
                phase: "play",
                komi: snapshot.width === 9 ? 6.5 : 7.5,
                initial_player: "black",
            },
        };

        this.variationSequence += 1;
        room.variations.unshift(variation);
        room.room.active_variation_ids.unshift(variation.id);
        this.pushStreamItem(room, {
            id: `${variation.id}-posted`,
            room_id: roomId,
            type: "variation_posted",
            created_at: Date.now(),
            author: creator,
            text: `${creator.username} posted a variation: ${variation.title}.`,
            game_id: variation.game_id,
            variation_id: variation.id,
        });
        this.emit("changed");

        return variation;
    }

    private startProposal(
        room: MockRoomState,
        proposer: KibitzRoomUser,
        proposedGame: KibitzWatchedGame,
        cooldownSeconds: number,
    ): KibitzProposal | null {
        const activeProposalExists = room.proposals.some(
            (proposal) => proposal.status === "active",
        );
        const proposal: KibitzProposal = {
            id: `${room.room.id}-proposal-${this.proposalSequence}`,
            room_id: room.room.id,
            proposer,
            proposed_game: proposedGame,
            status: activeProposalExists ? "queued" : "active",
            created_at: Date.now(),
            cooldown_seconds: cooldownSeconds,
            vote_state: {
                change_votes: [],
                keep_votes: [],
                abstain_count: 0,
                ends_at: Date.now() + cooldownSeconds * 1000,
            },
        };

        this.proposalSequence += 1;
        room.proposals.push(proposal);
        this.pushStreamItem(room, {
            id: `${proposal.id}-started`,
            room_id: room.room.id,
            type: "proposal_started",
            created_at: Date.now(),
            author: proposer,
            text: `${proposer.username} proposed ${formatProposalSummary(proposedGame)}.`,
            game_id: proposedGame.game_id,
            proposal_id: proposal.id,
        });

        return proposal;
    }

    private resolveProposal(
        room: MockRoomState,
        proposal: KibitzProposal,
        accepted: boolean,
        endedByClock: boolean,
    ): void {
        proposal.status = accepted ? "accepted" : "rejected";

        if (accepted) {
            room.room.current_game = proposal.proposed_game;
            this.pushStreamItem(room, {
                id: `${proposal.id}-accepted`,
                room_id: room.room.id,
                type: "proposal_result",
                created_at: Date.now(),
                text: endedByClock
                    ? `Clock expired. Change board won. Switched to ${proposal.proposed_game.title}.`
                    : `Change board won. Switched to ${proposal.proposed_game.title}.`,
                game_id: proposal.proposed_game.game_id,
                proposal_id: proposal.id,
            });
        } else {
            this.pushStreamItem(room, {
                id: `${proposal.id}-rejected`,
                room_id: room.room.id,
                type: "proposal_result",
                created_at: Date.now(),
                text: endedByClock
                    ? "Clock expired. Keeping current board."
                    : "Keeping current board.",
                game_id: proposal.proposed_game.game_id,
                proposal_id: proposal.id,
            });
        }

        room.proposals = room.proposals.filter((entry) => entry.id !== proposal.id);
        const nextQueued = room.proposals.find((entry) => entry.status === "queued");
        if (nextQueued && nextQueued.vote_state) {
            nextQueued.status = "active";
            nextQueued.vote_state.ends_at = Date.now() + (nextQueued.cooldown_seconds ?? 30) * 1000;
            this.pushStreamItem(room, {
                id: `${nextQueued.id}-activated`,
                room_id: room.room.id,
                type: "system",
                created_at: Date.now(),
                text: `${nextQueued.proposer.username}'s proposal is now live.`,
                game_id: nextQueued.proposed_game.game_id,
                proposal_id: nextQueued.id,
            });
        } else if (room.room.id === "tournament-pick") {
            room.nextProposalAt = Date.now() + 10_000 + Math.floor(Math.random() * 8_000);
        }
    }

    private pushStreamItem(room: MockRoomState, item: KibitzStreamItem): void {
        room.stream.push(item);
        if (room.stream.length > 120) {
            room.stream = room.stream.slice(-120);
        }
    }

    private tickHeartbeat = (): void => {
        let changed = false;
        const now = Date.now();

        for (const room of this.rooms.values()) {
            const activeProposal = room.proposals.find(
                (proposal) => proposal.status === "active" && proposal.vote_state,
            );

            if (activeProposal?.vote_state && activeProposal.vote_state.ends_at <= now) {
                const changeVotes = activeProposal.vote_state.change_votes.length;
                const keepVotes = activeProposal.vote_state.keep_votes.length;
                this.resolveProposal(room, activeProposal, changeVotes > keepVotes, true);
                changed = true;
            }

            if (
                !room.proposals.some((proposal) => proposal.status === "active") &&
                (room.nextProposalAt ?? 0) <= now &&
                room.proposalPool &&
                room.proposalPool.length > 0
            ) {
                const nextIndex = room.proposalCursor ?? 0;
                const nextGame = room.proposalPool[nextIndex % room.proposalPool.length];
                const candidateProposers =
                    room.room.users.length > 2 ? room.room.users.slice(2) : room.room.users;
                const proposer = choice(candidateProposers);
                const cooldownSeconds = room.room.id === "tournament-pick" ? 45 : 30;
                this.startProposal(room, proposer, nextGame, cooldownSeconds);
                room.proposalCursor = (nextIndex + 1) % room.proposalPool.length;
                room.nextProposalAt =
                    room.room.id === "tournament-pick"
                        ? now + 15_000 + Math.floor(Math.random() * 10_000)
                        : now + 20_000 + Math.floor(Math.random() * 12_000);
                changed = true;
            }
        }

        if (changed) {
            this.emit("changed");
        }
    };

    private pickWeightedRoom(): MockRoomState {
        const rooms = Array.from(this.rooms.values());
        const bag: MockRoomState[] = [];

        for (const room of rooms) {
            const weight =
                room.room.id === "tournament-pick" ? 3 : room.room.id === "top-19x19" ? 2 : 1;

            for (let i = 0; i < weight; i += 1) {
                bag.push(room);
            }
        }

        return choice(bag);
    }

    private refreshActiveChatters(room: MockRoomState): void {
        const count = room.room.id === "tournament-pick" ? 4 : room.room.id === "top-19x19" ? 5 : 4;
        room.room.active_chatters = pickActiveChatters(room.room.users, count);
    }

    private simulateJoinOrPart(room: MockRoomState): boolean {
        if (Math.random() > 0.18) {
            return false;
        }

        const joining = Math.random() > 0.35;
        const actor = choice(room.room.users);

        room.room.viewer_count = clamp(
            room.room.viewer_count + (joining ? 1 : -1),
            room.viewerFloor,
            room.viewerCeiling,
        );

        this.pushStreamItem(room, {
            id: `${room.room.id}-${joining ? "join" : "part"}-${Date.now()}`,
            room_id: room.room.id,
            type: "system",
            created_at: Date.now(),
            text: joining ? `${actor.username} joined chat.` : `${actor.username} stepped out.`,
            game_id: room.room.current_game?.game_id,
        });
        this.refreshActiveChatters(room);

        return true;
    }

    private simulateChat(room: MockRoomState): boolean {
        if (room.room.active_chatters.length === 0) {
            this.refreshActiveChatters(room);
        }

        const speaker = choice(
            room.room.active_chatters.length > 0 ? room.room.active_chatters : room.room.users,
        );
        const message = choice(room.messagePool);

        this.pushStreamItem(room, {
            id: `${room.room.id}-sim-${Date.now()}-${speaker.id}`,
            room_id: room.room.id,
            type: "chat",
            created_at: Date.now(),
            author: speaker,
            text: message,
            game_id: room.room.current_game?.game_id,
        });

        if (Math.random() < 0.2) {
            const secondSpeaker = choice(room.room.active_chatters);
            const secondMessage = choice(room.messagePool);

            this.pushStreamItem(room, {
                id: `${room.room.id}-sim-${Date.now()}-${secondSpeaker.id}-burst`,
                room_id: room.room.id,
                type: "chat",
                created_at: Date.now() + 1,
                author: secondSpeaker,
                text: secondMessage,
                game_id: room.room.current_game?.game_id,
            });
        }

        return true;
    }

    private simulateVariationPost(room: MockRoomState): boolean {
        const sourceGame = room.room.current_game?.mock_game_data;
        if (!sourceGame) {
            return false;
        }

        const creator = choice(
            room.room.active_chatters.length > 0 ? room.room.active_chatters : room.room.users,
        );
        const baseMoves = sourceGame.moves.slice();
        const variationTail = choice([
            [
                { x: 11, y: 15 },
                { x: 11, y: 13 },
                { x: 9, y: 14 },
            ],
            [
                { x: 14, y: 10 },
                { x: 13, y: 11 },
                { x: 15, y: 12 },
            ],
            [
                { x: 5, y: 14 },
                { x: 7, y: 15 },
                { x: 8, y: 14 },
            ],
        ]);
        const moves = [...baseMoves, ...variationTail].filter(
            (move) => move.x < sourceGame.width && move.y < sourceGame.height,
        );
        const title = choice([
            "Black shoulder-hit follow-up",
            "Right side forcing line",
            "Top side squeeze continuation",
            "Cutting-point probe variation",
        ]);

        const snapshot: PreparedAnalysisSnapshot = {
            analysis: {
                type: "analysis",
                from: baseMoves.length,
                moves: buildEncodedMoves(moves),
                name: title,
            },
            auto_named: false,
            is_duplicate: false,
            move_count: moves.length,
            width: sourceGame.width,
            height: sourceGame.height,
            players: {
                black: {
                    id: sourceGame.players.black.id,
                    username: sourceGame.players.black.username,
                },
                white: {
                    id: sourceGame.players.white.id,
                    username: sourceGame.players.white.username,
                },
            },
            moves,
        };

        return this.createVariation(
            room.room.id,
            creator,
            room.room.current_game?.game_id ?? 0,
            snapshot,
        )
            ? true
            : false;
    }

    private chooseVoteChoice(
        room: MockRoomState,
        proposal: KibitzProposal,
        voter: KibitzRoomUser,
    ): "change" | "keep" {
        const seed = (voter.id + proposal.proposed_game.game_id) % 100;
        const proposalHeat =
            proposal.proposed_game.title.toLowerCase().includes("ko") ||
            proposal.proposed_game.title.toLowerCase().includes("race")
                ? 14
                : proposal.proposed_game.title.toLowerCase().includes("squeeze")
                  ? 8
                  : 0;
        const tournamentBonus = room.room.id === "tournament-pick" ? 8 : 0;
        const changeThreshold = 48 + proposalHeat + tournamentBonus;

        return seed < changeThreshold ? "change" : "keep";
    }

    private simulateProposalVote(room: MockRoomState): boolean {
        const activeProposal = room.proposals.find(
            (proposal) => proposal.status === "active" && proposal.vote_state,
        );
        if (!activeProposal || !activeProposal.vote_state) {
            return false;
        }

        const availableVoters = shuffle(
            room.room.users.filter(
                (user) =>
                    !activeProposal.vote_state?.change_votes.some(
                        (entry) => entry.id === user.id,
                    ) &&
                    !activeProposal.vote_state?.keep_votes.some((entry) => entry.id === user.id),
            ),
        );
        const voter = availableVoters[0];

        if (!voter) {
            return false;
        }

        const choiceValue = this.chooseVoteChoice(room, activeProposal, voter);
        this.voteOnProposal(room.room.id, activeProposal.id, voter, choiceValue);

        if (Math.random() < 0.6) {
            const commentator = choice(
                room.room.active_chatters.length > 0 ? room.room.active_chatters : room.room.users,
            );
            const commentary =
                choiceValue === "change"
                    ? "That one probably deserves the stage."
                    : "I think keeping the current board is still cleaner for the room.";

            this.pushStreamItem(room, {
                id: `${room.room.id}-vote-chat-${Date.now()}-${commentator.id}`,
                room_id: room.room.id,
                type: "chat",
                created_at: Date.now(),
                author: commentator,
                text: commentary,
                game_id: activeProposal.proposed_game.game_id,
            });
        }

        return true;
    }

    private simulateActivity = (): void => {
        const room = this.pickWeightedRoom();
        let changed = false;

        if (Math.random() < 0.4) {
            this.refreshActiveChatters(room);
        }

        if (this.simulateJoinOrPart(room)) {
            changed = true;
        }

        const activeProposal = room.proposals.find(
            (proposal) => proposal.status === "active" && proposal.vote_state,
        );

        if (activeProposal && Math.random() < (room.room.id === "tournament-pick" ? 0.8 : 0.45)) {
            changed = this.simulateProposalVote(room) || changed;
        } else {
            if (Math.random() < 0.5) {
                changed = this.simulateChat(room) || changed;
            }
        }

        if (room.room.id === "top-19x19" && Math.random() < 0.18) {
            changed = this.simulateVariationPost(room) || changed;
        }

        if (Math.random() < 0.375) {
            const secondRoom = this.pickWeightedRoom();
            changed = this.simulateChat(secondRoom) || changed;
        }

        if (changed) {
            this.emit("changed");
        }
    };
}
