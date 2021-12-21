/*
 * Copyright (C) 2021  Ben Jones
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

/**
 * One element of `results` from `tournaments/`
 *
 * This is a work in progress. Trust these values at your own risk.
 * */
export interface Tournament {
    "id": number;
    "name": string;
    "director": {
        "id": number;
        "username": string;
        "country": string;
        "icon": string; // URL
        "ratings": {
            "version": number;
            "overall": {
                "rating": number;
                "deviation": number;
                "volatility": number;
            };
        };
        "ranking": number;
        "professional": boolean;
        "ui_class": string;
    };
    "description": "Automatic Sitewide Tournament";
    "schedule": {
        "id": number;
        "name": string;
        "rrule": string;
        "active": boolean;
        "created": string; // Date
        "last_run": string; // Date
        "lead_time_seconds": number;
        "tournament_type": string;
        "handicap": number;
        "rules": string;
        "size": number;
        "time_control_parameters": {};
        "min_ranking": number;
        "max_ranking": number;
        "analysis_enabled": boolean;
        "exclude_provisional": boolean;
        "players_start": number;
        "first_pairing_method": string;
        "subsequent_pairing_method": string;
        "settings": {
            "num_rounds": string; // number
            "upper_bar": string; // number
            "lower_bar": string; // number
            "group_size": string; // number
            "maximum_players": number;
        };
        "next_run": string; // Date
        "base_points": string; // number
    };
    "title"?: string;
    "tournament_type": string;
    "handicap": number;
    "rules": string;
    "time_per_move": number;
    "time_control_parameters": {
        "time_control": string;
        "period_time": number;
        "main_time": number;
        "periods": number;
    };
    "is_open": boolean;
    "exclude_provisional": boolean;
    "group": {
        "id": number;
        "name": string;
        "summary": string;
        "require_invitation": boolean;
        "is_public": boolean;
        "hide_details": boolean;
        "member_count": number;
        "icon": string;  // URL
    };
    "auto_start_on_max": boolean;
    "time_start": string; // Date
    "players_start": number;
    "first_pairing_method": string;
    "subsequent_pairing_method": string;
    "min_ranking": number;
    "max_ranking": number;
    "analysis_enabled": boolean;
    "exclusivity": string;
    "started": string; // Date
    "ended": string; // Date
    "start_waiting": string; // Date
    "board_size": number;
    "active_round": number;
    "icon": string; // URL
    "player_count": number;
}

}
