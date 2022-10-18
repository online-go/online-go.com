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
    interface MatchDetails {
        id: number; // pk
        black_member_id: string; // shortuuid
        black_invite: string; // URL
        white_member_id: string; // shortuuid
        white_invite: string; // URL
        spectator_link: string; // URL
        league: string; // acronym/name
        game: number; // pk
        finished: boolean;
    }
}
