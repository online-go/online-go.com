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

/* cspell: disable */

import * as React from "react";
import { MessageId, MessageObject } from "@/lib/messages";
import { GobanMoveErrorMessageObject } from "goban";
import { _ } from "@/lib/translate";

export interface MessageProps {
    message?: MessageObject;
    message_id?: MessageId;
}

export function format_message(props: MessageProps): string {
    let message_id: MessageId;
    if (props.message) {
        const message = props.message;
        message_id = message.message_id;
    } else if (props.message_id) {
        message_id = props.message_id;
    } else {
        throw new Error("Missing message or message_id");
    }

    switch (message_id) {
        case "user_is_banned":
            return _(
                "Your account has been suspended. You can use the appeal system to request re-activation.",
            );

        case "username_invalid":
            return _("Sorry that username is not allowed, please use normal letters");

        case "username_offensive":
        case "gamename_offensive":
        case "groupname_offensive":
        case "tournamentname_offensive":
        case "puzzlename_offensive":
        case "puzzlecollectionname_offensive":
            return _(
                "Sorry that name might be offensive to some players, please pick a different one",
            );

        case "username_reserved":
        case "username_unavailable":
            return _("Sorry that name is not available, please pick a different one");
        //return _("Sorry that name has been reserved, please pick a different one");

        case "ai_review_must_be_site_supporter":
            return _("To begin an AI review, you must be a site supporter.");

        case "ai_review_must_be_player":
            return _("To begin an AI review, you must be a player in the game.");

        case "ai_review_queue_full":
            return _(
                "Please wait until your current reviews are completed before requesting more.",
            );

        case "stone_already_placed_here":
        case "illegal_self_capture":
        case "illegal_ko_move":
        case "illegal_board_repetition":
            {
                const m: GobanMoveErrorMessageObject = props.message as GobanMoveErrorMessageObject;
                const coords = m?.coords || "ERR";
                const move_number = m?.move_number || -1;
                const suffix = ": #" + move_number.toString() + " @" + coords;
                switch (message_id) {
                    case "stone_already_placed_here":
                        return _("A stone has already been placed here") + suffix;
                    case "illegal_self_capture":
                        return _("Illegal self capture move");
                    case "illegal_ko_move":
                        return _("Illegal Ko Move") + suffix;
                    case "illegal_board_repetition":
                        return _("Illegal board repetition") + suffix;
                }
            }
            break;

        case "komi_invalid":
            return _("Komi setting is invalid");

        // break omitted
        case "test":
            return "This is a test";
    }

    return message_id;
}

export function Errcode(props: MessageProps): React.ReactElement {
    return <div className="Errcode">{format_message(props)}</div>;
}
