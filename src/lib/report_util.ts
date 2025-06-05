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

import { MODERATOR_POWERS } from "@/lib/moderation";
import { ReportType } from "@/components/Report";

import type { ServerToClient } from "@/../submodules/goban/src/engine/protocol/ServerToClient";

export type ReportNotification = ServerToClient["incident-report"] extends (data: infer T) => void
    ? T
    : never;

type CommunityModeratorReportTypes = Partial<Record<ReportType, string>>;

export const COMMUNITY_MODERATION_REPORT_TYPES: CommunityModeratorReportTypes = {
    stalling: "stalling",
    score_cheating: "score cheating",
    escaping: "escaping",
    // AI is not included here because it's a special case
};

export function community_mod_has_power(
    moderator_powers: number,
    report_type: ReportType,
): boolean {
    const has_handle_score_cheat = (moderator_powers & MODERATOR_POWERS.HANDLE_SCORE_CHEAT) > 0;
    const has_handle_escaping = (moderator_powers & MODERATOR_POWERS.HANDLE_ESCAPING) > 0;
    const has_handle_stalling = (moderator_powers & MODERATOR_POWERS.HANDLE_STALLING) > 0;
    const has_assess_ai_play = (moderator_powers & MODERATOR_POWERS.ASSESS_AI_PLAY) > 0;
    const has_ai_detector = (moderator_powers & MODERATOR_POWERS.AI_DETECTOR) > 0;

    return (
        (report_type === "score_cheating" && has_handle_score_cheat) ||
        (report_type === "escaping" && has_handle_escaping) ||
        (report_type === "stalling" && has_handle_stalling) ||
        (report_type === "assess_ai_play" && has_assess_ai_play) ||
        (report_type === "ai_use" && has_ai_detector)
    );
}

export function community_mod_can_handle(
    user: rest_api.UserConfig,
    report: ReportNotification,
): boolean {
    // Community moderators only get to see reports that they have the power for and
    // that they have not yet voted on... or if it's escalated, they must have suspend power
    // AI report are different - CMs handle them pre-escalation, full moderators after escalation!

    if (!user.moderator_powers) {
        return false;
    }

    const they_already_voted = report.voters?.some((vote) => vote.voter_id === user.id);
    const they_can_vote_to_suspend = user.moderator_powers & MODERATOR_POWERS.SUSPEND;
    const its_an_ai_report =
        report.report_type === "ai_use" || report.report_type === "assess_ai_play";
    if (
        community_mod_has_power(user.moderator_powers, report.report_type as ReportType) &&
        (!they_already_voted || (!its_an_ai_report && report.escalated && they_can_vote_to_suspend))
    ) {
        return true;
    }
    return false;
}
