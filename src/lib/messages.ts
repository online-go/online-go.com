/*
 * Copyright (C) 2012-2020  Online-Go.com
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

import { GobanErrorMessageId, GobanErrorMessageObject } from "goban";

export type MessageIdAPI =
    | "username_invalid"
    | "username_offensive"
    | "gamename_offensive"
    | "groupname_offensive"
    | "tournamentname_offensive"
    | "puzzlename_offensive"
    | "puzzlecollectionname_offensive"
    | "username_reserved"
    | "ai_review_must_be_site_supporter"
    | "ai_review_must_be_player"
    | "ai_review_queue_full"
    | "test";

export interface MessageObjectsAPI {
    message_id: MessageIdAPI;
}

export type MessageId = MessageIdAPI | GobanErrorMessageId;
export type MessageObject = MessageObjectsAPI | GobanErrorMessageObject;
