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
import { socket } from "@/lib/sockets";
import { useRefresh, useUser } from "@/lib/hooks";
import { rankString } from "@/lib/rank_utils";
import { _, llm_pgettext, pgettext } from "@/lib/translate";
import { shortDurationString } from "goban";
import { SPEED_OPTIONS } from "./SPEED_OPTIONS";
/*
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import moment from "moment";
*/

interface AvailableQuickMatchesProps {
    lower_rank_diff: number;
    upper_rank_diff: number;
}

export function AvailableQuickMatches({
    lower_rank_diff,
    upper_rank_diff,
}: AvailableQuickMatchesProps): React.ReactElement {
    const available = React.useRef<{ [uuid: string]: any }>({});
    const refresh = useRefresh();
    const user = useUser();

    React.useEffect(() => {
        socket.send("automatch/available/subscribe", undefined);

        function onAdd(entry: any) {
            available.current[entry.uuid] = entry;
            refresh();
        }

        function onRemove(uuid: string) {
            delete available.current[uuid];
            refresh();
        }

        socket.on("automatch/available/add", onAdd);
        socket.on("automatch/available/remove", onRemove);

        return () => {
            socket.send("automatch/available/unsubscribe", undefined);
            socket.off("automatch/available/add", onAdd);
            socket.off("automatch/available/remove", onRemove);
        };
    }, []);

    const available_list = Object.values(available.current).filter((entry) => {
        return (
            (user.anonymous ||
                (entry.player.id !== user.id &&
                    entry.player.bounded_rank >= user.ranking - lower_rank_diff &&
                    entry.player.bounded_rank <= user.ranking + upper_rank_diff &&
                    user.ranking >= entry.player.bounded_rank - entry.preferences.lower_rank_diff &&
                    user.ranking <=
                        entry.player.bounded_rank + entry.preferences.upper_rank_diff)) &&
            entry.preferences.size_speed_options[0].speed !== "correspondence"
        );
    });
    available_list.sort((a, b) => {
        const a_speed = a.preferences.size_speed_options[0].speed;
        const b_speed = b.preferences.size_speed_options[0].speed;
        const a_speed_value =
            a_speed === "blitz" ? 0 : a_speed === "rapid" ? 1 : a_speed === "live" ? 2 : 3;
        const b_speed_value =
            b_speed === "blitz" ? 0 : b_speed === "rapid" ? 1 : b_speed === "live" ? 2 : 3;
        if (a_speed_value !== b_speed_value) {
            return a_speed_value - b_speed_value;
        }
        return a.player.bounded_rank - b.player.bounded_rank;
    });

    return (
        <div className="AvailableQuickMatches-container">
            <h4>
                {llm_pgettext(
                    "Active automatch searches",
                    "Active quick match searches by other players within your rank range",
                )}
            </h4>
            <div className="AvailableQuickMatches">
                <div className="column">
                    <h3>{_("Size")}</h3>
                </div>
                <div className="column">
                    <h3>{pgettext("Clock settings header for a new game", "Clock")}</h3>
                </div>
                <div className="column">
                    <h3>{_("Handicap")}</h3>
                </div>
                <div className="column">
                    <h3>{_("Rank")}</h3>
                </div>

                {available_list.map((entry) => {
                    const prefs = entry.preferences;
                    const system = prefs.time_control.value.system;
                    let speed = prefs.size_speed_options[0].speed;
                    const size = prefs.size_speed_options[0].size;
                    const handicap = prefs.handicap.value;

                    try {
                        const speed_options = (SPEED_OPTIONS as any)[size][speed][system];
                        speed =
                            system === "fischer"
                                ? `${shortDurationString(
                                      speed_options?.initial_time,
                                  )} + ${shortDurationString(speed_options?.time_increment)}`
                                : `${shortDurationString(
                                      speed_options?.main_time,
                                  )} + ${speed_options?.periods}x${shortDurationString(
                                      speed_options?.period_time,
                                  )}`;
                    } catch (e) {
                        console.error(e);
                    }

                    return (
                        <React.Fragment key={entry.uuid}>
                            <div className="column">{size}</div>
                            <div className="column">{speed}</div>
                            <div className="column">
                                {handicap === "enabled" ? (
                                    <i className="fa fa-check" />
                                ) : (
                                    <i className="fa fa-times" />
                                )}
                            </div>
                            <div className="column">{rankString(entry.player.bounded_rank)}</div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
