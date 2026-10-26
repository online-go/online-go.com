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

/* cspell:disable */

import { GobanErrorMessageId, GobanErrorMessageObject } from "goban";

export type MessageIdAPI =
    | "user_is_banned"
    | "username_invalid"
    | "username_offensive"
    | "username_unavailable"
    | "gamename_offensive"
    | "groupname_offensive"
    | "tournamentname_offensive"
    | "puzzlename_offensive"
    | "puzzlecollectionname_offensive"
    | "username_reserved"
    | "ai_review_must_be_site_supporter"
    | "ai_review_must_be_player"
    | "ai_review_queue_full"
    | "ai_review_already_requested"
    | "peer_review_disabled"
    | "peer_review_not_player"
    | "peer_review_game_not_finished"
    | "peer_review_board_size"
    | "peer_review_bot_game"
    | "peer_review_private_game"
    | "peer_review_already_requested_game"
    | "peer_review_request_open"
    | "peer_review_cooldown"
    | "peer_review_not_reviewer"
    | "peer_review_min_rank"
    | "peer_review_provisional"
    | "peer_review_rank_not_allowed"
    | "peer_review_state_conflict"
    | "not_found"
    | "forbidden"
    | "review_creation_failed"
    | "invalid_range"
    | "komi_invalid"
    | "test";

export interface MessageObjectsAPI {
    message_id: MessageIdAPI;
}

export type MessageId = MessageIdAPI | GobanErrorMessageId;
export type MessageObject = MessageObjectsAPI | GobanErrorMessageObject;
