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

import { LogEntry } from "Game";
import { GobanEngineConfig } from "goban";

import { socket } from "sockets";
import { Player } from "Player";
import { ScoringEventThumbnail } from "./ScoringEventThumbnail";

const TRUNCATED_GAME_LOG_LENGTH = 25;

export function GameLog({ goban_config }: { goban_config: GobanEngineConfig }): JSX.Element {
    const [log, setLog] = React.useState<LogEntry[]>([]);
    const game_id = goban_config.game_id as number;

    React.useEffect(() => {
        socket.send(`game/log`, { game_id }, (log) => setLog(log));
    }, [game_id]);

    const markCoords = React.useCallback(
        (coords: string) => {
            console.log("Should be marking coords ", coords);
        },
        [goban_config],
    );

    const [shouldDisplayFullLog, setShouldDisplayFullLog] = React.useState(false);

    return (
        <>
            <h3>{_("Game Log")}</h3>
            {log.length > 0 ? (
                <>
                    <table className="game-log">
                        <thead>
                            <tr>
                                <th>
                                    {pgettext(
                                        "A heading: the time when something happened",
                                        "Time",
                                    )}
                                </th>
                                <th>{pgettext("A heading: something that happened", "Event")}</th>
                                <th>
                                    {pgettext(
                                        "A heading: a column with game parameters in it",
                                        "Parameters",
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {log
                                .filter(
                                    (_, idx) =>
                                        shouldDisplayFullLog || idx < TRUNCATED_GAME_LOG_LENGTH,
                                )
                                .map((entry, idx) => (
                                    <tr key={entry.timestamp + ":" + idx} className="entry">
                                        <td className="timestamp">
                                            {moment(entry.timestamp).format("L LTS")}
                                        </td>
                                        <td className="event">{entry.event.replace(/_/g, " ")}</td>
                                        <td className="data">
                                            <LogData
                                                config={goban_config}
                                                markCoords={markCoords}
                                                event={entry.event}
                                                data={entry.data}
                                            />
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                    {!shouldDisplayFullLog && log.length > TRUNCATED_GAME_LOG_LENGTH && (
                        <button onClick={() => setShouldDisplayFullLog(true)}>
                            {`${_("Show all")} (${log.length})`}
                        </button>
                    )}
                </>
            ) : (
                <div>{_("No game log entries")}</div>
            )}
        </>
    );
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

    React.useEffect(() => {
        // Set up the marks config for the thumbnail
        if (event === "game_created") {
            // don't set up a thumbnail for game created
            return;
        }

        // Possibly obvious once you think about it: the "stones" field in `data` referring to
        //          "stones that are dead, or have been marked alive"
        //  It'd be better if this was called "marked stones", but that'd be a big change.

        //  It's valid for a thumbnail to have _none_ of these: a board that has no dead stones on it!

        if (!data?.hasOwnProperty("stones")) {
            // don't set up a thumbnail for events that don't have the `stones` field...
            // those events aren't about marking stones, so the thumbnail is not relevant
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
