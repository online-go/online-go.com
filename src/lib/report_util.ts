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

import { ReportedConversation } from "Report";
import { PlayerCacheEntry } from "player_cache";
import { MODERATOR_POWERS } from "moderation";

interface Vote {
    voter_id: number;
    action: string;
}

export interface Report {
    // TBD put this into /models, in a suitable namespace?
    // TBD: relationship between this and SeverToClient['incident-report']
    id: number;
    created: string;
    updated: string;
    state: string;
    escalated: boolean;
    source: string;
    report_type: string;
    reporting_user: any;
    reported_user: any;
    reported_game: number;
    reported_game_move?: number;
    reported_review: number;
    reported_conversation: ReportedConversation;
    url: string;
    moderator: PlayerCacheEntry;
    cleared_by_user: boolean;
    was_helpful: boolean;
    reporter_note: string;
    reporter_note_translation: {
        source_language: string;
        target_language: string;
        source_text: string;
        target_text: string;
    };
    moderator_note: string;
    system_note: string;
    detected_ai_games: Array<Object>;

    automod_to_moderator?: string; // Suggestions from "automod"
    automod_to_reporter?: string;
    automod_to_reported?: string;

    available_actions: Array<string>; // community moderator actions
    voters: Vote[]; // votes from community moderators on this report
    community_mod_note: string;

    unclaim: () => void;
    claim: () => void;
    steal: () => void;
    bad_report: () => void;
    good_report: () => void;
    cancel: () => void;
    set_note: () => void;
}

export function community_mod_can_handle(user: rest_api.UserConfig, report: Report): boolean {
    // Community moderators only get to see reports that they have the power for and
    // that they have not yet voted on, and are not escalated
    const has_handle_score_cheat =
        (user.moderator_powers & MODERATOR_POWERS.HANDLE_SCORE_CHEAT) > 0;
    const has_handle_escaping = (user.moderator_powers & MODERATOR_POWERS.HANDLE_ESCAPING) > 0;
    const has_handle_stalling = (user.moderator_powers & MODERATOR_POWERS.HANDLE_STALLING) > 0;

    const report_type = report.report_type;

    if (
        !user.is_moderator &&
        user.moderator_powers &&
        ((!(report_type === "score_cheating" && has_handle_score_cheat) &&
            !(report_type === "escaping" && has_handle_escaping) &&
            !(report_type === "stalling" && has_handle_stalling)) ||
            report.voters?.some((vote) => vote.voter_id === user.id) ||
            report.escalated)
    ) {
        return false;
    }

    return true;
}
