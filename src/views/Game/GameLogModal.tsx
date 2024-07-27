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
import { _, pgettext } from "translate";
import { openModal, Modal } from "Modal";
import { Player } from "Player";
import { socket } from "sockets";
import { GobanEngineConfig } from "goban";
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
    }

    componentDidMount(): void {
        super.componentDidMount();
        socket.send(`game/log`, { game_id: this.props.config.game_id }, (log) => this.setLog(log));
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
                            {this.state.log
                                .filter(
                                    // filter out weird stone_removal_stones_set events with no stones
                                    (entry) =>
                                        !(
                                            entry.event === "stone_removal_stones_set" &&
                                            entry.data.stones === ""
                                        ),
                                )
                                .map((entry, idx) => (
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
                                                key={idx}
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

// Fields that are only used to enhance the display of other fields,
// or aren't used at all.
const HIDDEN_LOG_FIELDS = [
    "current_removal_string", // used with "stones"
    "color", // used with "player_id"
    "move_number", // irrelevant
    // isn't used
    "strict_seki_mode",
];

export function LogData({
    config,
    event,
    data,
}: {
    config: GobanEngineConfig;
    markCoords: (stones: string) => void;
    event: string;
    data: any;
}): JSX.Element | null {
    const [markedConfig, setMarkedConfig] = React.useState<GobanEngineConfig | null>(null);

    // Obvious once you think about it: the "stones" field that we get here is talking about
    // "stones that are dead, or have been marked alive"
    //  It'd be better if this was called "marked stones", but that'd be a big change.

    //  It's valid for a thumbnail to have _none_ of these: a board that has no dead stones on it!

    React.useEffect(() => {
        // Set up the marks config for the thumbnail
        if (event === "game_created") {
            // don't set up a thumbnail for game created
            return;
        }
        if (!data?.hasOwnProperty("stones")) {
            // don't set up a thumbnail for events that don't have the `stones` field...
            // they aren't about marking stones, thumbnail is not relevant
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
            marks = { cross: data.stones }; // TBD: What is this case?
        }

        setMarkedConfig({
            ...config,
            marks,
            removed: "",
        });
    }, [config, event, data?.removed, data?.stones]);

    const ret: Array<JSX.Element> = [];

    if (event === "game_created") {
        // game_created has the whole board config list of field, don't dump all those in the log.
        return null;
    }

    if (data) {
        try {
            for (const k in data) {
                if (k === "player_id") {
                    ret.push(
                        <span key={k} className="field">
                            <Player user={data[k]} />
                            {data.color ? (data.color === "black" ? " (black)" : " (white)") : ""}
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
                } else if (k === "removed") {
                    ret.push(
                        <span key={k} className="field">
                            {data[k] ? "stones marked dead" : "stones marked alive"}
                        </span>,
                    );
                } else if (k === "needs_sealing") {
                    // this only comes with autoscore updates
                    ret.push(
                        <span key={k} className="field">
                            {pgettext(
                                "This is telling a moderator that they are looking at an update from the auto scorer",
                                "auto-scorer update",
                            )}
                        </span>,
                    );
                } else if (HIDDEN_LOG_FIELDS.includes(k)) {
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
