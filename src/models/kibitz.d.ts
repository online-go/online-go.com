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

import type { ChatSystemLink, ChatViewingPosition } from "@/lib/chat_manager";

export type KibitzRoomKind = "preset" | "user" | "broadcast";

export type KibitzMode = "live" | "demo";

export type KibitzStreamItemSource = "room-chat" | "game-chat" | "room-stream";

export type KibitzProposalStatus = "queued" | "active" | "accepted" | "rejected" | "expired";
export type KibitzVariationPenMarks = Array<{
    color: string;
    points: number[];
}>;
export type KibitzVariationLineTree = import("goban").MoveTreeJson;

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

/** The board a room watches: a game, or a review (a demo board or a review
 *  of a game). A review board has `review_id` and no `game_id`; compare
 *  boards with `sameBoard` from `views/Kibitz/kibitzBoardRef`. */
export interface KibitzWatchedGame {
    game_id?: number;
    review_id?: number;
    /** For a review of a game: the game it reviews. Not the board's id. */
    reviewed_game_id?: number | null;
    /** For a review: the user whose moves are the review's position. */
    review_controller?: KibitzRoomUser;
    /** For a review: its recorded result, if any. */
    outcome?: string | null;
    board_size: `${number}x${number}`;
    title: string;
    black: KibitzRoomUser;
    white: KibitzRoomUser;
    tournament_name?: string;
    move_number?: number;
    /** False once the game has ended, and for a review. Not the game's speed:
     *  an unfinished correspondence game is live. */
    live?: boolean;
    analysis_disabled?: boolean;
    rengo_black_team?: number[];
    rengo_white_team?: number[];
}

export interface KibitzPresetBlock {
    preset_key: string;
    selection_status: "finding_game" | "watching" | "change_pending";
    pending_game_id: number | null;
    change_effective_at: string | null;
}

export interface KibitzRoomSummary {
    id: string;
    channel: string;
    title: string;
    kind: KibitzRoomKind;
    viewer_count: number;
    description?: string;
    creator_id?: number | null;
    current_game_id?: number | null;
    current_review_id?: number | null;
    /** The watched board, a game or a review. */
    current_game?: KibitzWatchedGame;
    mode?: KibitzMode;
    pinned?: boolean;
    proposals_enabled?: boolean;
    preset?: KibitzPresetBlock;
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
    source?: "room" | "game-chat";
    /** The board the variation was made on: exactly one of these is set. */
    game_id?: number;
    review_id?: number;
    client_pending_id?: string;
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
    analysis_line_tree?: KibitzVariationLineTree;
    /** A review variation's anchor: the move path from the root to the node
     *  it branches from. A review's tree branches and changes, so the move
     *  number in `analysis_from` alone cannot find that node. */
    analysis_from_path?: string;
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
    move_number?: number;
    viewing_position?: ChatViewingPosition;
    proposal_id?: string;
    source?: KibitzStreamItemSource;
    /** Spans of a system line's text to render as same-site links. */
    links?: ChatSystemLink[];
}

export interface KibitzSecondaryPaneState {
    collapsed: boolean;
    chat_variation?: KibitzVariationSummary;
    variation_id?: string;
    /** The board a draft is made on. Set exactly while drafting. */
    variation_source_board?: import("@/views/Kibitz/kibitzBoardRef").KibitzBoardKey;
    variation_source_game?: KibitzWatchedGame;
    variation_source_move_tree?: KibitzVariationLineTree;
    variation_source_move_tree_id?: number;
    variation_source_move_path?: string;
    variation_draft_base_id?: string;
    /** Where in the base variation the draft starts: the encoded path the
     *  reader was looking at when they branched, rather than the end of the
     *  line. Absent for a draft that starts at the variation's last move. */
    variation_draft_base_path?: string;
    /** Changes on every new draft so a draft started from the same
     *  position as the previous one still rebuilds the board. */
    variation_draft_nonce?: number;
}
