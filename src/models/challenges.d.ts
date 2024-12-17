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

type RatingsBySizeAndSpeed = rest_api.RatingsBySizeAndSpeed;

declare namespace socket_api {
    namespace seekgraph_global {
        /**
         * One element from `seekgraph/global`
         *
         * This is a work in progress. Trust these values at your own risk.
         */
        interface Challenge {
            challenge_id: number;
            user_id: number;
            username: string;
            rank: number;
            pro: 0 | 1;
            min_rank: number;
            max_rank: number;
            game_id: number;
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
            rengo_auto_start: number;
            rengo_nominees: number[]; // array of player ids
            rengo_black_team: number[]; // array of player ids
            rengo_white_team: number[]; // array of player ids
            rengo_participants: number[]; // array of player ids
            invite_only: boolean;
            uuid: string;
            created?: string | null; // ISO 8601 format datetime

            // All this stuff seems to get added *after* we get a challenge from the api
            // but I don't have a good idea where to put it for now... (benjito)

            // ... let's find where the payload goes in and out API and type that object with this "Challenge"
            //  then make the internal state of ChallengeModal (etc) have these things, an extended type. GaJ:

            system_message_id?: any; // Don't know what this is, but it's accessed in SeekGraph
            ranked_text?: string;
            handicap_text?: string | number;
            komi_text?: string | number;
            removed?: boolean;
            ineligible_reason?: string;
            user_challenge?: boolean;
            eligible?: boolean;
            game_name?: string;
        }
    }
}

declare namespace rest_api {
    type ColorOptions = "black" | "white";
    type ColorSelectionOptions = ColorOptions | "automatic" | "random";

    type KomiOption = "custom" | "automatic";

    // Payload of challenge POST
    interface ChallengeDetails {
        initialized: boolean;
        min_ranking: number;
        max_ranking: number;
        challenger_color: ColorSelectionOptions;
        rengo_auto_start: number;
        game: {
            name: string;
            rules: import("../lib/types").RuleSet;
            ranked: boolean;
            width: number;
            height: number;
            handicap: number;
            komi_auto: KomiOption;
            komi?: number;
            disable_analysis: boolean;
            initial_state: any; // TBD
            private: boolean;
            rengo: boolean;
            rengo_casual_mode: boolean;
            pause_on_weekends?: boolean;
            time_control?: import("../components/TimeControl").TimeControlTypes.TimeControlSystem;
            time_control_parameters?: import("../components/TimeControl").TimeControl;
        };
    }

    // Response payload from the server's OpenChallenge serializer,
    // you would expect this to be what's on any route returning an Open (not Direct) challenge.
    interface OpenChallengeDTO {
        id: number;
        created?: string | null;
        challenger: MinimalPlayerDTO;
        group: number;
        game?: GameDTO; // not clear why/when this would not be present
        challenger_color: ColorOptions;
        min_ranking: number;
        max_ranking: number;
        uuid: string;

        rengo_nominees: number[]; // array of player ids
        rengo_black_team: number[]; // array of player ids
        rengo_white_team: number[]; // array of player ids
        rengo_participants: number[]; // array of player ids
    }

    interface MinimalPlayerDTO {
        id?: number;
        username: string;
        country?: string;
        icon?: string; // URL
        ratings?: RatingsBySizeAndSpeed;
        ranking: number;
        professional: boolean;
        ui_class?: string;
    }

    interface GameDTO {
        id: number;
        players: { white: MinimalPlayerDTO; black: MinimalPlayerDTO };
        name: string;
        creator: number;
        mode: "game" | "demo" | "puzzle";
        source: "play" | "demo" | "sgf";
        black: number;
        white: number;
        width: number;
        height: number;
        rules: string;
        ranked: boolean;
        handicap: number;
        komi: number;
        time_control: string; // JSON?
        black_player_rank: number;
        black_player_rating: number;
        white_player_rank: number;
        white_player_rating: number;
        time_per_move: number;
        time_control_parameters: string; // JSON
        disable_analysis: boolean;
        tournament: number;
        tournament_round: number;
        ladder: number;
        pause_on_weekends: boolean;
        outcome: string;
        black_lost: boolean;
        white_lost: boolean;
        annulled: boolean;
        started: any; // It's a date
        ended: any; // It's a date
        sgf_filename: string;
        rengo: boolean;
        rengo_black_team: [number];
        rengo_white_team: [number];
        rengo_casual_mode: boolean;
        historical_ratings: { black: MinimalPlayerDTO; white: MinimalPlayerDTO };
        related: any; // not sure what this is, the serializer is a gnarly function
    }

    interface RengoParticipantsDTO {
        challenge: number; //challenge.id,
        rengo_nominees: [number]; //[x.id for x in challenge.rengo_nominees.all()],
        rengo_black_team: [number]; //[x.id for x in challenge.rengo_black_team.all()],
        rengo_white_team: [number]; //[x.id for x in challenge.rengo_white_team.all()]
    }
}
