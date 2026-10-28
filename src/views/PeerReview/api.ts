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

import { get, patch, post, put } from "@/lib/requests";
import type {
    GameRequestStatus,
    PeerReviewerProfile,
    PeerReviewRequest,
    QueueSort,
    RequestAction,
    ReviewerQueue,
    ReviewFeedbackStatus,
} from "./types";

export function fetchGameRequestStatus(gameId: number): Promise<GameRequestStatus> {
    return get(`games/${gameId}/peer_review_request`);
}

export function createRequest(gameId: number): Promise<PeerReviewRequest> {
    return post(`games/${gameId}/peer_review_request`, {});
}

export function requestAction(id: number, action: RequestAction): Promise<PeerReviewRequest> {
    return post(`peer_review/requests/${id}/${action}`, {});
}

export function fetchQueue(sort: QueueSort): Promise<ReviewerQueue> {
    return get("peer_review/queue", { sort });
}

export function fetchMyProfile(): Promise<PeerReviewerProfile> {
    return get("peer_review/reviewers/me");
}

export function joinPool(): Promise<PeerReviewerProfile> {
    return post("peer_review/reviewers/me", {});
}

export function patchProfile(
    changes: Partial<Pick<PeerReviewerProfile, "min_rank" | "max_rank" | "active">>,
): Promise<PeerReviewerProfile> {
    return patch("peer_review/reviewers/me", changes);
}

export function fetchReviewFeedbackStatus(reviewId: number): Promise<ReviewFeedbackStatus> {
    return get(`peer_review/reviews/${reviewId}`);
}

export function markReviewSeen(requestId: number): Promise<ReviewFeedbackStatus> {
    return post(`peer_review/requests/${requestId}/seen`, {});
}

export function saveFeedback(
    requestId: number,
    score: number,
    text: string,
): Promise<ReviewFeedbackStatus> {
    return put(`peer_review/requests/${requestId}/feedback`, { score, text });
}

export function markFeedbackDelivered(requestId: number): Promise<ReviewFeedbackStatus> {
    return post(`peer_review/requests/${requestId}/delivered`, {});
}
