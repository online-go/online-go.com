/*
 * Copyright (C)   Online-Go.com
 * Copyright (C)   Ben Jones
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

declare namespace rest_api {
    namespace warnings {
        // Note that "warnings" are actually "any message we present in a dialog and track acknowledgement of".
        // These must match voting handling in django moderation.py
        // Don't forget to also update ACTION_PROMPTS as needed: new messages usually mean new actions.
        type WarningMessageId =
            | "warn_beginner_escaper"
            | "warn_escaper"
            | "ack_educated_beginner_escaper"
            | "ack_educated_beginner_escaper_and_annul"
            | "ack_warned_escaper"
            | "ack_warned_escaper_and_annul"
            | "no_escaping_evident"
            | "not_escaping_cancel"
            | "warn_beginner_staller"
            | "warn_staller"
            | "ack_educated_beginner_staller"
            | "ack_educated_beginner_staller_and_annul"
            | "ack_warned_staller"
            | "ack_warned_staller_and_annul"
            | "no_stalling_evident"
            | "warn_beginner_score_cheat"
            | "warn_score_cheat"
            | "ack_educated_beginner_score_cheat"
            | "ack_educated_beginner_score_cheat_and_annul"
            | "ack_warned_score_cheat"
            | "ack_warned_score_cheat_and_annul"
            | "no_score_cheating_evident"
            | "no_ai_use_evident"
            | "annul_no_warning"
            | "ack_annul_no_warning"
            | "final_warn_escaper"
            | "final_warn_escaper_and_annul"
            | "final_warn_staller"
            | "final_warn_staller_and_annul"
            | "final_warn_score_cheat"
            | "final_warn_score_cheat_and_annul"
            | "ack_final_warn_escaper"
            | "ack_final_warn_escaper_and_annul"
            | "ack_final_warn_staller"
            | "ack_final_warn_staller_and_annul"
            | "ack_final_warn_score_cheat"
            | "ack_final_warn_score_cheat_and_annul"
            | "ack_suspended"
            | "ack_suspended_and_annul"
            | "warn_duplicate_report"
            | "report_type_changed"
            | "bot_owner_notified";

        type Severity = "warning" | "acknowledgement" | "info";

        type InterpolatedMessage = (data: any) => string;

        type WarningMessages = {
            [K in WarningMessageId]: InterpolatedMessage;
        };

        interface Warning {
            id: number;
            created: string;
            acknowledged: string | null; // date
            player_id: number;
            moderator: number | null;
            text: string | null;
            message_id: WarningMessageId | null;
            severity: Severity;
            interpolation_data: string | null;
        }
    }
}
