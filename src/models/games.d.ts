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
    interface GameBase {
        related: {
            [key: string]: string;
        };
        players: {
            black: games.Player;
            white: games.Player;
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

        // these don't appear to be populated with useful data
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
        // For Game History, guaranteed to include the player of interest.
        historical_ratings: {
            black: games.Player;
            white: games.Player;
        };
        rengo: boolean;
    }

    /**
     * One element of `results` from `player/%player_id%/games`
     */
    interface Game extends GameBase {
        related: {
            detail: string; // route to full game info
        };
        sgf_filename: string | null;
        rengo_black_team?: number[];
        rengo_white_team?: number[];
    }

    namespace games {
        interface CompactPlayer {
            id: number;
            professional: boolean;
            rank: number;
            username: string;
        }

        interface Player {
            id: number;
            ratings: {
                version: number;
                overall: {
                    rating: number;
                    deviation: number;
                    volatility: number;
                };
            };
            username: string;
            country: string; // country code
            ranking: number;
            professional: boolean;
            icon: string; // URL
            ui_class: string;
        }

        interface GameData {
            aga_handicap_scoring: boolean;
            allow_ko: boolean;
            allow_self_capture: boolean;
            allow_superko: boolean;
            automatic_stone_removal: boolean;
            black_player_id: number;
            clock: {
                black_player_id: number;
                black_time: {
                    skip_bonus: boolean;
                    thinking_time: number;
                };
                current_player: number;
                expiration: number;
                game_id: number;
                last_move: number;
                title: string;
                white_player_id: number;
                white_time: {
                    skip_bonus: boolean;
                    thinking_time: number;
                };
            };
            disable_analysis: boolean;
            end_time: number;
            free_handicap_placement: boolean;
            game_id: number;
            game_name: string;
            group_ids: [];
            handicap: number;
            height: number;
            initial_player: "black" | "white";
            initial_state: {
                black: string;
                white: string;
            };
            komi: number;
            moves: [number, number, number][];
            opponent_plays_first_after_resume: boolean;
            original_disable_analysis: boolean;
            outcome: string;
            pause_on_weekends: boolean;
            phase: string;
            player_pool: {
                [player_id: number]: games.CompactPlayer;
            };
            players: {
                black: games.CompactPlayer;
                white: games.CompactPlayer;
            };
            private: boolean;
            ranked: boolean;
            rengo: boolean;
            rengo_teams: {
                black: number[];
                white: number[];
            };
            reviews: { [player_id: number]: import("../lib/player_cache").PlayerCacheEntry };
            rules: import("../lib/types").RuleSet;
            score_handicap: boolean;
            score_passes: boolean;
            score_prisoners: boolean;
            score_stones: boolean;
            score_territory: boolean;
            score_territory_in_seki: boolean;
            start_time: number;
            strict_seki_mode: boolean;
            superko_algorithm: string;
            time_control: {
                initial_time: number;
                max_time: number;
                speed: import("../lib/types").Speed;
                system: import("../components/TimeControl").TimeControlTypes.TimeControlSystem;
                time_control: import("../components/TimeControl").TimeControlTypes.TimeControlSystem;
                time_increment: number;
            };
            white_must_pass_last: boolean;
            white_player_id: number;
            width: number;
            winner: number;
        }
    }

    /**
     * The response from `games/%game_id%`
     */
    interface GameDetails extends GameBase {
        related: {
            reviews: string; // route to reviews
        };
        auth: string;
        game_chat_auth: string;
        gamedata: games.GameData;
    }
}
