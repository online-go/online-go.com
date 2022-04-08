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

type Server = "kgs" | "igs" | "dgs" | "golem" | "wbaduk" | "tygem" | "fox" | "yike" | "goquest";
declare namespace rest_api {
    interface RatingsConfig {
        rating: number;
        deviation: number;
        volatility: number;
    }

    type RatingsBySizeAndSpeed = {
        version: number;
        overall: RatingsConfig;
    } & {
        [game_type in
            | import("../lib/types").Size
            | import("../lib/types").Speed
            | `${import("../lib/types").Speed}-${import("../lib/types").Size}`]: RatingsConfig;
    };

    /**
     * The type of `config.user` passed back by the `ui/config` endpoint.
     */
    interface UserConfig {
        anonymous: boolean;
        id: number;
        username: string;
        registration_date: string; // Date
        ratings: RatingsBySizeAndSpeed;
        country: string; // country code
        professional: boolean;
        ranking: number;
        provisional: 0 | 1; // change to boolean?
        can_create_tournaments: boolean;
        is_moderator: boolean;
        is_superuser: boolean;
        is_tournament_moderator: boolean;
        supporter: boolean;
        supporter_level: number;
        tournament_admin: boolean;
        ui_class: string;
        icon: string; // URL
        email: string;
        email_validated: boolean | string; // VerifyEmail sets this to a Date string
        is_announcer: boolean;
    }

    type AccountLinks = {
        [org in `org${1 | 2 | 3}`]?: string;
    } & {
        [org_id in `org${1 | 2 | 3}_id`]?: string;
    } & {
        [org_rank in `org${1 | 2 | 3}_rank`]?: string;
    } & {
        [server_username in `${Server}_username`]?: string;
    } & {
        [server_rank in `${Server}_rank`]?: string;
    } & {
        hidden: boolean;
        hidden_ids: boolean;
    };

    interface FullPlayerDetail {
        user: {
            id: number;
            username: string;
            professional: boolean;
            ranking: number;
            rating: number;
            deviation: number;
            ratings: {
                version: number;
                overall: RatingsConfig;
            } & {
                [game_type in
                    | import("../lib/types").Size
                    | import("../lib/types").Speed
                    | `${import("../lib/types").Speed}-${import("../lib/types").Size}`]: RatingsConfig;
            };
            country: string; // country code
            language: string;
            name: string | null;
            first_name: string | null;
            last_name: string | null;
            real_name_is_private: boolean;
            about: string;
            supporter: boolean;
            ui_class_extra: null;
            is_moderator: boolean;
            is_superuser: boolean;
            is_tournament_moderator: boolean;
            is_bot: boolean;
            timeout_provisional: boolean;
            bot_ai: any | null;
            bot_owner: any | null;
            bot_apikey?: any;
            website: string;
            icon: string; // URL
            registration_date: string; // ISO Date
            vacation_left: number;
            on_vacation: boolean;
            self_reported_account_linkages?: AccountLinks;
            is_watched: boolean;
        };
        active_games: players.full.Game[];
        ladders: Array<{
            rank: number;
            id: number;
            name: string;
            icon: string; // URL
        }>;
        tournaments: Array<{
            id: number;
            name: string;
            icon: string; // URL
        }>;
        titles: Array<{
            title: string;
            icon: string; // URL
        }>;
        trophies: Array<{
            tournament_id: number;
            tournament_name: string;
            icon: string;
            title: string;
        }>;
        groups: Array<{
            id: number;
            name: string;
            icon: string; // URL
        }>;
        is_friend: boolean;
        friend_request_sent: boolean;
        friend_request_received: boolean;
        vs: {
            wins: number;
            losses: number;
            draws: number;
            history: Array<{
                game: number;
                state: "W" | "L";
                date: string; // ISO date
            }>;
        };
        block: {
            block_chat: boolean;
            block_games: boolean;
        };
        achievements: any[];
        ip?: string;
    }

    interface PlayerDetail {
        related: { [key: string]: string };
        id: number;
        username: string;
        professional: boolean;
        ranking: number;
        country: string;
        language: string;
        about: string;
        supporter: boolean;
        is_bot: boolean;
        bot_ai: string | null;
        bot_owner: number | null;
        website: string;
        registration_date: string; // ISO Date
        name: string;
        timeout_provisional: boolean;
        ratings: {
            version: number;
            overall: RatingsConfig;
        };
        is_friend: boolean;
        aga_id: null;
        ui_class: string;
        icon: string;
    }

    namespace termination_api {
        interface Player {
            id: number;
            country: string;
            username: string;
            "icon-url": string;
            ui_class: string;
            ratings: RatingsBySizeAndSpeed;
            rating: number;
            ranking: number;
            pro: number;
        }
    }
}
