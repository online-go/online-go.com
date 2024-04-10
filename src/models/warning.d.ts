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
        // These must match voting handling in django moderation.py
        type WarningMessageId =
            | "warn_beginner_score_cheat"
            | "warn_score_cheat"
            | "ack_educated_beginner_score_cheat"
            | "ack_educated_beginner_score_cheat_and_annul"
            | "ack_warned_score_cheat"
            | "ack_warned_score_cheat_and_annul"
            | "no_score_cheating_evident"
            | "warn_beginner_escaper"
            | "warn_escaper"
            | "ack_educated_beginner_escaper"
            | "ack_educated_beginner_escaper_and_annul"
            | "ack_warned_escaper"
            | "ack_warned_escaper_and_annul"
            | "no_escaping_evident"
            | "warn_beginner_staller"
            | "warn_staller"
            | "ack_educated_beginner_staller"
            | "ack_educated_beginner_staller_and_annul"
            | "ack_warned_staller"
            | "ack_warned_staller_and_annul"
            | "no_stalling_evident"
            | "report_type_changed";

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
