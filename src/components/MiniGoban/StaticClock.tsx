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
import { JGOFTimeControl } from "goban";
import { prettyTime } from "@/components/Clock";
import { pgettext } from "@/lib/translate";

interface StaticClockProps {
    timeControl: JGOFTimeControl;
}

export function StaticClock({ timeControl }: StaticClockProps): React.ReactElement | null {
    const tc = timeControl;

    if (tc.system === "none") {
        return null;
    }

    const s2ms = (s: number) => s * 1000;

    return (
        <span className="Clock mini-goban">
            {tc.system === "fischer" && (
                <>
                    <span className="main-time boxed">{prettyTime(s2ms(tc.initial_time))}</span>
                    <span className="periods-delimiter">+</span>
                    <span className="period-time boxed">{prettyTime(s2ms(tc.time_increment))}</span>
                </>
            )}

            {tc.system === "byoyomi" && (
                <>
                    {tc.main_time > 0 && (
                        <span className="main-time boxed">{prettyTime(s2ms(tc.main_time))}</span>
                    )}
                    {tc.periods >= 1 && (
                        <div className="byo-yomi-container">
                            {tc.main_time > 0 && <span className="periods-delimiter"> + </span>}
                            <span className="period-time boxed">
                                {prettyTime(s2ms(tc.period_time))}
                            </span>
                            <span className="byo-yomi-periods">
                                (
                                {tc.periods === 1
                                    ? pgettext("Final byo-yomi period (Sudden Death)", "SD")
                                    : `${tc.periods}`}
                                )
                            </span>
                        </div>
                    )}
                </>
            )}

            {tc.system === "canadian" && (
                <>
                    {tc.main_time > 0 && (
                        <span className="main-time boxed">{prettyTime(s2ms(tc.main_time))}</span>
                    )}
                    <span className="canadian-clock-container">
                        {tc.main_time > 0 && <span className="periods-delimiter"> + </span>}
                        <span className="period-time boxed">
                            {prettyTime(s2ms(tc.period_time))}
                        </span>
                        <span className="periods-delimiter">/</span>
                        <span className="period-moves boxed">{tc.stones_per_period}</span>
                    </span>
                </>
            )}

            {tc.system === "simple" && (
                <span className="main-time boxed">{prettyTime(s2ms(tc.per_move))}</span>
            )}

            {tc.system === "absolute" && (
                <span className="main-time boxed">
                    {prettyTime(s2ms(tc.total_time))}
                    <span className="absolute-time">+0</span>
                </span>
            )}
        </span>
    );
}
