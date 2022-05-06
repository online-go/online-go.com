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

interface UserT {
    id: number;
    username: string;
    country: string; // Country Code
    icon: string; // URL
    ratings: {
        version: number;
        overall: {
            rating: number;
            deviation: number;
            volatility: number;
        };
    };
    ranking: number;
    professional: boolean;
    ui_class: string;
}

declare namespace rest_api {
    interface PuzzleDetail {
        id: number;
        order: number;
        owner: UserT;
        name: string;
        created: string; // ISO Date
        modified: string; // ISO Date
        puzzle: {
            mode: string;
            name: string;
            puzzle_type: string;
            width: number;
            height: number;
            initial_state: {
                white: string;
                black: string;
            };
            puzzle_opponent_move_mode: import("goban").PuzzleOpponentMoveMode;
            puzzle_player_move_mode: import("goban").PuzzlePlayerMoveMode;
            puzzle_rank: string; // number
            puzzle_description: string;
            puzzle_collection: string; // number
            initial_player: "black" | "white";
            move_tree: import("goban").MoveTreeJson;
        };
        private: boolean;
        width: number;
        height: number;
        type: string;
        has_solution: boolean;
        rating: number;
        rating_count: number;
        rank: number;
        collection: {
            id: number;
            owner: UserT;
            name: string;
            created: string; // ISODate
            private: boolean;
            price: string; // Number
            starting_puzzle: {
                id: number;
                initial_state: {
                    white: string;
                    black: string;
                };
                width: number;
                height: number;
            };
            rating: number;
            rating_count: number;
            puzzle_count: number;
            min_rank: number;
            max_rank: number;
            view_count: number;
            solved_count: number;
            attempt_count: number;
            color_transform_enabled: boolean;
            position_transform_enabled: boolean;
        };
        view_count: number;
        solved_count: number;
        attempt_count: number;

        zoomable?: boolean;
    }
}
