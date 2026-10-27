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
import "./Errcode.css";

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
            return _("Sorry that name is not allowed, please pick a different one");

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

        case "ai_review_already_requested":
            return _("You have already requested an AI review for this game recently.");

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

            return _("Komi setting is invalid");

        // break omitted
        case "test":
            return "This is a test";
        case "peer_review_disabled":
            return _("Peer review is not available right now.");
        case "peer_review_not_player":
            return _("Only a player in the game can request a peer review of it.");
        case "peer_review_game_not_finished":
            return _("You can request a peer review once the game has finished.");
        case "peer_review_board_size":
            return _("Peer review is available for 9x9, 13x13 and 19x19 games.");
        case "peer_review_9x9_rank":
            return _(
                "Peer review of 9x9 games is for stronger players; try a 13x13 or 19x19 game.",
            );
        case "peer_review_bot_game":
            return _("Games against bots cannot be submitted for peer review.");
        case "peer_review_private_game":
            return _("Private games cannot be submitted for peer review.");
        case "peer_review_already_requested_game":
            return _("You have already requested a peer review of this game.");
        case "peer_review_request_open":
            return _(
                "You already have a peer review request waiting. Withdraw it or wait for it to finish.",
            );
        case "peer_review_cooldown":
            return _("You can make one peer review request per week.");
        case "peer_review_not_reviewer":
            return _("Join the peer reviewer pool first.");
        case "peer_review_min_rank":
            return _("Your rank is below the peer reviewer cutoff.");
        case "peer_review_provisional":
            return _("Your rank needs to settle before you can become a peer reviewer.");
        case "peer_review_rank_not_allowed":
            return _("Your rank does not allow you to review this request.");
        case "peer_review_state_conflict":
            return _("This request has changed. Please refresh and try again.");
        case "not_found":
            return _("That request no longer exists.");
        case "forbidden":
            return _("You are not allowed to do that.");
        case "review_creation_failed":
            return _("The review could not be started. Please try again.");
        case "invalid_range":
            return _("The weakest rank must not be stronger than the strongest rank.");
    }

    return message_id;
}

export function Errcode(props: MessageProps): React.ReactElement {
    return <div className="Errcode">{format_message(props)}</div>;
}
