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
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import moment from "moment";

import {
    AutomatchPreferences,
    JGOFTimeControlSpeed,
    shortDurationString,
    Size,
    Speed,
} from "goban";
import { _, pgettext } from "@/lib/translate";
import { automatch_manager } from "@/lib/automatch_manager";
import { bots_list } from "@/lib/bots";
import { alert } from "@/lib/swal_config";
import { useRefresh, useUser } from "@/lib/hooks";
import { Toggle } from "@/components/Toggle";
import { MiniGoban } from "@/components/MiniGoban";
import { getUserRating, rankString } from "@/lib/rank_utils";
import { uuid } from "@/lib/misc";
import { getAutomatchSettings } from "@/components/AutomatchSettings";

moment.relativeTimeThreshold("m", 56);
export interface SelectOption {
    break?: JSX.Element;
    value: string;
    label: string;
}

interface GameSpeedOptions {
    [size: string]: {
        [speed: string]: {
            time_estimate: string;
            fischer: {
                initial_time: number;
                time_increment: number;
                time_estimate: string;
            };
            byoyomi?: {
                main_time: number;
                periods: number;
                period_time: number;
                time_estimate: string;
            };
        };
    };
}

const SPEED_OPTIONS: GameSpeedOptions = {
    "9x9": {
        blitz: {
            time_estimate: "~ 4-" + moment.duration(6, "minutes").humanize(),
            fischer: {
                initial_time: 30,
                time_increment: 3,
                time_estimate: "~ 4-" + moment.duration(6, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "~ 4-" + moment.duration(6, "minutes").humanize(),
            },
        },
        rapid: {
            time_estimate: "~ 7-" + moment.duration(14, "minutes").humanize(),
            fischer: {
                initial_time: 120,
                time_increment: 5,
                time_estimate: "~ 7-" + moment.duration(9, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 120,
                periods: 5,
                period_time: 30,
                time_estimate: "~ 8-" + moment.duration(14, "minutes").humanize(),
            },
        },
        live: {
            time_estimate: "~ 9-" + moment.duration(17, "minutes").humanize(),
            fischer: {
                initial_time: 180,
                time_increment: 10,
                time_estimate: "~ 9-" + moment.duration(13, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 300,
                periods: 5,
                period_time: 30,
                time_estimate: "~ 11-" + moment.duration(17, "minutes").humanize(),
            },
        },
        correspondence: {
            time_estimate: pgettext("Game speed: multi-day games", "Daily Correspondence"),
            fischer: {
                initial_time: 86400 * 3,
                time_increment: 86400,
                time_estimate: "",
            },
        },
    },
    "13x13": {
        blitz: {
            time_estimate: "~ 8-" + moment.duration(10, "minutes").humanize(),
            fischer: {
                initial_time: 30,
                time_increment: 3,
                time_estimate: "~ -" + moment.duration(15, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "~ 11-" + moment.duration(17, "minutes").humanize(),
            },
        },
        rapid: {
            time_estimate: "~ 16-" + moment.duration(25, "minutes").humanize(),
            fischer: {
                initial_time: 180,
                time_increment: 5,
                time_estimate: "~ 16-" + moment.duration(20, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 180,
                periods: 5,
                period_time: 30,
                time_estimate: "~ 18-" + moment.duration(25, "minutes").humanize(),
            },
        },
        live: {
            time_estimate: "~ 20-" + moment.duration(35, "minutes").humanize(),
            fischer: {
                initial_time: 300,
                time_increment: 10,
                time_estimate: "~ 20-" + moment.duration(30, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 600,
                periods: 5,
                period_time: 30,
                time_estimate: "~ 20-" + moment.duration(35, "minutes").humanize(),
            },
        },
        correspondence: {
            time_estimate: pgettext("Game speed: multi-day games", "Daily Correspondence"),
            fischer: {
                initial_time: 86400 * 3,
                time_increment: 86400,
                time_estimate: "",
            },
        },
    },
    "19x19": {
        blitz: {
            time_estimate: "~ 10-" + moment.duration(15, "minutes").humanize(),
            fischer: {
                initial_time: 30,
                time_increment: 3,
                time_estimate: "~ 10-" + moment.duration(15, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "~ 11-" + moment.duration(17, "minutes").humanize(),
            },
        },
        rapid: {
            time_estimate: "~ 21-" + moment.duration(31, "minutes").humanize(),
            fischer: {
                initial_time: 300,
                time_increment: 5,
                time_estimate: "~ 21-" + moment.duration(31, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 300,
                periods: 5,
                period_time: 30,
                time_estimate: "~ 20-" + moment.duration(35, "minutes").humanize(),
            },
        },
        live: {
            time_estimate: "~ 26-" + moment.duration(52, "minutes").humanize(),
            fischer: {
                initial_time: 600,
                time_increment: 10,
                time_estimate: "~ 26-" + moment.duration(52, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 1200,
                periods: 5,
                period_time: 30,
                time_estimate: "~ 28-" + moment.duration(49, "minutes").humanize(),
            },
        },
        correspondence: {
            time_estimate: pgettext("Game speed: multi-day games", "Daily Correspondence"),
            fischer: {
                initial_time: 86400 * 3,
                time_increment: 86400,
                time_estimate: "",
            },
        },
    },
};

/*
function usePriorityValuePreference(
    key: "automatch.blitz" | "automatch.rapid" | "automatch.live" | "automatch.correspondence",
): [
    { priority: PreferRequireIndifferent; value: string },
    (priority: PreferRequireIndifferent, value: string) => void,
] {
    const [pref, setPref] = preferences.usePreference(key);
    return [pref, (priority, value) => setPref({ priority, value })];
}
*/

export function QuickMatch(): JSX.Element {
    //const ctx = React.useContext(PlayContext);
    const user = useUser();
    const refresh = useRefresh();
    const [board_size, setBoardSize] = preferences.usePreference("automatch.size");
    const [game_speed, setGameSpeed] = preferences.usePreference("automatch.speed");
    const [flexible, setFlexible] = preferences.usePreference("automatch.speed-flexibility");
    const [time_control_system, setTimeControlSystem] =
        preferences.usePreference("automatch.time-control");
    const [opponent, setOpponent] = preferences.usePreference("automatch.opponent");
    const [selected_bot, setSelectedBot] = preferences.usePreference("automatch.bot");
    const [handicap, setHandicap] = preferences.usePreference("automatch.handicap");

    /*
    const [automatch_size_options, setAutomatchSizeOptions] = useData("automatch.size_options", [
        "9x9",
        "13x13",
        "19x19",
    ]);
    */
    const [correspondence_spinner, setCorrespondenceSpinner] = React.useState(false);

    React.useEffect(() => {
        automatch_manager.on("entry", refresh);
        automatch_manager.on("start", refresh);
        automatch_manager.on("cancel", refresh);

        return () => {
            automatch_manager.off("entry", refresh);
            automatch_manager.off("start", refresh);
            automatch_manager.off("cancel", refresh);
        };
    }, []);

    /*
    const size_enabled = (size: Size) => {
        return automatch_size_options.indexOf(size) >= 0;
    };
    */

    /*
    const own_live_rengo_challenge = props.own_rengo_challenges_pending.find((c) =>
        isLiveGame(c.time_control_parameters, c.width, c.height),
    );
    const joined_live_rengo_challenge = props.joined_rengo_challenges_pending.find((c) =>
        isLiveGame(c.time_control_parameters, c.width, c.height),
    );
    */

    //const rengo_challenge_to_show = own_live_rengo_challenge || joined_live_rengo_challenge;

    const anon = user.anonymous;
    const warned = user.has_active_warning_flag;

    const cancelActiveAutomatch = React.useCallback(() => {
        if (automatch_manager.active_live_automatcher) {
            automatch_manager.cancel(automatch_manager.active_live_automatcher.uuid);
        }
        refresh();
    }, [refresh]);

    /*
    const cancelOwnChallenges = React.useCallback(
        (challenge_list: Challenge[]) => {
            challenge_list.forEach((c) => {
                if (c.user_challenge) {
                    ctx.cancelOpenChallenge(c);
                }
            });
        },
        [ctx?.cancelOpenChallenge],
    );
    */

    const play = React.useCallback(() => {
        if (data.get("user").anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

        if (opponent === "bot") {
            // Bot game
        } else {
            // Open challenge
            console.log("findMatch", board_size, game_speed);

            const size_speed_options: Array<{ size: Size; speed: Speed }> = [
                { size: board_size, speed: game_speed },
            ];

            const settings = getAutomatchSettings(game_speed);
            const preferences: AutomatchPreferences = {
                uuid: uuid(),
                size_speed_options,
                lower_rank_diff: settings.lower_rank_diff,
                upper_rank_diff: settings.upper_rank_diff,
                rules: {
                    condition: settings.rules.condition,
                    value: settings.rules.value,
                },
                time_control: {
                    condition: settings.time_control.condition,
                    value: settings.time_control.value,
                },
                handicap: {
                    condition: settings.handicap.condition,
                    value: settings.handicap.value,
                },
            };
            preferences.uuid = uuid();
            automatch_manager.findMatch(preferences);
            refresh();

            if (game_speed === "correspondence") {
                setCorrespondenceSpinner(true);
            }
        }
    }, [board_size, game_speed]);

    const dismissCorrespondenceSpinner = React.useCallback(() => {
        setCorrespondenceSpinner(false);
    }, []);

    /*
    const newComputerGame = React.useCallback(() => {
        if (bot_count() === 0) {
            void alert.fire(_("Sorry, all bots seem to be offline, please try again later."));
            return;
        }
        challengeComputer();
    }, []);
    */

    //  Construction of the pane we need to show...
    if (automatch_manager.active_live_automatcher) {
        return (
            <div id="FindGame">
                <div className="automatch-header">{_("Finding you a game...")}</div>
                <div className="automatch-row-container">
                    <div className="spinner">
                        <div className="double-bounce1"></div>
                        <div className="double-bounce2"></div>
                    </div>
                </div>
                <div className="automatch-settings">
                    <button className="danger sm" onClick={cancelActiveAutomatch}>
                        {pgettext("Cancel automatch", "Cancel")}
                    </button>
                </div>
            </div>
        );
    } else if (correspondence_spinner) {
        return (
            <div id="FindGame">
                <div className="automatch-header">{_("Finding you a game...")}</div>
                <div className="automatch-settings-corr">
                    {_(
                        'This can take several minutes. You will be notified when your match has been found. To view or cancel your automatch requests, please see the list below labeled "Your Automatch Requests".',
                    )}
                </div>
                <div className="automatch-row-container">
                    <button className="primary" onClick={dismissCorrespondenceSpinner}>
                        {_(
                            pgettext(
                                "Dismiss the 'finding correspondence automatch' message",
                                "Got it",
                            ),
                        )}
                    </button>
                </div>
            </div>
        );
    } else {
        return (
            <div id="FindGame">
                {/* Board Size */}
                <div className="GameOption-cell">
                    <div className="GameOption">
                        <span>{_("Board Size")}</span>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        {(["9x9", "13x13", "19x19"] as Size[]).map((s) => (
                            <button
                                className={"btn" + (s === board_size ? " active" : "")}
                                key={s}
                                onClick={() => {
                                    setBoardSize(s);
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <MiniGoban
                        width={parseInt(board_size)}
                        height={parseInt(board_size)}
                        labels_positioning="all"
                        noLink={true}
                    />
                </div>

                {/* Game Speed */}
                <div className="GameOption-cell">
                    <div className="GameOption">
                        <span>{_("Game Speed")}</span>
                        <div className="flexible-setting">
                            {pgettext(
                                "Option to allow the user to be flexible on which time setting to use",
                                "Flexible",
                            )}{" "}
                            <Toggle checked={flexible} onChange={setFlexible} />
                        </div>
                    </div>

                    <div className="speed-options">
                        {(
                            ["blitz", "rapid", "live", "correspondence"] as JGOFTimeControlSpeed[]
                        ).map((speed) => {
                            const opt = SPEED_OPTIONS[board_size as any][speed];

                            return (
                                <div
                                    className={
                                        "game-speed-option-container" +
                                        (game_speed === speed ? " active" : "")
                                    }
                                    onClick={() => setGameSpeed(speed)}
                                    key={speed}
                                >
                                    <div className="game-speed-title">
                                        <span className="description">{opt.time_estimate}</span>
                                    </div>
                                    <div className="game-speed-buttons">
                                        <button
                                            className={
                                                "time-control-button" +
                                                (game_speed === speed &&
                                                time_control_system === "fischer"
                                                    ? " active"
                                                    : "")
                                            }
                                            onClick={() => {
                                                setGameSpeed(speed);
                                                setTimeControlSystem("fischer");
                                            }}
                                        >
                                            {shortDurationString(opt.fischer.initial_time)}
                                            {" + "}
                                            {shortDurationString(opt.fischer.time_increment)}
                                        </button>
                                        {opt.byoyomi && (
                                            <>
                                                {flexible && game_speed === speed ? (
                                                    <span className="or">
                                                        {pgettext(
                                                            "Used on the play page to indicate that either time control preference may be used (5m+5s _or_ 5m+5x30s)",
                                                            "or",
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="or">&nbsp;&nbsp;</span>
                                                )}
                                                <button
                                                    className={
                                                        "time-control-button" +
                                                        (game_speed === speed &&
                                                        time_control_system === "byoyomi"
                                                            ? " active"
                                                            : "")
                                                    }
                                                    onClick={() => {
                                                        setGameSpeed(speed);
                                                        setTimeControlSystem("byoyomi");
                                                    }}
                                                >
                                                    {shortDurationString(opt.byoyomi.main_time)}
                                                    {" + "}
                                                    {opt.byoyomi.periods}x
                                                    {shortDurationString(
                                                        opt.byoyomi.period_time,
                                                    ).trim()}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Opponent */}
                <div className="GameOption-cell">
                    <div className="GameOption">
                        <span>{_("Opponent")}</span>
                    </div>

                    <div className="opponent-options">
                        <div
                            className={
                                "opponent-option-container " +
                                (opponent === "human" ? "active" : "")
                            }
                            onClick={() => setOpponent("human")}
                        >
                            <div className="opponent-title">
                                {pgettext("Play a random human opponent", "Random Human")}
                            </div>
                            <div className="opponent-rank-range">
                                <select>
                                    {[-9, -8, -7, -6, -5, -4, -3, -2, -1, 0].map((v) => (
                                        <option key={v} value={v}>
                                            {rankString(user.ranking + v)}
                                        </option>
                                    ))}
                                </select>
                                {" - "}
                                <select>
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => (
                                        <option key={v} value={v}>
                                            {rankString(user.ranking + v)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div
                            className={
                                "opponent-option-container " + (opponent === "bot" ? "active" : "")
                            }
                            onClick={() => setOpponent("bot")}
                        >
                            <div className="opponent-title">
                                {pgettext("Play a computer opponent", "Computer")}
                            </div>
                            <div className="computer-select">
                                <select
                                    id="challenge-ai"
                                    value={selected_bot}
                                    onChange={(ev) => setSelectedBot(parseInt(ev.target.value))}
                                    required={true}
                                >
                                    {bots_list().map((bot, idx) => (
                                        <option key={idx} value={bot.id}>
                                            {bot.username} ({rankString(getUserRating(bot).rank)})
                                        </option>
                                    ))}
                                </select>
                                &nbsp;
                                <a
                                    href={`/user/view/${selected_bot}`}
                                    target="_blank"
                                    title={_("Selected AI profile")}
                                >
                                    <i className="fa fa-external-link" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Balancing and Play Button */}
                <div className="GameOption-cell">
                    <div className="GameOption">
                        <span>{_("Difficulty Balancing")}</span>
                        <Toggle checked={handicap} onChange={setHandicap} />
                    </div>

                    <button
                        className="primary play-button"
                        onClick={play}
                        disabled={anon || warned}
                    >
                        {_("Play")}
                    </button>
                </div>
            </div>
        );
    }
}

/*
                <div className="automatch-header">
                    <div>{_("Automatch finder")}</div>
                    <div className="btn-group">
                        <button
                            className={size_enabled("9x9") ? "primary sm" : "sm"}
                            onClick={() => toggleSize("9x9")}
                        >
                            9x9
                        </button>
                        <button
                            className={size_enabled("13x13") ? "primary sm" : "sm"}
                            onClick={() => toggleSize("13x13")}
                        >
                            13x13
                        </button>
                        <button
                            className={size_enabled("19x19") ? "primary sm" : "sm"}
                            onClick={() => toggleSize("19x19")}
                        >
                            19x19
                        </button>
                    </div>
                    <div className="automatch-settings">
                        <span
                            className="automatch-settings-link fake-link"
                            onClick={openAutomatchSettings}
                        >
                            <i className="fa fa-gear" />
                            {_("Settings ")}
                        </span>
                    </div>
                </div>
                <div className="automatch-row-container">
                    <div className="automatch-row">
                        <button
                            className="primary"
                            onClick={() => findMatch("blitz")}
                            disabled={anon || warned}
                        >
                            <div className="play-button-text-root">
                                <i className="fa fa-bolt" /> {_("Blitz")}
                                <span className="time-per-move">
                                    {pgettext("Automatch average time per move", "~10s per move")}
                                </span>
                            </div>
                        </button>
                        <button
                            className="primary"
                            onClick={() => findMatch("live")}
                            disabled={anon || warned}
                        >
                            <div className="play-button-text-root">
                                <i className="fa fa-clock-o" /> {_("Normal")}
                                <span className="time-per-move">
                                    {pgettext("Automatch average time per move", "~30s per move")}
                                </span>
                            </div>
                        </button>
                    </div>
                    <div className="automatch-row">
                        <button
                            className="primary"
                            onClick={newComputerGame}
                            disabled={anon || warned}
                        >
                            <div className="play-button-text-root">
                                <i className="fa fa-desktop" /> {_("Computer")}
                                <span className="time-per-move"></span>
                            </div>
                        </button>
                        <button
                            className="primary"
                            onClick={() => findMatch("correspondence")}
                            disabled={anon || warned}
                        >
                            <div className="play-button-text-root">
                                <span>
                                    <i className="ogs-turtle" /> {_("Correspondence")}
                                </span>
                                <span className="time-per-move">
                                    {pgettext("Automatch average time per move", "~1 day per move")}
                                </span>
                            </div>
                        </button>
                    </div>
                    <div className="custom-game-header">
                        <div>{_("Custom Game")}</div>
                    </div>
                    <div className="custom-game-row">
                        <button
                            className="primary"
                            onClick={newCustomGame}
                            disabled={anon || warned}
                        >
                            <i className="fa fa-cog" /> {_("Create")}
                        </button>
                    </div>
                </div>
*/

/*
function Caret({ up }: { up: boolean }): JSX.Element {
    return (
        <span className="DownCaret">
            {up ? <i className="fa fa-caret-up" /> : <i className="fa fa-caret-down" />}
        </span>
    );
}

*/
