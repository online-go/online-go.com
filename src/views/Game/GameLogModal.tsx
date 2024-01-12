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
import * as moment from "moment";
import { _ } from "translate";
import { openModal, Modal } from "Modal";
import { Player } from "Player";
import { socket } from "sockets";
import { GoEngineConfig } from "goban";
import { ScoringEventThumbnail } from "../../views/ReportsCenter/ScoringEventThumbnail";

interface Events {}

interface GameLogModalProperties {
    config: any;
    markCoords: any;
    black: any;
    white: any;
}

export interface LogEntry {
    timestamp: string;
    event: string;
    data: any;
}

export class GameLogModal extends Modal<Events, GameLogModalProperties, { log: Array<LogEntry> }> {
    config: any;

    constructor(props: GameLogModalProperties) {
        super(props);

        this.state = {
            log: [],
        };

        const config = this.props.config;
        const game_id = config.game_id;
        socket.send(`game/log`, { game_id }, (log) => this.setLog(log));
    }

    setLog(log: Array<LogEntry>) {
        console.log(log);
        this.setState({ log });
    }

    render() {
        return (
            <div className="Modal GameLogModal">
                <div className="header">
                    <div>
                        <h2>{this.props.config.game_name}</h2>
                        <h3>
                            <Player disableCacheUpdate icon rank user={this.props.black} />{" "}
                            {_("vs.")}{" "}
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
                                    <td className="timestamp">
                                        {moment(entry.timestamp).format("L LTS")}
                                    </td>
                                    <td className="event">{entry.event}</td>
                                    <td className="data">
                                        <LogData
                                            config={this.props.config}
                                            markCoords={this.props.markCoords}
                                            event={entry.event}
                                            data={entry.data}
                                        />
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

export function LogData({
    config,
    event,
    data,
}: {
    config: GoEngineConfig;
    markCoords: (stones: string) => void;
    event: string;
    data: any;
}): JSX.Element | null {
    const [markedConfig, setMarkedConfig] = React.useState<GoEngineConfig | null>(null);
    React.useEffect(() => {
        if (event === "game_created") {
            return;
        }
        if (!data?.stones) {
            return;
        }

        let marks: { [mark: string]: string };
        if (event === "stone_removal_stones_set") {
            if (data.removed) {
                marks = { cross: data.stones };
            } else {
                marks = { triangle: data.stones };
            }
        } else {
            marks = { cross: data.stones };
        }

        setMarkedConfig({
            ...config,
            marks,
            removed: "",
        });
    }, [config, event, data?.removed, data?.stones]);

    const ret: Array<JSX.Element> = [];

    if (event === "game_created") {
        return null;
    }

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
                    // we'll re-render when it's set
                    if (markedConfig) {
                        ret.push(
                            <ScoringEventThumbnail
                                key={k}
                                config={markedConfig}
                                move_number={data.move_number}
                                removal_string={data.current_removal_string}
                            />,
                        );
                    }
                } else if (k === "current_removal_string" || k === "move_number") {
                    // skip
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

interface DCBProperties {
    markCoords: any;
    stones: string;
}

export class DrawCoordsButton extends React.Component<DCBProperties, {}> {
    constructor(props: DCBProperties) {
        super(props);
        this.handleMarkCoords = this.handleMarkCoords.bind(this);
    }

    handleMarkCoords() {
        this.props.markCoords(this.props.stones);
    }

    render() {
        return (
            <a onClick={this.handleMarkCoords} className="field">
                {this.props.stones}
            </a>
        );
    }
}

export function openGameLogModal(
    config: any,
    markCoords: (stones: string) => void,
    black: any,
    white: any,
): void {
    openModal(
        <GameLogModal
            config={config}
            markCoords={markCoords}
            black={black}
            white={white}
            fastDismiss
        />,
    );
}
