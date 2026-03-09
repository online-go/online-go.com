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
import { useNavigate } from "react-router-dom";
import { AutomatchPreferences, shortDurationString, Size, Speed } from "goban";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { _ } from "@/lib/translate";
import { alert } from "@/lib/swal_config";
import { uuid } from "@/lib/misc";
import { automatch_manager } from "@/lib/automatch_manager";
import { SPEED_OPTIONS } from "@/views/Play/SPEED_OPTIONS";
import { challengeComputer } from "@/components/ChallengeModal";
import { ChallengesList } from "./ChallengesList";
import "./PlayBar.css";

interface PlayBarProps {
    onChallengeAccept: () => void;
}

export function PlayBar({ onChallengeAccept }: PlayBarProps): React.ReactElement {
    const [board_size] = preferences.usePreference("automatch.size");
    const [game_speed] = preferences.usePreference("automatch.speed");
    const [time_control_system] = preferences.usePreference("automatch.time-control");
    const [game_clock] = preferences.usePreference("automatch.game-clock");
    const [multiple_sizes] = preferences.usePreference("automatch.multiple-sizes");
    const [multiple_speeds] = preferences.usePreference("automatch.multiple-speeds");
    const [handicaps] = preferences.usePreference("automatch.handicaps");
    const [lower_rank_diff] = preferences.usePreference("automatch.lower-rank-diff");
    const [upper_rank_diff] = preferences.usePreference("automatch.upper-rank-diff");
    const navigate = useNavigate();

    const playLabel = React.useMemo((): React.ReactNode => {
        if (game_clock === "multiple") {
            const selected_size_count = Object.values(multiple_sizes).filter((x) => x).length;
            const selected_speed_count = Object.values(multiple_speeds).filter((x) => x).length;
            if (selected_size_count > 1 || selected_speed_count > 1) {
                return _("Quick Match");
            }
        }

        const size = board_size;
        const opt = SPEED_OPTIONS[size]?.[game_speed];

        let timeDesc: string;
        if (!opt) {
            timeDesc = "2m + 5x30s";
        } else if (time_control_system === "byoyomi" && opt.byoyomi) {
            const main = shortDurationString(opt.byoyomi.main_time);
            const periods = opt.byoyomi.periods;
            const period_time = shortDurationString(opt.byoyomi.period_time);
            timeDesc = `${main} + ${periods}x${period_time}`;
        } else {
            const initial = shortDurationString(opt.fischer.initial_time);
            const increment = shortDurationString(opt.fischer.time_increment);
            timeDesc = `${initial} + ${increment}`;
        }

        const sizeLabel = opt ? size : "9x9";

        return (
            <span className="play-label">
                <span className="play-label-play">{_("Play")}</span>
                <span className="play-label-details">
                    <span className="play-label-size">{sizeLabel}</span>
                    <span className="play-label-time">{timeDesc}</span>
                </span>
            </span>
        );
    }, [board_size, game_speed, time_control_system, game_clock, multiple_sizes, multiple_speeds]);

    const doAutomatch = React.useCallback(() => {
        if (data.get("user").anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

        const size_speed_options: Array<{
            size: Size;
            speed: Speed;
            system: "fischer" | "byoyomi";
        }> = [];

        if (game_clock === "exact" || game_clock === "flexible") {
            size_speed_options.push({
                size: board_size,
                speed: game_speed as Speed,
                system: time_control_system,
            });
            if (game_clock === "flexible" && game_speed !== "correspondence") {
                size_speed_options.push({
                    size: board_size,
                    speed: game_speed as Speed,
                    system: time_control_system === "fischer" ? "byoyomi" : "fischer",
                });
            }
        } else {
            for (const size in multiple_sizes) {
                if (multiple_sizes[size as keyof typeof multiple_sizes]) {
                    for (const speed_system in multiple_speeds) {
                        if (multiple_speeds[speed_system as keyof typeof multiple_speeds]) {
                            const [speed, system] = speed_system.split("-");
                            size_speed_options.push({
                                size: size as Size,
                                speed: speed as Speed,
                                system: system as "fischer" | "byoyomi",
                            });
                        }
                    }
                }
            }
            size_speed_options.sort(() => Math.random() - 0.5);
        }

        const prefs: AutomatchPreferences = {
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

        automatch_manager.findMatch(prefs);
        void navigate("/play");
    }, [
        board_size,
        game_speed,
        game_clock,
        time_control_system,
        handicaps,
        lower_rank_diff,
        upper_rank_diff,
        multiple_sizes,
        multiple_speeds,
        navigate,
    ]);

    return (
        <div className="PlayBar">
            <div className="play-buttons">
                <button className="play-button primary" onClick={doAutomatch}>
                    {playLabel}
                </button>
                <button className="play-button" onClick={() => navigate("/play")}>
                    {_("New Game")}
                </button>
                <button className="play-button" onClick={() => challengeComputer()}>
                    {_("Play Computer")}
                </button>
            </div>
            <ChallengesList onAccept={onChallengeAccept} />
        </div>
    );
}
