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

export type PeerReviewState = "open" | "claimed" | "submitted" | "withdrawn";

export interface PeerReviewPlayer {
    id: number;
    username: string;
    ranking: number;
    professional: boolean;
    ui_class: string;
    country?: string;
    icon?: string;
}

export interface PeerReviewGame {
    id: number;
    name: string;
    width: number;
    height: number;
}

export interface PeerReviewRequest {
    id: number;
    game: PeerReviewGame;
    requester: PeerReviewPlayer;
    requester_rank: number;
    requester_provisional: boolean;
    state: PeerReviewState;
    reviewer: PeerReviewPlayer | null;
    claimed_at: string | null;
    /** When the reviewer is warned; the claim lapses at release_deadline. */
    claim_deadline: string | null;
    claim_warned_at: string | null;
    release_deadline: string | null;
    review_id: number | null;
    submitted_at: string | null;
    reviewer_rank_at_submit: number | null;
    created: string;
    reviewers_total?: number | null;
    reviewers_available?: number | null;
}

export interface PeerReviewerProfile {
    joined: string;
    active: boolean;
    last_active: string;
    min_rank: number;
    max_rank: number;
    allowed_min: number | null;
    allowed_max: number | null;
}

export interface PeerReviewConfig {
    /** The launch switch: true means live for everyone, false means dark. */
    enabled: boolean;
    /** Whether the calling user may see and use the feature: live, or dark and a moderator. */
    available: boolean;
    min_reviewer_rank: number;
}

export interface GameRequestStatus {
    may_request: boolean;
    reason: string | null;
    cooldown_until: string | null;
    /** Weakest requester rank allowed to ask for a 9x9 review, for the refusal text. */
    min_rank_for_9x9: number;
    request: PeerReviewRequest | null;
}

export interface ReviewerQueue {
    profile: PeerReviewerProfile;
    open: PeerReviewRequest[];
    claimed: PeerReviewRequest[];
}

export type RequestAction = "withdraw" | "claim" | "release" | "submit";
export type QueueSort = "rank" | "wait";
