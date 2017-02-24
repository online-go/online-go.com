/*
 * Copyright 2012-2017 Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import GoTheme from "./GoTheme";

export const GoThemes = {
    white: {} as any,
    black: {} as any,
    board: {} as any,
};

import init_board_plain from "./themes/board_plain";
import init_board_woods from "./themes/board_woods";
import init_disc from "./themes/disc";
import init_rendered from "./themes/rendered_stones";

init_board_plain(GoThemes);
init_board_woods(GoThemes);
init_disc(GoThemes);
init_rendered(GoThemes);


function theme_sort(a, b) {
    return a.sort - b.sort;
}

for (let k in GoThemes) {
    GoThemes[k].sorted = Object.keys(GoThemes[k]).map((n) => {
        GoThemes[k][n].theme_name = n;
        return GoThemes[k][n];
    });
    GoThemes[k].sorted.sort(theme_sort);
}
