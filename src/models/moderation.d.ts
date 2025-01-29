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
    }
}
