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

        // This is all the actions that we are prepared to display to a community moderator
        // as voting options (we have translations for these)
        export type CommunityModerationAction =
            | "annul_escaped"
            | "warn_escaper"
            | "call_escaped_game_for_black"
            | "call_escaped_game_for_white"
            | "no_escaping"
            | "not_escaping_cancel"
            | "annul_stalled"
            | "warn_staller"
            | "call_stalled_game_for_black"
            | "call_stalled_game_for_white"
            | "no_stalling"
            | "annul_score_cheat"
            | "warn_score_cheat"
            | "no_score_cheat"
            | "call_score_cheat_for_black"
            | "call_score_cheat_for_white"
            | "annul_no_warning"
            | "final_warning_escaping"
            | "final_warning_stalling"
            | "final_warning_score_cheating"
            | "final_warning_escaping_and_annul"
            | "final_warning_stalling_and_annul"
            | "final_warning_score_cheating_and_annul"
            | "warn_duplicate_reporter"
            | "suspend_user"
            | "suspend_user_and_annul"
            | "escalate"
            | "definitely_ai"
            | "ai_like"
            | "human_like"
            | "assess_ai_play"
            | "no_ai_use_evident"
            | "no_ai_use_bad_report";

        // Regrettably, there's another definition of Vote in goban ServerToClient.ts
        // I wonder how we unify the rest_api and goban interfaces...
        export interface CommunityModeratorVote {
            voter_id: number;
            action: CommunityModerationAction;
            updated: string;
        }

        interface VoterNote {
            voter_id: number;
            voter_note: string;
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
            reported_game_white?: number;
            reported_game_black?: number;
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

            available_actions: Array<CommunityModerationAction>;
            vote_counts: { [action: string]: number };
            voters: CommunityModeratorVote[];
            escalation_note: string;
            dissenter_note: string;
            voter_notes: VoterNote[];
        }
    }
}
