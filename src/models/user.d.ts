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
    interface RatingsConfig {
        rating: number;
        deviation: number;
        volatility: number;
    }

    /**
     * The type of `config.user` passed back by the `ui/config` endpoint.
     */
    interface UserConfig {
        anonymous: boolean;
        id: number;
        username: string;
        registration_date: string; // Date
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

    interface PlayerDetails {
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
            name: any | null;
            first_name: any | null;
            last_name: any | null;
            real_name_is_private: true;
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
            registration_date: "2018-04-09T13:04:44.987830Z";
            vacation_left: number;
            on_vacation: boolean;
        };
        active_games: players.full.Game[];
        ladders: Array<{
            rank: number;
            id: number;
            name: string;
        }>;
        tournaments: Array<{
            id: number;
            name: string;
        }>;
        titles: any[];
        trophies: Array<{
            tournament_id: number;
            tournament_name: string;
            icon: string;
            title: string;
        }>;
        groups: any[];
        is_friend: boolean;
        friend_request_sent: boolean;
        friend_request_received: boolean;
        vs: {
            wins: number;
            losses: number;
            draws: number;
            history: any[];
        };
        block: {
            block_chat: boolean;
            block_games: boolean;
        };
        achievements: any[];
        ip?: string;
    }
}
