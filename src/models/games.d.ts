/*
 * Copyright (C) 2022  Ben Jones
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
    interface Game {
        related: {
            detail: string; // route to full game info
        };
        players: {
            black: import("../lib/player_cache").PlayerCacheEntry;
            white: import("../lib/player_cache").PlayerCacheEntry;
        };
        id: number;
        name: string;
        creator: number;
        mode: "game";
        source: "play";
        black: number;
        white: number;
        width: number;
        height: number;
        rules: import("../lib/types").RuleSet;
        ranked: boolean;
        handicap: number;
        komi: string; // floating point number
        time_control: import("../components/TimeControl").TimeControlTypes.TimeControlSystem;

        // these don't appear to be populated with userful data
        black_player_rank: number;
        black_player_rating: string; // floating point number
        white_player_rank: number;
        white_player_rating: string; // floating point number

        time_per_move: number;
        time_control_parameters: string; // TimeControl
        disable_analysis: boolean;
        tournament: number | null;
        tournament_round: number;
        ladder: number;
        pause_on_weekends: boolean;
        outcome: `${number} points` | "Cancellation" | "Resignation";
        black_lost: boolean;
        white_lost: boolean;
        annulled: boolean;
        started: string; // ISODate
        ended: string; // ISODate
        sgf_filename: string | null;
        historical_ratings: {
            black: import("../lib/player_cache").PlayerCacheEntry;
            white: import("../lib/player_cache").PlayerCacheEntry;
        };
        rengo: boolean;
    }
}
