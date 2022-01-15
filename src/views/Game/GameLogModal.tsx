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

import * as React from "react";
import * as moment from "moment";
import * as data from "data";
import { _, pgettext, interpolate } from "translate";
import { post, get, patch, del } from "requests";
import { openModal, Modal } from "Modal";
import { timeControlDescription } from "TimeControl";
import { Player } from "Player";
import { handicapText } from "GameAcceptModal";
import { errorAlerter, ignore, rulesText } from "misc";
import { rankString } from "rank_utils";
import { browserHistory } from "ogsHistory";
import { termination_socket } from "sockets";
import { GoMath } from "goban";

interface Events {}

interface GameLogModalProperties {
    config: any;
    black: any;
    white: any;
}

interface LogEntry {
    timestamp: string;
    event: string;
    data: any;
}

export class GameLogModal extends Modal<Events, GameLogModalProperties, { log: Array<LogEntry> }> {
    constructor(props) {
        super(props);

        this.state = {
            log: [],
        };

        const config = this.props.config;
        const game_id = config.game_id;
        termination_socket.send(`game/log`, { game_id }, (log) => this.setLog(log));
    }

    setLog(log: Array<LogEntry>) {
        console.log(log);
        this.setState({ log });
    }

    render() {
        const config = this.props.config;
        const user = data.get("user");
        const game_id = config.game_id;

        return (
            <div className="Modal GameLogModal" ref="modal">
                <div className="header">
                    <div>
                        <h2>{config.game_name}</h2>
                        <h3>
                            <Player disableCacheUpdate icon rank user={this.props.black} /> {_("vs.")}{" "}
                            <Player disableCacheUpdate icon rank user={this.props.white} />
                        </h3>
                    </div>
                </div>
                <div className="body">
                    <table className="log">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Event</th>
                                <th>Parameters</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.log.map((entry, idx) => (
                                <tr key={entry.timestamp + ":" + idx} className="entry">
                                    <td className="timestamp">{moment(entry.timestamp).format("L LTS")}</td>
                                    <td className="event">{entry.event}</td>
                                    <td className="data">
                                        <LogData config={this.props.config} event={entry.event} data={entry.data} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                </div>
            </div>
        );
    }
}

function LogData({ config, event, data }: { config: any; event: string; data: any }): JSX.Element {
    if (event === "game_created") {
        return null;
    }

    const ret: Array<JSX.Element> = [];

    if (data) {
        try {
            for (const k in data) {
                if (k === "player_id") {
                    ret.push(
                        <span key={k} className="field">
                            <Player user={data[k]} />
                        </span>,
                    );
                } else if (k === "winner") {
                    ret.push(
                        <span key={k} className="field">
                            Winner: <Player user={data[k]} />
                        </span>,
                    );
                } else if (k === "stones") {
                    const stones = GoMath.decodeMoves(data[k], config.width, config.height)
                        .map((mv) => GoMath.prettyCoords(mv.x, mv.y, config.height))
                        .join(", ");

                    ret.push(
                        <span key={k} className="field">
                            {stones}
                        </span>,
                    );
                } else {
                    ret.push(
                        <span key={k} className="field">
                            {k}: {JSON.stringify(data[k])}
                        </span>,
                    );
                }
            }
        } catch (e) {
            // ignore
            console.warn(e);
        }
    }

    return <div>{ret}</div>;
}

export function openGameLogModal(config: any, black: any, white: any): void {
    openModal(<GameLogModal config={config} black={black} white={white} fastDismiss />);
}
