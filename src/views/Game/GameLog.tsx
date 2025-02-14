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
import moment from "moment";

import { _, llm_pgettext, pgettext } from "@/lib/translate";
import * as DynamicHelp from "react-dynamic-help";

import { GobanEngineConfig } from "goban";

import { socket } from "@/lib/sockets";
import { Player } from "@/components/Player";
import { ScoringEventThumbnail } from "./ScoringEventThumbnail";

const TRUNCATED_GAME_LOG_LENGTH = 25;

export interface LogEntry {
    timestamp: string;
    event: string;
    data: any;
}

interface GameLogProps {
    goban_config: GobanEngineConfig;
    onContainsTimeout?: (player_id: number | null) => void;
    onContainsAbandonment?: (contains_abandonment: boolean) => void;
}

export function GameLog({
    goban_config,
    onContainsTimeout,
    onContainsAbandonment,
}: GameLogProps): React.ReactElement {
    const [log, setLog] = React.useState<LogEntry[]>([]);
    const [shouldDisplayFullLog, setShouldDisplayFullLog] = React.useState(false);

    const { registerTargetItem } = React.useContext(DynamicHelp.Api);
    const autoscoreRef = registerTargetItem("autoscore-game-log-entry").ref || null;

    const game_id = goban_config.game_id as number;

    let firstAutoscoringEntryRendered = false;

    React.useEffect(() => {
        socket.send(`game/log`, { game_id }, (log) => {
            setLog(log);
            onContainsTimeout?.(null);
            onContainsAbandonment?.(false);
            const timeout_entry = log.find((entry) => entry.event === "timed_out");
            if (timeout_entry && onContainsTimeout) {
                onContainsTimeout(timeout_entry.data.player_id);
            }
            const abandoned_entry = log.find(
                (entry) => entry.event === "force_stone_removal_acceptance_abandoned",
            );
            if (abandoned_entry && onContainsAbandonment) {
                console.log("GameLog: Found an abandonment event");
                onContainsAbandonment(true);
            }
        });
    }, [game_id]);

    const markCoords = React.useCallback(
        (coords: string) => {
            console.log("Should be marking coords ", coords);
        },
        [goban_config],
    );

    function firstAutoScoreEntry(): boolean {
        if (firstAutoscoringEntryRendered) {
            return false;
        }
        firstAutoscoringEntryRendered = true;
        return true;
    }

    return (
        <>
            <h3>{_("Game Log")}</h3>
            {log.length > 0 ? (
                <>
                    <table className="GameLog">
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
                                    <tr
                                        ref={
                                            entry.data &&
                                            "needs_sealing" in entry.data &&
                                            firstAutoScoreEntry()
                                                ? autoscoreRef
                                                : null
                                        }
                                        key={entry.timestamp + ":" + idx}
                                        className={
                                            "entry" +
                                            (entry.data && "needs_sealing" in entry.data
                                                ? " auto-score"
                                                : "")
                                        }
                                    >
                                        <td className="timestamp">
                                            {moment(entry.timestamp).format("L LTS")}
                                        </td>
                                        <td className="event">{decodeLogEvent(entry.event)}</td>
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

// Provide a human-readable version of the event name
const decodeLogEvent = (event: string): string => {
    if (event === "force_stone_removal_acceptance_abandoned") {
        return llm_pgettext(
            "Description of an event from the server",
            "Forcing stone removal: someone abandoned scoring",
        );
    }
    return event.replace(/_/g, " ");
};

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
}): React.ReactElement | null {
    const [markedConfig, setMarkedConfig] = React.useState<GobanEngineConfig | null>(null);

    React.useEffect(() => {
        // Set up the marks config for the thumbnail
        if (event === "game_created") {
            // don't set up a thumbnail for game created
            return;
        }

        // Possibly obvious once you think about it: the "stones" field in `data` is referring to
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

    const ret: Array<React.ReactElement> = [];

    if (event === "game_created") {
        // game_created has the whole board config list of field, don't dump all those in the log.
        return null;
    }

    if (data) {
        try {
            for (const k in data) {
                if (k === "player_id") {
                    if ("needs_sealing" in data) {
                        // this is an auto-score update, make that clear.
                        ret.push(
                            <span key={k} className="field game-log-player">
                                {"(from "}
                                <Player user={data[k]} rank={false} />
                                {")"}
                            </span>,
                        );
                    } else {
                        ret.push(
                            <span key={k} className="field game-log-player">
                                <Player user={data[k]} />
                                {data.color
                                    ? data.color === "black"
                                        ? " (black)"
                                        : " (white)"
                                    : ""}
                            </span>,
                        );
                    }
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
                    // put this near the top
                    ret.unshift(
                        <span key={k} className="field">
                            {data[k] ? "stones marked dead" : "stones marked alive"}
                        </span>,
                    );
                } else if (k === "needs_sealing") {
                    // this only comes with autoscore updates
                    // put it near the top
                    ret.unshift(
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
