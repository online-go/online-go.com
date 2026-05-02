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

import * as React from "react";
import { pgettext } from "@/lib/translate";
import "./GoldenRules.css";

const RULES = [
    {
        cn: "贪不得胜",
        tr: pgettext(
            "Golden rule of Go #1 (贪不得胜). Translate succinctly and with balance, artistry is as important as accuracy in this context.",
            "Don't be greedy",
        ),
    },
    {
        cn: "入界宜缓",
        tr: pgettext(
            "Golden rule of Go #2 (入界宜缓). Translate succinctly and with balance, artistry is as important as accuracy in this context.",
            "Invade cautiously",
        ),
    },
    {
        cn: "攻彼顾我",
        tr: pgettext(
            "Golden rule of Go #3 (攻彼顾我). Translate succinctly and with balance, artistry is as important as accuracy in this context.",
            "Protect while attacking",
        ),
    },
    {
        cn: "弃子争先",
        tr: pgettext(
            "Golden rule of Go #4 (弃子争先). Translate succinctly and with balance, artistry is as important as accuracy in this context.",
            "Sacrifice to gain initiative",
        ),
    },
    {
        cn: "舍小就大",
        tr: pgettext(
            "Golden rule of Go #5 (舍小就大). Translate succinctly and with balance, artistry is as important as accuracy in this context.",
            "Abandon small, save big",
        ),
    },
    {
        cn: "逢危须弃",
        tr: pgettext(
            "Golden rule of Go #6 (逢危须弃). Translate succinctly and with balance, artistry is as important as accuracy in this context.",
            "When in danger, sacrifice",
        ),
    },
    {
        cn: "慎勿轻速",
        tr: pgettext(
            "Golden rule of Go #7 (慎勿轻速). Translate succinctly and with balance, artistry is as important as accuracy in this context.",
            "Good shape finds sente",
        ),
    },
    {
        cn: "动须相应",
        tr: pgettext(
            "Golden rule of Go #8 (动须相应). Translate succinctly and with balance, artistry is as important as accuracy in this context.",
            "Play locally, think globally",
        ),
    },
    {
        cn: "彼强自保",
        tr: pgettext(
            "Golden rule of Go #9 (彼强自保). Translate succinctly and with balance, artistry is as important as accuracy in this context.",
            "Near strength, play safe",
        ),
    },
    {
        cn: "势孤取和",
        tr: pgettext(
            "Golden rule of Go #10 (势孤取和). Translate succinctly and with balance, artistry is as important as accuracy in this context.",
            "When isolated, seek peace",
        ),
    },
];

export function GoldenRules(): React.ReactElement {
    return (
        <div className="GoldenRules">
            <div className="golden-rules-grid">
                {Array.from({ length: 5 }, (_, row) => {
                    const left = RULES[row * 2];
                    const right = RULES[row * 2 + 1];
                    return (
                        <React.Fragment key={row}>
                            <div className={`rule _${row * 2 + 1}`}>
                                <span className="cn">{left.cn}</span>
                                <span className="tr">{left.tr}</span>
                            </div>
                            <div className={`rule _${row * 2 + 2}`}>
                                <span className="tr">{right.tr}</span>
                                <span className="cn">{right.cn}</span>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
