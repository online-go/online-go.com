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
import { LoadingButton } from "@/components/LoadingButton";
import { post } from "@/lib/requests";
import { browserHistory } from "@/lib/ogsHistory";
import {
    ChallengeDetails,
    RejectionDetails,
    rejectionDetailsToMessage,
} from "@/components/ChallengeModal";
import { notification_manager, NotificationManagerEvents } from "@/components/Notifications";
import { socket } from "@/lib/sockets";
import { sfx } from "@/lib/sfx";

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
            time_estimate: "\u223c 4\u2212" + moment.duration(6, "minutes").humanize(),
            fischer: {
                initial_time: 30,
                time_increment: 3,
                //time_estimate: "~ 4-" + moment.duration(6, "minutes").humanize(),
                time_estimate: "\u223c 4\u2212" + moment.duration(6, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "\u223c 4\u2212" + moment.duration(6, "minutes").humanize(),
            },
        },
        rapid: {
            time_estimate: "\u223c 7\u2212" + moment.duration(14, "minutes").humanize(),
            fischer: {
                initial_time: 120,
                time_increment: 5,
                time_estimate: "\u223c 7\u2212" + moment.duration(9, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 120,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 8\u2212" + moment.duration(14, "minutes").humanize(),
            },
        },
        live: {
            time_estimate: "\u223c 9\u2212" + moment.duration(17, "minutes").humanize(),
            fischer: {
                initial_time: 180,
                time_increment: 10,
                time_estimate: "\u223c 9\u2212" + moment.duration(13, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 300,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 11\u2212" + moment.duration(17, "minutes").humanize(),
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
            time_estimate: "\u223c 8\u2212" + moment.duration(10, "minutes").humanize(),
            fischer: {
                initial_time: 30,
                time_increment: 3,
                time_estimate: "\u223c 8\u2212" + moment.duration(15, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "\u223c 11\u2212" + moment.duration(17, "minutes").humanize(),
            },
        },
        rapid: {
            time_estimate: "\u223c 16\u2212" + moment.duration(25, "minutes").humanize(),
            fischer: {
                initial_time: 180,
                time_increment: 5,
                time_estimate: "\u223c 16\u2212" + moment.duration(20, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 180,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 18\u2212" + moment.duration(25, "minutes").humanize(),
            },
        },
        live: {
            time_estimate: "\u223c 20\u2212" + moment.duration(35, "minutes").humanize(),
            fischer: {
                initial_time: 300,
                time_increment: 10,
                time_estimate: "\u223c 20\u2212" + moment.duration(30, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 600,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 20\u2212" + moment.duration(35, "minutes").humanize(),
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
            time_estimate: "\u223c 10\u2212" + moment.duration(15, "minutes").humanize(),
            fischer: {
                initial_time: 30,
                time_increment: 3,
                time_estimate: "\u223c 10\u2212" + moment.duration(15, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "\u223c 11\u2212" + moment.duration(17, "minutes").humanize(),
            },
        },
        rapid: {
            time_estimate: "\u223c 21\u2212" + moment.duration(31, "minutes").humanize(),
            fischer: {
                initial_time: 300,
                time_increment: 5,
                time_estimate: "\u223c 21\u2212" + moment.duration(31, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 300,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 20\u2212" + moment.duration(35, "minutes").humanize(),
            },
        },
        live: {
            time_estimate: "\u223c 26\u2212" + moment.duration(52, "minutes").humanize(),
            fischer: {
                initial_time: 600,
                time_increment: 10,
                time_estimate: "\u223c 26\u2212" + moment.duration(52, "minutes").humanize(),
            },
            byoyomi: {
                main_time: 1200,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 28\u2212" + moment.duration(49, "minutes").humanize(),
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

export function QuickMatch(): JSX.Element {
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
    const [lower_rank_diff, setLowerRankDiff] = preferences.usePreference(
        "automatch.lower-rank-diff",
    );
    const [upper_rank_diff, setUpperRankDiff] = preferences.usePreference(
        "automatch.upper-rank-diff",
    );

    const [correspondence_spinner, setCorrespondenceSpinner] = React.useState(false);
    const [bot_spinner, setBotSpinner] = React.useState(false);
    const cancel_bot_game = React.useRef<() => void>(() => {});

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

    const anon = user.anonymous;
    const warned = user.has_active_warning_flag;

    const cancelActiveAutomatch = React.useCallback(() => {
        if (automatch_manager.active_live_automatcher) {
            automatch_manager.cancel(automatch_manager.active_live_automatcher.uuid);
        }
        refresh();
    }, [refresh]);

    const createOpenChallenge = React.useCallback(() => {
        if (data.get("user").anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

        // Open challenge
        console.log("findMatch", board_size, game_speed);

        const size_speed_options: Array<{ size: Size; speed: Speed }> = [
            { size: board_size, speed: game_speed },
        ];

        const preferences: AutomatchPreferences = {
            uuid: uuid(),
            size_speed_options,
            lower_rank_diff,
            upper_rank_diff,
            rules: {
                condition: "required",
                value: "japanese",
            },
            time_control: {
                condition: flexible ? "preferred" : "required",
                value: {
                    system: time_control_system,
                },
            },
            handicap: {
                condition: "required",
                value: handicap ? "enabled" : "disabled",
            },
        };
        console.log(preferences);

        automatch_manager.findMatch(preferences);
        refresh();

        if (game_speed === "correspondence") {
            setCorrespondenceSpinner(true);
        }
    }, [
        board_size,
        game_speed,
        opponent,
        lower_rank_diff,
        upper_rank_diff,
        handicap,
        flexible,
        time_control_system,
        refresh,
        automatch_manager,
        setCorrespondenceSpinner,
    ]);

    const playComputer = React.useCallback(() => {
        const challenge: ChallengeDetails = {
            initialized: false,
            min_ranking: -99,
            max_ranking: 99,
            challenger_color: "automatic",
            rengo_auto_start: 0,
            game: {
                name: _("Quick Match"),
                rules: "chinese",
                ranked: true,
                width: board_size === "9x9" ? 9 : board_size === "13x13" ? 13 : 19,
                height: board_size === "9x9" ? 9 : board_size === "13x13" ? 13 : 19,
                handicap: handicap ? -1 : 0,
                komi_auto: "automatic",
                komi: 0,
                disable_analysis: false,
                initial_state: null,
                private: false,
                rengo: false,
                rengo_casual_mode: false,
                pause_on_weekends: true,
                time_control: time_control_system,
                time_control_parameters:
                    time_control_system === "fischer"
                        ? {
                              system: "fischer",
                              speed: game_speed,
                              initial_time:
                                  SPEED_OPTIONS[board_size as any][game_speed].fischer.initial_time,
                              time_increment:
                                  SPEED_OPTIONS[board_size as any][game_speed].fischer
                                      .time_increment,
                              max_time:
                                  SPEED_OPTIONS[board_size as any][game_speed].fischer
                                      .initial_time * 10,
                              pause_on_weekends: true,
                          }
                        : {
                              system: "byoyomi",
                              speed: game_speed,
                              main_time:
                                  SPEED_OPTIONS[board_size as any][game_speed].byoyomi!.main_time,
                              periods:
                                  SPEED_OPTIONS[board_size as any][game_speed].byoyomi!.periods,
                              period_time:
                                  SPEED_OPTIONS[board_size as any][game_speed].byoyomi!.period_time,
                              periods_min:
                                  SPEED_OPTIONS[board_size as any][game_speed].byoyomi!.periods,
                              periods_max:
                                  SPEED_OPTIONS[board_size as any][game_speed].byoyomi!.periods,
                              pause_on_weekends: true,
                          },
            },
        };

        setBotSpinner(true);
        post(`players/${selected_bot}/challenge`, challenge)
            .then((res) => {
                const challenge_id = res.challenge;

                const game_id = typeof res.game === "object" ? res.game.id : res.game;
                let keepalive_interval: ReturnType<typeof setInterval> | undefined;

                const checkForReject = (
                    notification: NotificationManagerEvents["notification"],
                ) => {
                    console.log("challenge rejection check notification:", notification);
                    if (notification.type === "gameOfferRejected") {
                        /* non checked delete to purge old notifications that
                         * could be around after browser refreshes, connection
                         * drops, etc. */
                        notification_manager.deleteNotification(notification);
                        if (notification.game_id === game_id) {
                            onRejected(notification.message, notification.rejection_details);
                        }
                    }
                };

                const active_check = () => {
                    keepalive_interval = setInterval(() => {
                        socket.send("challenge/keepalive", {
                            challenge_id: challenge_id,
                            game_id: game_id,
                        });
                    }, 1000);
                    socket.send("game/connect", { game_id: game_id });
                    socket.on(`game/${game_id}/gamedata`, onGamedata);
                };

                const onGamedata = () => {
                    off();
                    alert.close();
                    //sfx.play("game_accepted");
                    sfx.play("game_started", 3000);
                    //sfx.play("setup-bowl");
                    browserHistory.push(`/game/${game_id}`);
                };

                const onRejected = (message?: string, details?: RejectionDetails) => {
                    off();
                    alert.close();
                    void alert.fire({
                        text:
                            (details && rejectionDetailsToMessage(details)) ||
                            message ||
                            _("Game offer was rejected"),
                    });
                };

                const off = () => {
                    clearTimeout(keepalive_interval);
                    socket.send("game/disconnect", { game_id: game_id });
                    socket.off(`game/${game_id}/gamedata`, onGamedata);
                    //socket.off(`game/${game_id}/rejected`, onRejected);
                    notification_manager.event_emitter.off("notification", checkForReject);
                    cancel_bot_game.current = () => {};
                    setBotSpinner(false);
                };

                cancel_bot_game.current = off;

                notification_manager.event_emitter.on("notification", checkForReject);
                active_check();
            })
            .catch((error) => {
                console.error("Error creating challenge:", error);
            });
    }, [selected_bot, board_size, handicap, game_speed, time_control_system, refresh]);

    const play = React.useCallback(() => {
        if (data.get("user").anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

        if (opponent === "bot") {
            playComputer();
        } else {
            createOpenChallenge();
        }
    }, [createOpenChallenge, playComputer]);

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

    const search_active =
        !!automatch_manager.active_live_automatcher || correspondence_spinner || bot_spinner;

    //  Construction of the pane we need to show...
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
                            disabled={search_active}
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
                        <span
                            className="toggle-container"
                            title={pgettext(
                                "Tooltip title for the flexible time setting toggle on the Play page.",
                                "The Flexible time setting allows you to choose your preferred time setting, but if there is a game with a similar expected duration, you can be matched with that game instead.",
                            )}
                        >
                            <label
                                onClick={() => {
                                    if (!search_active) {
                                        setFlexible(!flexible);
                                    }
                                }}
                                className="toggle-label"
                            >
                                {pgettext(
                                    "Option to allow the user to be flexible on which time setting to use",
                                    "Flexible",
                                )}
                            </label>

                            <Toggle
                                checked={flexible}
                                disabled={search_active}
                                onChange={setFlexible}
                            />
                        </span>
                    </div>
                </div>

                <div className="speed-options">
                    {(["blitz", "rapid", "live", "correspondence"] as JGOFTimeControlSpeed[]).map(
                        (speed) => {
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
                                        <span className="description">
                                            {opt.fischer.time_estimate || opt.time_estimate}
                                        </span>
                                        {opt.byoyomi?.time_estimate && (
                                            <span className="description">
                                                {opt.byoyomi.time_estimate}
                                            </span>
                                        )}
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
                                            disabled={search_active}
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
                                                    disabled={search_active}
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
                        },
                    )}
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
                            (opponent === "human" ? "active" : "") +
                            (search_active ? " disabled" : "")
                        }
                        onClick={() => {
                            if (search_active) {
                                return;
                            }
                            setOpponent("human");
                        }}
                    >
                        <div className="opponent-title">
                            {pgettext("Play a random human opponent", "Random Human")}
                        </div>
                        <div className="opponent-rank-range">
                            <select
                                value={lower_rank_diff}
                                onChange={(ev) => setLowerRankDiff(parseInt(ev.target.value))}
                                disabled={search_active}
                            >
                                {[9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((v) => (
                                    <option key={v} value={v}>
                                        {rankString(user.ranking - v)}
                                    </option>
                                ))}
                            </select>
                            {" - "}
                            <select
                                value={upper_rank_diff}
                                onChange={(ev) => setUpperRankDiff(parseInt(ev.target.value))}
                                disabled={search_active}
                            >
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
                            "opponent-option-container " +
                            (opponent === "bot" ? "active" : "") +
                            (search_active ? " disabled" : "")
                        }
                        onClick={() => {
                            if (search_active) {
                                return;
                            }
                            setOpponent("bot");
                        }}
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
                                disabled={search_active}
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
                    <span
                        className="toggle-container"
                        title={pgettext(
                            "Tooltip title for the Difficulty Balancing toggle on the Play page.",
                            "When enabled, the strength of your opponent will determine how many extra black stones and komi points are used in the game to balance the difficulty of the game.",
                        )}
                    >
                        <label
                            onClick={() => {
                                if (!search_active) {
                                    setHandicap(!handicap);
                                }
                            }}
                            className="toggle-label"
                        >
                            {pgettext("Handicap abbreviation", "HC")}
                        </label>
                        <Toggle
                            checked={handicap}
                            disabled={search_active}
                            onChange={setHandicap}
                        />
                    </span>
                </div>

                {automatch_manager.active_live_automatcher && (
                    <div>
                        <div className="finding-game-container">
                            <span>{_("Finding you a game...")}</span>

                            <LoadingButton
                                className="danger sm"
                                loading={true}
                                onClick={cancelActiveAutomatch}
                            >
                                {pgettext("Cancel automatch", "Cancel search")}
                            </LoadingButton>
                        </div>
                    </div>
                )}

                {bot_spinner && (
                    <div>
                        <div className="finding-game-container">
                            <LoadingButton
                                className="danger sm"
                                loading={true}
                                onClick={cancel_bot_game.current}
                            >
                                {pgettext("Cancel automatch", "Cancel search")}
                            </LoadingButton>
                        </div>
                    </div>
                )}

                {correspondence_spinner && (
                    <div>
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
                )}
                {!search_active && (
                    <button
                        className="primary play-button"
                        onClick={play}
                        disabled={anon || warned}
                    >
                        {_("Play")}
                    </button>
                )}
            </div>
        </div>
    );
}
