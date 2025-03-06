/*
 * Copyright (C)   Online-Go.com
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
    import { Vote } from "@/lib/report_util";
    import { ReportedConversation } from "@/components/Report";

    namespace moderation {
        //  `/moderation/annul` endpoint
        interface AnnulList {
            games: Array<number>; // game ids.  Do we have a type for them?
            annul: boolean;
            moderation_note: string;
        }

        interface AnnulResult {
            done: Array<number>;
            failed: Array<number>;
        }

        //  `/moderation?player_id=123` endpoint
        export interface ModLogEntry {
            timestamp: string;
            actor?: {
                id: number;
            };
            action: string;
            incident_report?: {
                id: number;
                cleared_by_user?: boolean;
                url?: string;
                reporter_note?: string;
                moderator_note?: string;
                system_note?: string;
                moderator?: any; // Player type
            };
            game?: {
                id: number;
            };
            note?: string;
        }

        export interface ReportDetail {
            // It's the full information we get from Django when we ask for a report by id
            id: number;
            created: string;
            updated: string;
            state: string;
            escalated: boolean;
            escalated_at: string;
            retyped: boolean;
            source: string;
            report_type: ReportType;
            reporting_user: PlayerCacheEntry;
            reported_user: PlayerCacheEntry;
            reported_is_banned?: boolean; // only full mods and empowered CMs get this
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
            detected_ai_games: Array<object>;

            automod_to_moderator?: string; // Suggestions from "automod"
            automod_to_reporter?: string;
            automod_to_reported?: string;

            available_actions: Array<string>; // community moderator actions
            vote_counts: { [action: string]: number };
            voters: Vote[]; // votes from community moderators on this report
            escalation_note: string;
            dissenter_note: string;
        }
    }
}
