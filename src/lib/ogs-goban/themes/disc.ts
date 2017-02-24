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

import GoTheme from "../GoTheme";
import {_} from "../translate";

export default function(GoThemes) {
    class White extends GoTheme {
        sort() { return  0; }

        preRenderBlack(radius, seed): any {
            return true;
        };

        placeBlackStone(ctx, shadow_ctx, stone, cx, cy, radius) {
            ctx.fillStyle = "#000";
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0.001, 2 * Math.PI, false); /* 0.001 to workaround fucked up chrome bug */
            ctx.fill();
        };
    }

    class Black extends GoTheme {
        sort() { return  0; }

        preRenderWhite(radius, seed): any {
            return true;
        };

        placeWhiteStone(ctx, shadow_ctx, stone, cx, cy, radius) {
            let lineWidth = radius * 0.10;
            if (lineWidth < 0.3) {
                lineWidth = 0;
            }
            ctx.fillStyle = "#fff";
            ctx.strokeStyle = "#000";
            if (lineWidth > 0) {
                ctx.lineWidth = lineWidth;
            }
            ctx.beginPath();
            ctx.arc(cx, cy, radius - lineWidth / 2, 0.001, 2 * Math.PI, false); /* 0.001 to workaround fucked up chrome bug */
                    if (lineWidth > 0) {
                ctx.stroke();
            }
            ctx.fill();
        };
    }

    GoThemes["black"]["Plain"] = White;
    GoThemes["white"]["Plain"] = Black;
}
