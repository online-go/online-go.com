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
    namespace me {
        /**
         * One result from `me/ladders`
         */
        interface Ladder {
            id: number;
            name: string;
            board_size: number;
            group: {
                id: number;
                name: string;
                icon: string; // URL
            };
            size: number;
            player_rank: number;
            player_is_member_of_group: boolean;
        }
    }
}
