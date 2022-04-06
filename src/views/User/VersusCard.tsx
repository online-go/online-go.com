/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import { Card } from "material";
import { interpolate } from "translate";
import * as moment from "moment";
import * as React from "react";

type VersusCardProps = rest_api.FullPlayerDetail["vs"] & { username: string };

function toPrettyDate(date: string) {
    return moment(new Date(date)).format("ll");
}

export function VersusCard(props: VersusCardProps) {
    const total = props.wins + props.losses + props.draws;
    const winPercent = (props.wins / total) * 100.0;
    const lossPercent = (props.losses / total) * 100.0;
    const drawPercent = (props.draws / total) * 100.0;
    const recent5 = (props.history ?? []).slice(0, 5);

    return (
        <Card>
            <h5 style={{ textAlign: "center" }}>
                {interpolate(
                    "You have won {{vs.wins}} out of {{vs.total}} games against {{username}}",
                    {
                        "vs.wins": props.wins,
                        "vs.total": total,
                        username: props.username,
                    },
                )}
            </h5>
            <div className="progress">
                {winPercent > 0 && (
                    <div className="progress-bar games-won" style={{ width: winPercent + "%" }}>
                        {props.wins}
                    </div>
                )}
                {lossPercent > 0 && (
                    <div className="progress-bar games-lost" style={{ width: lossPercent + "%" }}>
                        {props.losses}
                    </div>
                )}
                {drawPercent > 0 && (
                    <div className="progress-bar primary" style={{ width: drawPercent + "%" }}>
                        {props.draws}
                    </div>
                )}
            </div>

            {recent5.map((game, idx) => (
                <div style={{ textAlign: "center" }} key={idx}>
                    <span className="date">{toPrettyDate(game.date)}</span>{" "}
                    <a href={`/game/${game.game}`}>#{game.game}</a>
                    {game.state === "W" && <i className="fa fa-check-circle-o won"></i>}
                    {game.state === "L" && <i className="fa fa-times loss"></i>}
                </div>
            ))}
        </Card>
    );
}
