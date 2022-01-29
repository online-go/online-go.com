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

declare namespace socket_api {
    namespace seekgraph_global {
        /**
         * One element from `seekgraph/global`
         *
         * This is a work in progress. Trust these values at your own risk.
         * */

        export interface Challenge {
            challenge_id: number;
            user_id: number;
            username: string;
            rank: number;
            pro: number;
            min_rank: 19;
            max_rank: 27;
            game_id: 40220391;
            name: string;
            ranked: boolean;
            handicap: number;
            komi?: number;
            rules: import("../lib/types").RuleSet;
            width: number;
            height: number;
            challenger_color: "black" | "white" | "automatic";
            disable_analysis: true;
            time_control: import("../components/TimeControl").TimeControlTypes.TimeControlSystem;
            time_control_parameters: import("../components/TimeControl").TimeControl;
            time_per_move: number;
            rengo: boolean;
            rengo_casual_mode: boolean;
            rengo_nominees: number[]; // array of player ids
            rengo_black_team: number[]; // array of player ids
            rengo_white_team: number[]; // array of player ids
            rengo_participants: number[]; // array of player ids

            // All this stuff seems to get added *after* we get a challenge from the api
            // but I don't have a good idea where to put it for now... (benjito)

            // ... let's find where the payload goes in and out API and type that object with this "Challenge"
            //  then make the internal state of ChallengeModal (etc) have these things, an extended type. GaJ:

            system_message_id?: any; // Don't know what this is, but it's accessed in SeekGraph
            ranked_text?: string;
            handicap_text?: string | number;
            removed?: boolean;
            ineligible_reason?: string;
            user_challenge?: boolean;
            eligible?: boolean;
        }
    }
}
