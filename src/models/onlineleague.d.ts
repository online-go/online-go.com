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
    namespace online_league {
        // /api/vi/online_league/commence
        interface MatchStatus {
            id: number; // pk for OnlineLeagueChallenge
            name: string; // the match "name", also set as the game "name"
            league: string; // acronym/name
            player_key: string; // short uuid
            side: string; // black or white
            started: boolean;
            game: number; // pk
            black_ready: boolean;
            white_ready: boolean;
        }

        //  /api/v1/online_league/match
        //  /api/v1/online_league/matches
        interface MatchDetails {
            id: number; // pk for OnlineLeagueChallenge
            name: string; // the match "name", also set as the game "name"
            black_member_id: string; // short uuid
            black_invite: string; // URL
            white_member_id: string; // short uuid
            white_invite: string; // URL
            spectator_link: string; // URL
            league: string; // acronym/name
            game: number | null; // pk for Game
            started: boolean;
            finished: boolean;
        }
    }
}
