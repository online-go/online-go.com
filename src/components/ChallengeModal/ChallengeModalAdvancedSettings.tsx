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
import { _ } from "@/lib/translate";
import { TimeControl, TimeControlPicker } from "@/components/TimeControl";
import {
    ChallengeDetails,
    ChallengeInput,
    ChallengeModalConf,
    GameInput,
} from "./ChallengeModal.types";
import { ChallengeModalRulesSettings } from "./ChallengeModalRulesSettings";
import { ChallengeModalHandicapSettings } from "./ChallengeModalHandicapSettings";
import { ChallengeModalKomiSettings } from "./ChallengeModalKomiSettings";
import {
    applyBotRanked,
    coerceKomiForAutoHandicap,
    getDefaultKomi,
    isColorSelectionOption,
    isKomiOption,
    isRuleSet,
} from "./ChallengeModal.utils";

type ChallengeModalAdvancedSettingsProps = {
    mode: string;
    challenge: ChallengeInput;
    game: GameInput;
    conf: ChallengeModalConf;
    timeControl: TimeControl;
    forkingGame: boolean;
    handicapRanges: number[];
    ranks: Array<{ rank: number; label: string }>;
    onTimeControlChange: (tc: TimeControl) => void;
    updateChallenge: (challenge: any) => void;
    updateConf: (conf: any) => void;
    updateGameSettings: (game: any) => void;
};

export function ChallengeModalAdvancedSettings({
    mode,
    challenge,
    game,
    conf,
    timeControl,
    forkingGame,
    handicapRanges,
    ranks,
    onTimeControlChange,
    updateChallenge,
    updateConf,
    updateGameSettings,
}: ChallengeModalAdvancedSettingsProps) {
    const forceSystem: boolean = challenge.game.rengo && challenge.game.rengo_casual_mode;

    const updateRules = React.useCallback(
        (rules: string) => {
            if (!isRuleSet(rules)) {
                return;
            }
            updateGameSettings((prev: GameInput) => ({ ...prev, rules: rules }));
        },
        [updateGameSettings],
    );

    const updateHandicap = React.useCallback(
        (handicap: number) => {
            updateGameSettings((prev: GameInput) => {
                const next = coerceKomiForAutoHandicap({ ...prev, handicap: handicap });
                if (mode === "computer") {
                    return applyBotRanked(next);
                }
                return next;
            });
        },
        [updateGameSettings, mode],
    );

    const updateKomiOption = React.useCallback(
        (komi_option: string) => {
            if (!isKomiOption(komi_option)) {
                console.error(`invalid komi option: ${komi_option}`);
                return;
            }
            updateChallenge((prev: ChallengeDetails) => {
                const changedToCustom =
                    komi_option === "custom" && prev.game.komi_auto !== "custom";

                const nextGame = {
                    ...prev.game,
                    komi_auto: komi_option,
                    // If we just switched to custom komi, set it to the default for the current
                    // rules.
                    ...(changedToCustom && {
                        komi: getDefaultKomi(prev.game.rules, prev.game.handicap > 0),
                    }),
                };

                return {
                    ...prev,
                    game: mode === "computer" ? applyBotRanked(nextGame) : nextGame,
                };
            });
        },
        [updateChallenge, mode],
    );

    const updateKomi = React.useCallback(
        (komi: number | null) => {
            updateGameSettings((prev: GameInput) => ({ ...prev, komi: komi }));
        },
        [updateGameSettings],
    );

    const cbUpdateChallengeColor = React.useCallback(
        (ev: React.ChangeEvent<HTMLSelectElement>) => {
            const color_selection = ev.target.value;
            if (!isColorSelectionOption(color_selection)) {
                return;
            }
            updateChallenge((prev: ChallengeDetails) => ({
                ...prev,
                challenger_color: color_selection,
            }));
        },
        [updateChallenge],
    );

    const cbUpdateDisableAnalysis = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const disable_analysis = ev.target.checked;
            updateGameSettings((prev: GameInput) => ({
                ...prev,
                disable_analysis: disable_analysis,
            }));
        },
        [updateGameSettings],
    );

    const cbUpdateRestrictRank = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const restrict_rank = ev.target.checked;
            updateConf((prev: ChallengeModalConf) => ({
                ...prev,
                restrict_rank: restrict_rank,
            }));
        },
        [updateConf],
    );

    const cbUpdateMinRank = React.useCallback(
        (ev: React.ChangeEvent<HTMLSelectElement>) => {
            const min_ranking = parseInt(ev.target.value);
            updateChallenge(
                (prev: ChallengeInput): ChallengeInput => ({
                    ...prev,
                    min_ranking,
                    max_ranking: Math.max(prev.max_ranking, min_ranking),
                }),
            );
        },
        [updateChallenge],
    );

    const cbUpdateMaxRank = React.useCallback(
        (ev: React.ChangeEvent<HTMLSelectElement>) => {
            const max_ranking = parseInt(ev.target.value);
            updateChallenge(
                (prev: ChallengeInput): ChallengeInput => ({
                    ...prev,
                    min_ranking: Math.min(prev.min_ranking, max_ranking),
                    max_ranking,
                }),
            );
        },
        [updateChallenge],
    );

    return (
        <div
            id="challenge-advanced-fields"
            className="challenge-pane-container form-inline"
            style={{ marginTop: "1em" }}
        >
            <div className="left-pane pane form-horizontal">
                {mode !== "computer" && (
                    <ChallengeModalRulesSettings rules={game.rules} updateRules={updateRules} />
                )}
                <TimeControlPicker
                    timeControl={timeControl}
                    onChange={onTimeControlChange}
                    boardWidth={game.width ?? 19}
                    boardHeight={game.height ?? 19}
                    forceSystem={forceSystem}
                />
            </div>

            <div className="right-pane pane form-horizontal">
                {!forkingGame && (
                    <ChallengeModalHandicapSettings
                        game={game}
                        mode={mode}
                        handicapRanges={handicapRanges}
                        updateHandicap={updateHandicap}
                    />
                )}
                <ChallengeModalKomiSettings
                    game={game}
                    mode={mode}
                    updateKomiOption={updateKomiOption}
                    updateKomi={updateKomi}
                />

                <div className="form-group">
                    <label className="control-label" htmlFor="challenge-color">
                        {_("Your Color")}
                    </label>
                    <div className="controls">
                        <div className="checkbox">
                            <select
                                value={challenge.challenger_color}
                                onChange={cbUpdateChallengeColor}
                                id="challenge-color"
                                className="challenge-dropdown form-control"
                            >
                                <option value="automatic">{_("Automatic")}</option>
                                <option value="black">{_("Black")}</option>
                                <option value="white">{_("White")}</option>
                                <option value="random">{_("Random")}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    {mode !== "computer" && (
                        <div className="form-group" style={{ position: "relative" }}>
                            <label className="control-label" htmlFor="challenge-disable-analysis">
                                {_("Disable Analysis")}
                            </label>
                            <div className="controls">
                                <div className="checkbox">
                                    <input
                                        checked={game.disable_analysis}
                                        onChange={cbUpdateDisableAnalysis}
                                        id="challenge-disable-analysis"
                                        type="checkbox"
                                    />{" "}
                                    *
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "open" && (
                        <div>
                            <div className="form-group" id="challenge-restrict-rank-group">
                                <label className="control-label" htmlFor="challenge-restrict-rank">
                                    {_("Restrict Rank")}
                                </label>
                                <div className="controls">
                                    <div className="checkbox">
                                        <input
                                            checked={conf.restrict_rank}
                                            onChange={cbUpdateRestrictRank}
                                            id="challenge-restrict-rank"
                                            type="checkbox"
                                        />
                                    </div>
                                </div>
                            </div>
                            {conf.restrict_rank && (
                                <div>
                                    <div className="form-group" id="challenge-min-rank-group">
                                        <label
                                            className="control-label"
                                            htmlFor="challenge-min-rank"
                                        >
                                            {_("Minimum Ranking")}
                                        </label>
                                        <div className="controls">
                                            <div className="checkbox">
                                                <select
                                                    value={challenge.min_ranking}
                                                    onChange={cbUpdateMinRank}
                                                    id="challenge-min-rank"
                                                    className="challenge-dropdown form-control"
                                                >
                                                    {ranks.map((r, idx) => (
                                                        <option key={idx} value={r.rank}>
                                                            {r.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group" id="challenge-max-rank-group">
                                        <label
                                            className="control-label"
                                            htmlFor="challenge-max-rank"
                                        >
                                            {_("Maximum Ranking")}
                                        </label>
                                        <div className="controls">
                                            <div className="checkbox">
                                                <select
                                                    value={challenge.max_ranking}
                                                    onChange={cbUpdateMaxRank}
                                                    id="challenge-max-rank"
                                                    className="challenge-dropdown form-control"
                                                >
                                                    {ranks.map((r, idx) => (
                                                        <option key={idx} value={r.rank}>
                                                            {r.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {mode !== "computer" && (
                        <div
                            style={{
                                marginTop: "1.0em",
                                textAlign: "right",
                                fontSize: "0.8em",
                            }}
                        >
                            * {_("Also disables conditional moves")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
