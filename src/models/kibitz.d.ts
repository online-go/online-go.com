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

export type KibitzRoomKind = "preset" | "user" | "broadcast";

export type KibitzMode = "live" | "demo";

export type KibitzStreamItemSource = "room-chat" | "game-chat" | "room-stream";

export type KibitzProposalStatus = "queued" | "active" | "accepted" | "rejected" | "expired";
export type KibitzVariationPenMarks = Array<{
    color: string;
    points: number[];
}>;

export type KibitzStreamItemType =
    | "chat"
    | "system"
    | "proposal_started"
    | "proposal_result"
    | "variation_posted"
    | "moderation";

export interface KibitzRoomUser {
    id: number;
    username: string;
    ranking: number;
    professional: boolean;
    ui_class: string;
    country?: string;
    icon?: string;
}

export interface KibitzWatchedGame {
    game_id: number;
    board_size: `${number}x${number}`;
    title: string;
    black: KibitzRoomUser;
    white: KibitzRoomUser;
    tournament_name?: string;
    move_number?: number;
    live?: boolean;
}

export interface KibitzRoomSummary {
    id: string;
    channel: string;
    title: string;
    kind: KibitzRoomKind;
    viewer_count: number;
    description?: string;
    current_game?: KibitzWatchedGame;
    pinned?: boolean;
    proposals_enabled?: boolean;
}

export interface KibitzRoom extends KibitzRoomSummary {
    users: KibitzRoomUser[];
    active_chatters: KibitzRoomUser[];
    friends_in_room: KibitzRoomUser[];
    active_variation_ids: string[];
}

export interface KibitzProposalVoteState {
    change_votes: KibitzRoomUser[];
    keep_votes: KibitzRoomUser[];
    abstain_count: number;
    ends_at: number;
}

export interface KibitzProposal {
    id: string;
    room_id: string;
    proposer: KibitzRoomUser;
    proposed_game: KibitzWatchedGame;
    status: KibitzProposalStatus;
    created_at: number;
    cooldown_seconds?: number;
    vote_state?: KibitzProposalVoteState;
}

export interface KibitzVariationSummary {
    id: string;
    room_id: string;
    game_id: number;
    creator: KibitzRoomUser;
    created_at: number;
    viewer_count: number;
    current_viewers: KibitzRoomUser[];
    move_count?: number;
    title?: string;
    analysis_from?: number;
    analysis_moves?: string;
    analysis_marks?: Record<string, string>;
    analysis_pen_marks?: KibitzVariationPenMarks;
}

export interface KibitzStreamItem {
    id: string;
    room_id: string;
    type: KibitzStreamItemType;
    created_at: number;
    author?: KibitzRoomUser;
    text: string;
    variation_id?: string;
    game_id?: number;
    proposal_id?: string;
    source?: KibitzStreamItemSource;
}

export interface KibitzSecondaryPaneState {
    collapsed: boolean;
    size?: "small" | "equal";
    preview_game_id?: number;
    variation_id?: string;
    variation_source_game_id?: number;
    variation_source_game?: KibitzWatchedGame;
}

export interface KibitzDebugCandidate {
    id: number;
    title: string;
    width?: number;
    height?: number;
    move_count?: number;
}

export interface KibitzDebugRoomHydration {
    room_id: string;
    requested_size?: `${number}x${number}`;
    query_count: number;
    query_source?: "filtered" | "broad-fallback" | "active-games-fallback";
    picked_game_id?: number;
    picked_via?: "query" | "details";
    error?: string;
    candidates: KibitzDebugCandidate[];
}

export interface KibitzDebugState {
    socket_connected: boolean;
    status: "idle" | "loading" | "ready" | "error";
    last_hydration_started_at?: number;
    last_hydration_finished_at?: number;
    error?: string;
    rooms: KibitzDebugRoomHydration[];
}
