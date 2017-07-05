/*
 * Copyright (C) 2012-2017  Online-Go.com
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

export type Color = "Black" | "White";
export type Rules = "AGA" | "Chinese" | "Ing SST" | "Japanese" | "Korean" | "New Zealand";
export type TimeControl = "Absolute" | "Byo-Yomi" | "Canadian" | "Fischer" | "None" | "Simple";

export let colors: Array<Color> = ["Black", "White"];
export let rules: Array<Rules> = ["AGA", "Chinese", "Ing SST", "Japanese", "Korean", "New Zealand"];
export let time_controls: Array<TimeControl> = ["Absolute", "Byo-Yomi", "Canadian", "Fischer", "None", "Simple"];
