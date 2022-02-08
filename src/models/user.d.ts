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
}
