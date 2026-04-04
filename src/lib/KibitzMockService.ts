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

/* cspell: words cooldown moyo Niko Sabaki tenukis */

import { EventEmitter } from "eventemitter3";
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

function createRooms(): MockRoomState[] {
    const vera = createUser(5001, "VeraFuseki", 29);
    const jun = createUser(5002, "JunShape", 27);
    const ona = createUser(5003, "OnaSabaki", 24);
    const pax = createUser(5004, "PaxCut", 25);
    const rei = createUser(5005, "ReiProbe", 22);
    const mia = createUser(5006, "MiaClamp", 19);
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
    const tournamentProposalGame = createMockGame(
        910004,
        19,
        "Center reduction race",
        createUser(5007, "SoraInfluence", 26),
        createUser(5008, "MikTerritory", 25),
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

    const topRoomUsers = [
        vera,
        jun,
        createUser(5010, "LioThickness", 20),
        createUser(5011, "KaraAji", 17),
    ];
    const tournamentUsers = [
        ona,
        pax,
        createUser(5012, "NikoReview", 18),
        createUser(5013, "SaeTesuji", 21),
    ];
    const fastUsers = [
        rei,
        mia,
        createUser(5014, "TaoSnapback", 16),
        createUser(5015, "EliKo", 14),
    ];

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
                active_chatters: topRoomUsers.slice(0, 3),
                friends_in_room: topRoomUsers.slice(3),
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
                    viewer_count: 3,
                    current_viewers: topRoomUsers.slice(0, 3),
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
                active_chatters: tournamentUsers.slice(0, 2),
                friends_in_room: tournamentUsers.slice(2),
                active_variation_ids: [],
            },
            stream: [
                {
                    id: "tournament-pick-chat-1",
                    room_id: "tournament-pick",
                    type: "chat",
                    created_at: Date.now() - 140_000,
                    author: tournamentUsers[3],
                    text: "If white tenukis again, the lower side gets severe quickly.",
                    game_id: tournamentGame.game_id,
                },
                {
                    id: "tournament-pick-proposal-seeded",
                    room_id: "tournament-pick",
                    type: "proposal_started",
                    created_at: Date.now() - 100_000,
                    author: tournamentUsers[2],
                    text: `${tournamentUsers[2].username} proposed ${formatProposalSummary(tournamentProposalGame)}.`,
                    game_id: tournamentProposalGame.game_id,
                    proposal_id: "tournament-pick-proposal-1",
                },
            ],
            proposals: [
                {
                    id: "tournament-pick-proposal-1",
                    room_id: "tournament-pick",
                    proposer: tournamentUsers[2],
                    proposed_game: tournamentProposalGame,
                    status: "active",
                    created_at: Date.now() - 100_000,
                    cooldown_seconds: 30,
                    vote_state: {
                        change_votes: [tournamentUsers[3]],
                        keep_votes: [],
                        abstain_count: 0,
                        ends_at: Date.now() + 45_000,
                    },
                },
            ],
            variations: [],
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
                active_chatters: fastUsers.slice(0, 3),
                friends_in_room: [],
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
            ],
            proposals: [],
            variations: [],
        },
    ];
}

export class KibitzMockService extends EventEmitter<KibitzMockServiceEvents> {
    private rooms = new Map<string, MockRoomState>();
    private activityTimer: ReturnType<typeof setInterval> | null = null;

    constructor() {
        super();

        for (const room of createRooms()) {
            this.rooms.set(room.room.id, room);
        }

        this.activityTimer = setInterval(this.simulateActivity, 18_000);
    }

    public destroy(): void {
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

        room.stream.push({
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

        const activeProposalExists = room.proposals.some(
            (proposal) => proposal.status === "active",
        );
        const proposal: KibitzProposal = {
            id: `${roomId}-proposal-${Date.now()}`,
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

        room.proposals.push(proposal);
        room.stream.push({
            id: `${proposal.id}-started`,
            room_id: roomId,
            type: "proposal_started",
            created_at: Date.now(),
            author: proposer,
            text: `${proposer.username} proposed ${formatProposalSummary(proposedGame)}.`,
            game_id: proposedGame.game_id,
            proposal_id: proposal.id,
        });
        this.emit("changed");
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

        if (
            proposal.vote_state.change_votes.length < 2 &&
            proposal.vote_state.keep_votes.length < 2
        ) {
            this.emit("changed");
            return;
        }

        proposal.status =
            proposal.vote_state.change_votes.length >= proposal.vote_state.keep_votes.length
                ? "accepted"
                : "rejected";
        if (proposal.status === "accepted") {
            room.room.current_game = proposal.proposed_game;
            room.stream.push({
                id: `${proposal.id}-accepted`,
                room_id: roomId,
                type: "proposal_result",
                created_at: Date.now(),
                text: `Change board won. Switched to ${proposal.proposed_game.title}.`,
                game_id: proposal.proposed_game.game_id,
                proposal_id: proposal.id,
            });
        } else {
            room.stream.push({
                id: `${proposal.id}-rejected`,
                room_id: roomId,
                type: "proposal_result",
                created_at: Date.now(),
                text: "Keeping current board.",
                game_id: proposal.proposed_game.game_id,
                proposal_id: proposal.id,
            });
        }

        const nextQueued = room.proposals.find((entry) => entry.status === "queued");
        if (nextQueued) {
            nextQueued.status = "active";
        }

        this.emit("changed");
    }

    private simulateActivity = (): void => {
        const rooms = Array.from(this.rooms.values());
        if (rooms.length === 0) {
            return;
        }

        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const activeProposal = room.proposals.find(
            (proposal) => proposal.status === "active" && proposal.vote_state,
        );
        if (activeProposal && activeProposal.vote_state) {
            const availableVoters = room.room.users.filter(
                (user) =>
                    !activeProposal.vote_state?.change_votes.some(
                        (entry) => entry.id === user.id,
                    ) &&
                    !activeProposal.vote_state?.keep_votes.some((entry) => entry.id === user.id),
            );
            const voter = availableVoters[0];
            if (voter) {
                const choice = room.room.id === "tournament-pick" ? "change" : "keep";
                this.voteOnProposal(room.room.id, activeProposal.id, voter, choice);
                return;
            }
        }

        const speaker = room.room.active_chatters[Date.now() % room.room.active_chatters.length];
        const messages = [
            "That exchange looks lighter after the peep than it did two moves ago.",
            "The room is converging on the same shape judgment now.",
            "This is the kind of line that deserves a side variation, not a board switch.",
            "White probably wants outside influence more than immediate territory here.",
        ];
        room.stream.push({
            id: `${room.room.id}-sim-${Date.now()}`,
            room_id: room.room.id,
            type: "chat",
            created_at: Date.now(),
            author: speaker,
            text: messages[Math.floor(Math.random() * messages.length)],
            game_id: room.room.current_game?.game_id,
        });
        this.emit("changed");
    };
}
