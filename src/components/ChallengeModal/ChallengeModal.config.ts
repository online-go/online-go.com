/*
 * Copyright (C)  Online-Go.com
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

import { DemoSettings } from "@/lib/data_schema";
import { _ } from "@/lib/translate";

export const defaultInitialSettings: DemoSettings = {
    name: "",
    rules: "japanese",
    width: 19,
    height: 19,
    black_name: _("Black"),
    black_ranking: 1039,
    white_name: _("White"),
    white_ranking: 1039,
    private: false,
    komi_auto: "automatic",
};

export const standard_board_sizes: string[] = [
    "19x19",
    "13x13",
    "9x9",
    "25x25",
    "21x21",
    "5x5",
    "19x9",
    "5x13",
];
