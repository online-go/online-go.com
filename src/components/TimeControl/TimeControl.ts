/*
 * Copyright (C) 2012-2020  Online-Go.com
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

export namespace TimeControlTypes {
    export type TimeControlSpeed = "blitz" | "live" | "correspondence";
    export type TimeControlSystem = "fischer" | "byoyomi" | "canadian" | "simple" | "absolute" | "none";

    export interface Fischer {
        system: "fischer";
        speed: TimeControlSpeed;
        initial_time: number;
        time_increment: number;
        max_time: number;
        pause_on_weekends: boolean;
    }
    export interface ByoYomi {
        system: "byoyomi";
        speed: TimeControlSpeed;
        main_time: number;
        period_time: number;
        periods: number;
        pause_on_weekends: boolean;
    }
    export interface Canadian {
        system: "canadian";
        speed: TimeControlSpeed;
        main_time: number;
        period_time: number;
        stones_per_period: number;
        pause_on_weekends: boolean;
    }
    export interface Simple {
        system: "simple";
        speed: TimeControlSpeed;
        per_move: number;
        pause_on_weekends: boolean;
    }
    export interface Absolute {
        system: "absolute";
        speed: TimeControlSpeed;
        total_time: number;
        pause_on_weekends: boolean;
    }
    export interface None {
        system: "none";
        speed: "correspondence";
        pause_on_weekends: boolean;
    }
}


export type TimeControl = TimeControlTypes.Fischer
                        | TimeControlTypes.ByoYomi
                        | TimeControlTypes.Simple
                        | TimeControlTypes.Canadian
                        | TimeControlTypes.Absolute
                        | TimeControlTypes.None;
