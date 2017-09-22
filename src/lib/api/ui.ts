/*
 * Copyright 2012-2017 Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Player } from './Player';

export interface UiConfig_GET_Request {
}
export interface UiFriends_GET_Request {
}
export interface UiOverview_GET_Request {
}
export interface UiConfig_GET_Response {
    csrf_token: string;
    cdn: string;
    paypal_server: string;
    braintree_cse: string;
    incident_auth: string;
    ggs_host: string;
    ignores: {
        chat: Array<any>;
    };
    paypal_email: string;
    superchat_auth: string;
    server_name: string;
    chat_auth: string;
    version: string;
    cdn_release: string;
    profanity_filter: boolean;
    ogs: {
        channels: Array<{
            country: string;
            id: string;
            name: string;
        }>;
        preferences: {
            show_game_list_view: boolean;
        };
    };
    user: Player;
    aga_ratings_enabled: boolean;
    lang: string;
    notification_auth: string;
    cdn_host: string;
    release: string;
    bots: Array<Player>;
}
export interface UiFriends_GET_Response {
    friend_requests_sent: Array<any>;
    friends: Array<Player>;
    friend_requests: Array<any>;
}
export interface UiOverview_GET_Response {
    challenges: Array<{
        id: number;
        challenger: Player;
        group: any;
        game: {
            related: {
                detail: string;
            };
            players: {
                white: Player;
                black: Player;
            };
            id: number;
            name: string;
            creator: number;
            mode: string;
            source: string;
            black: any;
            white: any;
            width: number;
            height: number;
            rules: string;
            ranked: boolean;
            handicap: number;
            komi: any;
            time_control: string;
            black_player_rank: number;
            black_player_rating: string;
            white_player_rank: number;
            white_player_rating: string;
            time_per_move: number;
            time_control_parameters: string;
            disable_analysis: boolean;
            tournament: any;
            tournament_round: number;
            ladder: any;
            pause_on_weekends: boolean;
            outcome: string;
            black_lost: boolean;
            white_lost: boolean;
            annulled: boolean;
            started: any;
            ended: any;
            sgf_filename: any;
            historical_ratings: {
            };
        };
        challenger_color: string;
        min_ranking: number;
        max_ranking: number;
    }>;
    active_games: Array<{
        name: string;
        height: number;
        width: number;
        json: {
            score_stones: boolean;
            original_disable_analysis: boolean;
            allow_ko: boolean;
            private: boolean;
            height: number;
            time_control: {
                system: string;
                pause_on_weekends: boolean;
                time_control: string;
                initial_time: number;
                max_time: number;
                time_increment: number;
                speed: string;
            };
            free_handicap_placement: boolean;
            aga_handicap_scoring: boolean;
            meta_groups: Array<number>;
            moves: Array<Array<number>>;
            allow_superko: boolean;
            score_passes: boolean;
            clock: {
                expiration_delta: number;
                current_player: number;
                title: string;
                paused_since: number;
                black_player_id: number;
                last_move: number;
                white_player_id: number;
                expiration: number;
                game_id: number;
                now: number;
                black_time: {
                    thinking_time: number;
                    skip_bonus: boolean;
                };
                white_time: {
                    thinking_time: number;
                    skip_bonus: boolean;
                };
            };
            black_player_id: number;
            pause_on_weekends: boolean;
            white_player_id: number;
            width: number;
            conditional_moves: {
                [id:number]: {
                    move_number: number;
                    moves: any;
                };
            };
            initial_state: {
                white: string;
                black: string;
            };
            score_territory_in_seki: boolean;
            automatic_stone_removal: boolean;
            handicap: number;
            start_time: number;
            score_prisoners: boolean;
            disable_analysis: boolean;
            allow_self_capture: boolean;
            pauses_left_1: number;
            ranked: boolean;
            komi: number;
            game_id: number;
            strict_seki_mode: boolean;
            opponent_plays_first_after_resume: boolean;
            superko_algorithm: string;
            white_must_pass_last: boolean;
            pause_control: {
                'vacation-472': boolean;
            };
            rules: string;
            paused_since: number;
            reviews: {
                [id:number]: Player;
            };
            players: {
                white: Player;
                black: Player;
            };
            phase: string;
            game_name: string;
            score_territory: boolean;
            initial_player: string;
            history: Array<any>;
        };
        black: Player;
        white: Player;
        id: number;
    }>;
}

export interface UiOmniSearch_GET_Response {
    q: string;
    players: Array<Player>;
    tournaments: Array<any>;
    groups: Array<any>;
}
export interface UiOmniSearch_GET_Request {
    q: string;
}

export interface UiFriends_GET {
    request: UiFriends_GET_Request;
    response: UiFriends_GET_Response;
}
export interface UiConfig_GET {
    request: UiConfig_GET_Request;
    response: UiConfig_GET_Response;
}
export interface UiOverview_GET {
    request: UiOverview_GET_Request;
    response: UiOverview_GET_Response;
}
export interface UiOmniSearch_GET {
    request: UiOmniSearch_GET_Request;
    response: UiOmniSearch_GET_Response;
}
