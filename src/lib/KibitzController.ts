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
import type {
    KibitzProposal,
    KibitzRoom,
    KibitzRoomSummary,
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
}

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

function createSeededRooms(): KibitzRoomSummary[] {
    return [
        {
            id: "top-19x19",
            channel: "kibitz-top-19x19",
            title: "Top 19x19",
            kind: "preset",
            viewer_count: 18,
            proposals_enabled: true,
            current_game: {
                game_id: 1001,
                board_size: "19x19",
                title: "Alecto vs WhiteStar",
                black: createUser(101, "Alecto", 34),
                white: createUser(102, "WhiteStar", 31),
                tournament_name: "Spring Open",
                move_number: 143,
                live: true,
            },
        },
        {
            id: "tournament-pick",
            channel: "kibitz-tournament-pick",
            title: "Tournament Pick",
            kind: "preset",
            viewer_count: 11,
            proposals_enabled: true,
            current_game: {
                game_id: 1002,
                board_size: "19x19",
                title: "Quarterfinal Board 2",
                black: createUser(103, "TenukiTime", 28),
                white: createUser(104, "KoThreat", 29),
                tournament_name: "Weekend Cup",
                move_number: 88,
                live: true,
            },
        },
        {
            id: "top-9x9",
            channel: "kibitz-top-9x9",
            title: "Top 9x9",
            kind: "preset",
            viewer_count: 7,
            proposals_enabled: true,
            current_game: {
                game_id: 1003,
                board_size: "9x9",
                title: "Speed board",
                black: createUser(105, "FusekiFox", 18),
                white: createUser(106, "CenterLine", 17),
                move_number: 42,
                live: true,
            },
        },
    ];
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
    private _rooms: KibitzRoomSummary[] = [];
    private _active_room: KibitzRoom | null = null;
    private _stream: KibitzStreamItem[] = [];
    private _proposals: KibitzProposal[] = [];
    private _variations: KibitzVariationSummary[] = [];
    private _secondary_pane: KibitzSecondaryPaneState = { collapsed: false };

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

    public get default_room_id(): string | null {
        return this._rooms[0]?.id ?? null;
    }

    constructor() {
        super();

        const rooms = createSeededRooms();
        this.setRooms(rooms);
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

    public previewGame(gameId: number): void {
        this.setSecondaryPane({
            ...this._secondary_pane,
            collapsed: false,
            preview_game_id: gameId,
            variation_id: undefined,
        });
    }

    public clearPreviewGame(): void {
        this.setSecondaryPane({
            ...this._secondary_pane,
            preview_game_id: undefined,
        });
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
                text: `${proposer.username} proposed switching to ${proposedGame.title}.`,
                game_id: proposedGame.game_id,
                proposal_id: proposal.id,
            },
        ]);
    }

    public voteOnProposal(proposalId: string, choice: "change" | "keep"): void {
        const voter = createCurrentUser();
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
}
