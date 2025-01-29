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
    JGOFTimeControl,
    JGOFTimeControlSpeed,
    shortDurationString,
    Size,
    Speed,
} from "goban";
import { _, llm_pgettext, pgettext } from "@/lib/translate";
import { automatch_manager } from "@/lib/automatch_manager";
import { Bot, bot_event_emitter, bots_list, getAcceptableTimeSetting } from "@/lib/bots";
import { alert } from "@/lib/swal_config";
import { useRefresh, useUser } from "@/lib/hooks";
//import { Toggle } from "@/components/Toggle";
import { MiniGoban } from "@/components/MiniGoban";
import { uuid } from "@/lib/misc";
import { LoadingButton } from "@/components/LoadingButton";
import { challengeComputer, ChallengeModalConfig } from "@/components/ChallengeModal";
import { socket } from "@/lib/sockets";
import { Link } from "react-router-dom";
import Select, { CSSObjectWithLabel, GroupBase, StylesConfig } from "react-select";
import { SPEED_OPTIONS } from "./SPEED_OPTIONS";
import { useHaveActiveGameSearch } from "./hooks";
import { openPlayPageHelp } from "./PlayPageHelp";
import { notification_manager, Notification } from "@/components/Notifications/NotificationManager";

moment.relativeTimeThreshold("m", 56);
export interface SelectOption {
    break?: React.ReactElement;
    value: string;
    label: string;
}

interface OptionWithDescription {
    value: string;
    label: string;
    description: string;
}

const game_clock_options: OptionWithDescription[] = [
    {
        value: "exact",
        label: _("Exact"),
        description: pgettext("Game Clock option description for Exact", "Pick one time setting"),
    },
    {
        value: "flexible",
        label: _("Flexible"),
        description: pgettext(
            "Game Clock option description for Flexible",
            "Prefer one time setting, but accept the other similarly paced time setting",
        ),
    },
    {
        value: "multiple",
        label: _("Multiple"),
        description: pgettext(
            "Game Clock option description for being able to choose between multiple time and board size settings",
            "Pick multiple acceptable time and board size settings",
        ),
    },
];

const handicap_options: OptionWithDescription[] = [
    {
        value: "enabled",
        label: pgettext(
            "Matchmaking handicap option: require handicaps for games between players with different ranks",
            "Required",
        ),
        description: _("Require handicaps between players with different ranks"),
    },
    {
        value: "standard",
        label: pgettext(
            "Matchmaking handicap option: standard, prefer handicaps but allow even games",
            "Standard",
        ),
        description: _("Use handicaps by default, but accept games with handicaps disabled"),
    },
    {
        value: "disabled",
        label: pgettext("Matchmaking handicap option: disable handicaps", "Disabled"),
        description: _("Disable handicaps"),
    },
];

const RenderOptionWithDescription = (props: {
    data: OptionWithDescription;
    innerProps: any;
    innerRef: any;
    isFocused: boolean;
    isSelected: boolean;
}) => {
    const opt = props.data;
    return (
        <div
            ref={props.innerRef}
            {...props.innerProps}
            className={
                "option" +
                (props.isFocused ? " focused" : "") +
                (props.isSelected ? " selected" : "")
            }
        >
            <div className="option-label">{opt.label}</div>
            <div className="option-description">{opt.description}</div>
        </div>
    );
};

const select_styles = {
    menu: ({ ...css }) => ({
        ...css,
        width: "20rem",
    }),
    groupHeading: (base: CSSObjectWithLabel) => ({
        ...base,
        // ...it's not perfect: there's a small gap at the top where we see
        // the numbers scroll past.
        color: "var(--select-header-fg)",
        backgroundColor: "var(--select-header-bg)",
        fontSize: "0.9rem",
        fontStyle: "italic",
        padding: "0.2rem",
        position: "sticky",
        top: 0,
        margin: "0rem 0rem 0.1rem 0rem",
        // This is disguising the gap at the top
        boxShadow: "0px -5px 20px 10px var(--select-header-bg)",
    }),
};

export function QuickMatch(): React.ReactElement {
    const user = useUser();
    const refresh = useRefresh();
    const available_human_matches_list = React.useRef<{ [uuid: string]: any }>({});
    window.available_human_matches_list = available_human_matches_list.current;
    const [recent_matches, setRecentMatches] = React.useState<{
        [size: string]: { [speed: string]: { [system: string]: number } };
    }>({});
    const [recent_matches_count, setRecentMatchesCount] = React.useState<{
        [size: string]: number;
    }>({});
    const [board_size, setBoardSize] = preferences.usePreference("automatch.size");
    const [game_speed, setGameSpeed] = preferences.usePreference("automatch.speed");
    const [handicaps, setHandicaps] = preferences.usePreference("automatch.handicaps");
    const [time_control_system, setTimeControlSystem] =
        preferences.usePreference("automatch.time-control");
    const [opponent, setOpponent] = preferences.usePreference("automatch.opponent");
    const [lower_rank_diff, setLowerRankDiff] = preferences.usePreference(
        "automatch.lower-rank-diff",
    );
    const [upper_rank_diff, setUpperRankDiff] = preferences.usePreference(
        "automatch.upper-rank-diff",
    );

    const [correspondence_spinner, setCorrespondenceSpinner] = React.useState(false);
    const [game_clock, setGameClock] = preferences.usePreference("automatch.game-clock");
    const have_active_game_search = useHaveActiveGameSearch();

    const [multiple_sizes, setMultipleSizes] = preferences.usePreference(
        "automatch.multiple-sizes",
    );
    const [multiple_speeds, setMultipleSpeeds] = preferences.usePreference(
        "automatch.multiple-speeds",
    );

    React.useEffect(() => {
        automatch_manager.on("entry", refresh);
        automatch_manager.on("start", refresh);
        automatch_manager.on("cancel", refresh);
        bot_event_emitter.on("updated", refresh);

        function onGameStarted(game?: Notification) {
            console.log("game-started", game);
            if (game?.speed !== "correspondence" && automatch_manager.active_live_automatcher) {
                automatch_manager.cancel(automatch_manager.active_live_automatcher?.uuid);
            }
        }

        notification_manager.event_emitter.on("game-started", onGameStarted);

        return () => {
            automatch_manager.off("entry", refresh);
            automatch_manager.off("start", refresh);
            automatch_manager.off("cancel", refresh);
            bot_event_emitter.off("updated", refresh);
            notification_manager.event_emitter.off("game-started", onGameStarted);
        };
    }, []);

    React.useEffect(() => {
        socket.send("automatch/available/subscribe", undefined);

        function onAdd(entry: any) {
            available_human_matches_list.current[entry.uuid] = entry;
            refresh();
        }

        function onRemove(uuid: string) {
            delete available_human_matches_list.current[uuid];
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

    React.useEffect(() => {
        const ranks = [];
        for (let i = user.ranking - lower_rank_diff; i <= user.ranking + upper_rank_diff; i++) {
            ranks.push(i);
        }
        fetch(`/termination-api/automatch-stats?ranks=${ranks.join(",")}`)
            .then((obj) => obj.json())
            .then((obj) => {
                const recent_matches_count: { [size: string]: number } = {};

                for (const size in obj) {
                    recent_matches_count[size] = 0;
                    for (const speed in obj[size]) {
                        for (const system in obj[size][speed]) {
                            recent_matches_count[size] += obj[size][speed][system];
                        }
                    }
                }

                setRecentMatches(obj);
                setRecentMatchesCount(recent_matches_count);
            })
            .catch((err) => console.error(err));
    }, [user.ranking, lower_rank_diff, upper_rank_diff]);

    const anon = user.anonymous;
    const warned = user.has_active_warning_flag;

    const cancelActiveAutomatch = React.useCallback(() => {
        if (automatch_manager.active_live_automatcher) {
            automatch_manager.cancel(automatch_manager.active_live_automatcher.uuid);
        }
        refresh();
    }, [refresh]);

    const doAutomatch = React.useCallback(() => {
        if (data.get("user").anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

        // Open challenge
        console.log("findMatch", board_size, game_speed);

        const size_speed_options: Array<{
            size: Size;
            speed: Speed;
            system: "fischer" | "byoyomi";
        }> = [];

        if (game_clock === "exact" || game_clock === "flexible") {
            size_speed_options.push({
                size: board_size,
                speed: game_speed,
                system: time_control_system,
            });
            if (game_clock === "flexible" && game_speed !== "correspondence") {
                size_speed_options.push({
                    size: board_size,
                    speed: game_speed,
                    system: time_control_system === "fischer" ? "byoyomi" : "fischer",
                });
            }
        } else {
            for (const size in multiple_sizes) {
                if (multiple_sizes[size as keyof typeof multiple_sizes]) {
                    for (const speed_system in multiple_speeds) {
                        if (multiple_speeds[speed_system as keyof typeof multiple_speeds]) {
                            const [speed, system] = speed_system.split("-");
                            size_speed_options.push({ size, speed, system } as any);
                        }
                    }
                }
            }

            // shuffle the options so we aren't biasing towards the same settings all the time
            size_speed_options.sort(() => Math.random() - 0.5);
        }

        const preferences: AutomatchPreferences = {
            uuid: uuid(),
            size_speed_options,
            lower_rank_diff,
            upper_rank_diff,
            rules: {
                condition: "required",
                value: "japanese",
            },
            handicap: {
                condition: handicaps === "standard" ? "preferred" : "required",
                value: handicaps === "disabled" ? "disabled" : "enabled",
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
        handicaps,
        game_clock,
        time_control_system,
        refresh,
        automatch_manager,
        setCorrespondenceSpinner,
        multiple_sizes,
        multiple_speeds,
    ]);

    const time_control: JGOFTimeControl =
        time_control_system === "fischer"
            ? {
                  system: "fischer",
                  speed: game_speed,
                  initial_time: SPEED_OPTIONS[board_size][game_speed].fischer.initial_time,
                  time_increment: SPEED_OPTIONS[board_size][game_speed].fischer.time_increment,
                  max_time: SPEED_OPTIONS[board_size][game_speed].fischer.initial_time * 10,
                  pause_on_weekends: false,
              }
            : {
                  system: "byoyomi",
                  speed: game_speed,
                  main_time: SPEED_OPTIONS[board_size][game_speed].byoyomi?.main_time || 0,
                  period_time: SPEED_OPTIONS[board_size][game_speed].byoyomi?.period_time || 0,
                  periods: SPEED_OPTIONS[board_size][game_speed].byoyomi?.periods || 0,
                  pause_on_weekends: false,
              };

    const playComputerX = React.useCallback(() => {
        // Try to guess whether the player wants a ranked game or not by looking at
        // the past challenges.
        let ranked = data.get(`challenge.challenge.${game_speed}`)?.game?.ranked;
        if (ranked === undefined) {
            ranked =
                data.get(`challenge.challenge.blitz`)?.game?.ranked ??
                data.get(`challenge.challenge.rapid`)?.game?.ranked ??
                data.get(`challenge.challenge.live`)?.game?.ranked ??
                true;
        }

        const settings: ChallengeModalConfig = {
            challenge: {
                challenger_color: "automatic",
                invite_only: false,
                game: {
                    width: parseInt(board_size),
                    height: parseInt(board_size),
                    ranked,
                    handicap: handicaps === "disabled" ? 0 : -1,
                    time_control,
                    rules: "japanese",
                    komi_auto: "automatic",
                    disable_analysis: false,
                    initial_state: null,
                    private: false,
                },
            },
            conf: {
                restrict_rank: false,
            },
            time_control,
        };

        console.log(settings);

        challengeComputer(settings);
    }, [board_size, handicaps, time_control_system, game_speed]);

    const play = React.useCallback(() => {
        if (data.get("user").anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

        doAutomatch();
    }, [doAutomatch]);

    const dismissCorrespondenceSpinner = React.useCallback(() => {
        setCorrespondenceSpinner(false);
    }, []);

    const automatch_search_active =
        !!automatch_manager.active_live_automatcher || correspondence_spinner;

    function isSizeActive(size: Size) {
        if (game_clock === "multiple") {
            return multiple_sizes[size];
        } else {
            return board_size === size;
        }
    }

    function isSpeedSystemActive(speed: JGOFTimeControlSpeed, system: "fischer" | "byoyomi") {
        if (game_clock === "multiple") {
            return multiple_speeds[`${speed as "blitz" | "rapid" | "live"}-${system}`];
        } else {
            return game_speed === speed && time_control_system === system;
        }
    }

    function toggleSpeedSystem(speed: JGOFTimeControlSpeed, system: "fischer" | "byoyomi") {
        if (game_clock === "multiple") {
            const new_speeds = {
                ...multiple_speeds,
                [`${speed as "blitz" | "rapid" | "live"}-${system}`]:
                    !multiple_speeds[`${speed as "blitz" | "rapid" | "live"}-${system}`],
            };
            delete (new_speeds as any)["correspondence-fischer"];
            delete (new_speeds as any)["correspondence-byoyomi"];

            if (Object.values(new_speeds).filter((x) => x).length > 0) {
                setMultipleSpeeds(new_speeds);
            }
        } else {
            setGameSpeed(speed);
            setTimeControlSystem(system);
        }
    }

    function toggleSize(size: Size) {
        if (game_clock === "multiple") {
            const new_sizes = {
                ...multiple_sizes,
                [size]: !multiple_sizes[size],
            };

            if (Object.values(new_sizes).filter((x) => x).length > 0) {
                setMultipleSizes(new_sizes);
            }
        } else {
            setBoardSize(size);
        }
    }

    // nothing selected? Select what we last had selected
    if (game_clock === "multiple") {
        if (Object.values(multiple_sizes).filter((x) => x).length === 0) {
            toggleSize(board_size);
        }
        if (Object.values(multiple_speeds).filter((x) => x).length === 0) {
            if (game_speed !== "correspondence") {
                toggleSpeedSystem(game_speed, time_control_system);
            } else {
                toggleSpeedSystem("rapid", time_control_system);
            }
        }
    }

    const selected_size_count =
        game_clock === "multiple" ? Object.values(multiple_sizes).filter((x) => x).length : 1;

    const min_selected_size = multiple_sizes["9x9"]
        ? "9x9"
        : multiple_sizes["13x13"]
          ? "13x13"
          : "19x19";
    const max_selected_size = multiple_sizes["19x19"]
        ? "19x19"
        : multiple_sizes["13x13"]
          ? "13x13"
          : "9x9";

    let available_bots: (Bot & { disabled?: string })[] = bots_list().filter((b) => b.id > 0);

    if (game_clock !== "multiple") {
        available_bots = available_bots.filter((b) => {
            const settings = {
                rank: user.ranking,
                width: parseInt(board_size),
                height: parseInt(board_size),
                ranked: true,
                handicap: handicaps === "disabled" ? false : true,
                system: time_control_system,
                speed: game_speed,
                [time_control_system]: SPEED_OPTIONS[board_size][game_speed][time_control_system],
            };
            const [options, message] = getAcceptableTimeSetting(b, settings);
            if (!options) {
                b.disabled = message || undefined;
            } else if (options && options._config_version && options._config_version === 0) {
                b.disabled = llm_pgettext(
                    "Bot is not configured correctly",
                    "Bot is not configured correctly",
                );
            } else {
                b.disabled = undefined;
            }

            return true;
        });
    }

    available_bots.sort((a, b) => {
        if (a.disabled && !b.disabled) {
            return 1;
        }
        if (b.disabled && !a.disabled) {
            return -1;
        }
        return (a.ranking || 0) - (b.ranking || 0);
    });

    /* Filter available quick matches to the applicable ones for button highlighting  */
    const available_human_match_count_by_size: { [size: string]: number } = {
        "9x9": 0,
        "13x13": 0,
        "19x19": 0,
    };
    const available_human_matches: {
        [size: string]: { [speed: string]: { [system: string]: number } };
    } = {};
    for (const size of ["9x9", "13x13", "19x19"]) {
        available_human_matches[size] = {};
        for (const speed of ["blitz", "rapid", "live"]) {
            available_human_matches[size][speed] = {};
            for (const system of ["fischer", "byoyomi"]) {
                available_human_matches[size][speed][system] = 0;
            }
        }
    }
    try {
        Object.values(available_human_matches_list.current).filter((entry) => {
            if (
                (user.anonymous ||
                    (entry.player.id !== user.id &&
                        entry.player.bounded_rank >= user.ranking - lower_rank_diff &&
                        entry.player.bounded_rank <= user.ranking + upper_rank_diff &&
                        user.ranking >=
                            entry.player.bounded_rank - entry.preferences.lower_rank_diff &&
                        user.ranking <=
                            entry.player.bounded_rank + entry.preferences.upper_rank_diff)) &&
                entry.preferences.size_speed_options[0].speed !== "correspondence"
            ) {
                for (const e of entry.preferences.size_speed_options) {
                    try {
                        available_human_matches[e.size][e.speed][e.system]++;
                        available_human_match_count_by_size[e.size]++;
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
    } catch (e) {
        console.error(e);
    }

    /* Returns the CSS class for the activity effect based on the number of recent and available matches for a button */
    function getActivityClass(size: string, speed?: string, system?: string): string {
        if (speed === "correspondence") {
            // correspondence games have longer match times and are typically
            // available in any size, but we also don't want to flag them as
            // being actively waited and attract impatient players
            return " activity popular ";
        }

        if (!speed || !system) {
            if (available_human_match_count_by_size[size] > 0) {
                return " activity player-waiting ";
            }
            const total =
                (recent_matches_count?.["9x9"] || 0) +
                (recent_matches_count?.["13x13"] || 0) +
                (recent_matches_count?.["19x19"] || 0);
            if (total > 0) {
                return ` activity ${
                    (recent_matches_count?.[size] || 0) / total > 0.33 ? "popular" : "un-popular"
                } `;
            }

            return " activity ";
        }

        if (speed && system) {
            if (game_clock === "multiple") {
                // anybody waiting on any of the sizes?
                for (const multi_size in multiple_sizes) {
                    if (multiple_sizes[multi_size as keyof typeof multiple_sizes]) {
                        if (available_human_matches?.[multi_size]?.[speed]?.[system] > 0) {
                            return ` activity player-waiting `;
                        }
                    }
                }

                // is there a popular setting on any of the sizes?
                for (const multi_size in multiple_sizes) {
                    if (multiple_sizes[multi_size as keyof typeof multiple_sizes]) {
                        let total = 0;
                        for (const speed of ["blitz", "rapid", "live"]) {
                            for (const system of ["fischer", "byoyomi"]) {
                                total += recent_matches?.[multi_size]?.[speed]?.[system] || 0;
                            }
                        }
                        if ((recent_matches?.[multi_size]?.[speed]?.[system] || 0) / total > 0.2) {
                            return ` activity popular `;
                        }
                    }
                }

                return ` activity un-popular `;
            } else {
                // any waiting on this size?
                if (available_human_matches?.[size]?.[speed]?.[system] > 0) {
                    return ` activity player-waiting `;
                }

                // is there a popular setting on this size?
                let total = 0;
                for (const speed of ["blitz", "rapid", "live"]) {
                    for (const system of ["fischer", "byoyomi"]) {
                        total += recent_matches?.[size]?.[speed]?.[system] || 0;
                    }
                }
                return ` activity ${
                    (recent_matches?.[size]?.[speed]?.[system] || 0) / total > 0.2
                        ? "popular"
                        : "un-popular"
                } `;
            }
        }

        // should be unreachable in practice
        return " activity ";
    }

    const lower_rank_diff_options = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((v) => ({
        value: v.toString(),
        label: v === 0 ? "0" : `- ${v}`,
        description: v === 0 ? llm_pgettext("Player is the same rank as you", "Your rank") : "",
    }));

    const upper_rank_diff_options = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => ({
        value: v.toString(),
        label: v === 0 ? "0" : `+ ${v}`,
        description: v === 0 ? llm_pgettext("Player is the same rank as you", "Your rank") : "",
    }));

    // ensure a valid handicap value is selected
    if (!handicap_options.find((o) => o.value === handicaps)) {
        setHandicaps("standard");
    }

    return (
        <>
            <div id="QuickMatch">
                {/* Board Size */}
                <div className="GameOption-cell">
                    <div className="GameOption BoardSize-header">
                        <span>{_("Board Size")}</span>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        {(["9x9", "13x13", "19x19"] as Size[]).map((s) => (
                            <button
                                className={
                                    "btn size-button " +
                                    (isSizeActive(s) ? "active " : "") +
                                    getActivityClass(s)
                                }
                                key={s}
                                disabled={automatch_search_active}
                                onClick={() => {
                                    toggleSize(s);
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {game_clock === "multiple" ? (
                        selected_size_count > 1 ? (
                            <span className="Multi-MiniGoban-container">
                                {["19x19", "13x13", "9x9"].map(
                                    (s) =>
                                        multiple_sizes[s as keyof typeof multiple_sizes] && (
                                            <span key={s}>
                                                <MiniGoban
                                                    width={parseInt(s)}
                                                    height={parseInt(s)}
                                                    displayWidth={150}
                                                    labels_positioning="all"
                                                    noLink={true}
                                                    json={{
                                                        width: parseInt(s),
                                                        height: parseInt(s),
                                                    }}
                                                />
                                            </span>
                                        ),
                                )}
                            </span>
                        ) : (
                            <MiniGoban
                                width={parseInt(min_selected_size)}
                                height={parseInt(min_selected_size)}
                                labels_positioning="all"
                                noLink={true}
                                json={{
                                    width: parseInt(min_selected_size),
                                    height: parseInt(min_selected_size),
                                }}
                            />
                        )
                    ) : (
                        <MiniGoban
                            width={parseInt(board_size)}
                            height={parseInt(board_size)}
                            labels_positioning="all"
                            noLink={true}
                            json={{
                                width: parseInt(board_size),
                                height: parseInt(board_size),
                            }}
                        />
                    )}
                </div>

                {/* Game Speed */}
                <div className="GameOption-cell">
                    <div className="GameOption">
                        <span>
                            {pgettext("Clock settings header for a new game", "Game Clock")}
                        </span>
                        <Select
                            classNamePrefix="ogs-react-select"
                            styles={
                                {
                                    ...select_styles,
                                    menu: (base) => ({
                                        ...base,
                                        width: "120",
                                    }),
                                } as StylesConfig<
                                    OptionWithDescription,
                                    false,
                                    GroupBase<OptionWithDescription>
                                >
                            }
                            isSearchable={false}
                            value={game_clock_options.find((o) => o.value === game_clock)}
                            menuPlacement="auto"
                            onChange={(opt) => {
                                if (opt) {
                                    setGameClock(opt.value as "flexible" | "exact" | "multiple");
                                    if (opt.value === "multiple") {
                                        setOpponent("human");
                                    }
                                }
                            }}
                            options={game_clock_options}
                            components={{
                                Option: RenderOptionWithDescription,
                            }}
                        />
                    </div>
                    <div className="speed-options">
                        {game_clock === "multiple" && (
                            <div className="multiple-options-description">
                                {_("Select all the settings you are comfortable playing with.")}
                            </div>
                        )}
                        {(
                            ["blitz", "rapid", "live", "correspondence"] as JGOFTimeControlSpeed[]
                        ).map((speed) => {
                            const opt =
                                SPEED_OPTIONS[
                                    game_clock === "multiple"
                                        ? min_selected_size
                                        : (board_size as any)
                                ][speed];
                            const min_opt = SPEED_OPTIONS[min_selected_size as any][speed];
                            const max_opt = SPEED_OPTIONS[max_selected_size as any][speed];

                            return (
                                <div
                                    className={
                                        "game-speed-option-container" +
                                        (game_speed === speed ? " active" : "")
                                    }
                                    key={speed}
                                >
                                    <div className="game-speed-title">
                                        <span className="description">
                                            {selected_size_count > 1 && speed !== "correspondence"
                                                ? `${
                                                      min_opt.time_estimate
                                                  } - ${max_opt.time_estimate.replace(
                                                      /\u223c/,
                                                      "",
                                                  )}`
                                                : opt.time_estimate}
                                        </span>
                                    </div>
                                    <div
                                        className={
                                            "game-speed-buttons " +
                                            (game_speed === speed && game_clock === "flexible"
                                                ? "flexible-active"
                                                : "")
                                        }
                                    >
                                        <button
                                            className={
                                                "time-control-button" +
                                                (isSpeedSystemActive(speed, "fischer")
                                                    ? " active"
                                                    : "") +
                                                getActivityClass(board_size, speed, "fischer")
                                            }
                                            disabled={
                                                automatch_search_active ||
                                                (game_clock === "multiple" &&
                                                    speed === "correspondence")
                                            }
                                            onClick={() => {
                                                toggleSpeedSystem(speed, "fischer");
                                            }}
                                        >
                                            {selected_size_count > 1 && speed !== "correspondence"
                                                ? `${shortDurationString(
                                                      min_opt.fischer.initial_time,
                                                  ).replace(
                                                      /[^0-9]+/g,
                                                      "",
                                                  )} - ${shortDurationString(
                                                      max_opt.fischer.initial_time,
                                                  )}`
                                                : shortDurationString(opt.fischer.initial_time)}
                                            {" + "}
                                            {shortDurationString(opt.fischer.time_increment)}
                                        </button>
                                        {opt.byoyomi && (
                                            <>
                                                {game_clock === "flexible" &&
                                                game_speed === speed ? (
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
                                                        (isSpeedSystemActive(speed, "byoyomi")
                                                            ? " active"
                                                            : "") +
                                                        getActivityClass(
                                                            board_size,
                                                            speed,
                                                            "byoyomi",
                                                        )
                                                    }
                                                    onClick={() => {
                                                        toggleSpeedSystem(speed, "byoyomi");
                                                    }}
                                                    disabled={automatch_search_active}
                                                >
                                                    {selected_size_count > 1 &&
                                                    speed !== "correspondence"
                                                        ? `${shortDurationString(
                                                              min_opt.byoyomi!.main_time,
                                                          ).replace(
                                                              /[^0-9]+/g,
                                                              "",
                                                          )} - ${shortDurationString(
                                                              max_opt.byoyomi!.main_time,
                                                          )}`
                                                        : shortDurationString(
                                                              opt.byoyomi.main_time,
                                                          )}
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
                        <span>{_("Handicap")}</span>
                        <Select
                            classNamePrefix="ogs-react-select"
                            styles={
                                {
                                    ...select_styles,
                                    menu: (base) => ({
                                        ...base,
                                        width: "120",
                                    }),
                                } as StylesConfig<
                                    OptionWithDescription,
                                    false,
                                    GroupBase<OptionWithDescription>
                                >
                            }
                            value={handicap_options.find((o) => o.value === handicaps)}
                            isSearchable={false}
                            minMenuHeight={400}
                            maxMenuHeight={400}
                            menuPlacement="auto"
                            isDisabled={automatch_search_active}
                            onChange={(opt) => {
                                if (opt) {
                                    setHandicaps(opt.value as "enabled" | "standard" | "disabled");
                                }
                            }}
                            options={[
                                {
                                    label: _(
                                        "Handicaps balance games between players of different ranks by adjusting starting stones and komi points.",
                                    ),
                                    options: handicap_options,
                                },
                            ]}
                            components={{
                                Option: RenderOptionWithDescription,
                            }}
                        />
                    </div>
                </div>

                {/* Play Button */}
                <div className="GameOption-cell">
                    <div className="GameOption opponent-rank-container">
                        <span>{_("Opponent Rank")}</span>
                        <div className="opponent-rank-range">
                            <Select
                                classNamePrefix="ogs-react-select"
                                value={lower_rank_diff_options.find(
                                    (o) => o.value === lower_rank_diff.toString(),
                                )}
                                styles={
                                    {
                                        ...select_styles,
                                        menu: (base) => ({
                                            ...base,
                                            width: "120",
                                        }),
                                    } as StylesConfig<
                                        OptionWithDescription,
                                        false,
                                        GroupBase<OptionWithDescription>
                                    >
                                }
                                isSearchable={false}
                                isDisabled={automatch_search_active}
                                menuPlacement="auto"
                                onChange={(opt) => {
                                    if (opt) {
                                        setLowerRankDiff(parseInt(opt.value));
                                    }
                                }}
                                options={[
                                    {
                                        label: pgettext(
                                            "A word that means this is a list of ranks that are weaker than the player's rank",
                                            "Weaker",
                                        ),
                                        options: lower_rank_diff_options,
                                    },
                                ]}
                                components={{
                                    Option: RenderOptionWithDescription,
                                }}
                            />

                            {" - "}

                            <Select
                                classNamePrefix="ogs-react-select"
                                value={upper_rank_diff_options.find(
                                    (o) => o.value === upper_rank_diff.toString(),
                                )}
                                styles={
                                    {
                                        ...select_styles,
                                        menu: (base) => ({
                                            ...base,
                                            width: "120",
                                        }),
                                    } as StylesConfig<
                                        OptionWithDescription,
                                        false,
                                        GroupBase<OptionWithDescription>
                                    >
                                }
                                isSearchable={false}
                                isDisabled={automatch_search_active}
                                menuPlacement="auto"
                                onChange={(opt) => {
                                    if (opt) {
                                        setUpperRankDiff(parseInt(opt.value));
                                    }
                                }}
                                options={[
                                    {
                                        label: pgettext(
                                            "A word that means this is a list of ranks that are stronger than the player's rank",
                                            "Stronger",
                                        ),
                                        options: upper_rank_diff_options,
                                    },
                                ]}
                                components={{
                                    Option: RenderOptionWithDescription,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="PlayButton-container">
                {/* Bot */}

                {!automatch_search_active && !user.anonymous && (
                    <button
                        className="play-button"
                        onClick={playComputerX}
                        disabled={anon || warned || have_active_game_search}
                    >
                        {_("Play Computer")}
                    </button>
                )}

                {/* Human */}
                {automatch_manager.active_live_automatcher && (
                    <div className="finding-game-container">
                        <LoadingButton
                            className="success sm"
                            loading={true}
                            onClick={cancelActiveAutomatch}
                        >
                            {pgettext("Cancel automatch", "Searching for game...")}
                        </LoadingButton>
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
                {user.anonymous && (
                    <div className="anonymous-container">
                        {_("Please sign in to play")}
                        <div>
                            <Link to="/register#/play">{_("Register for Free")}</Link>
                            {" | "}
                            <Link to="/sign-in#/play">{_("Sign in")}</Link>
                        </div>
                    </div>
                )}

                {!automatch_search_active && !user.anonymous && (
                    <button
                        className="primary play-button"
                        onClick={play}
                        disabled={anon || warned || have_active_game_search}
                    >
                        {_("Play Human")}
                    </button>
                )}
            </div>

            <div className="play-page-help-container">
                <span className="fakelink" onClick={openPlayPageHelp}>
                    {_("Help?")}
                </span>
            </div>
        </>
    );
}
