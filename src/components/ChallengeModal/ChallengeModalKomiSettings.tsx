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
import { parseNumberInput } from "@/components/ChallengeModal/ChallengeModal.utils";
import { GameInput } from "@/components/ChallengeModal/ChallengeModal.types";

type ChallengeModalKomiSettingsProps = {
    game: Pick<GameInput, "ranked" | "handicap" | "komi_auto" | "komi">;
    mode: string;
    updateKomiOption: (komiOption: string) => void;
    updateKomi: (komi: number | null) => void;
};

export function ChallengeModalKomiSettings({
    game,
    mode,
    updateKomiOption,
    updateKomi,
}: ChallengeModalKomiSettingsProps) {
    // In bot mode, users can pick custom komi; ranked auto-flips to false.
    const restrictRankedOnly = game.ranked && mode !== "computer";
    // Auto handicap forces auto komi - the backend handicap calculator
    // ignores requested_komi in the auto-handicap branch.
    const autoHandicap = game.handicap < 0;
    const disableCustomKomi = restrictRankedOnly || autoHandicap;

    const cbUpdateKomiOption = React.useCallback(
        (ev: React.ChangeEvent<HTMLSelectElement>) => {
            updateKomiOption(ev.target.value);
        },
        [updateKomiOption],
    );

    const cbUpdateKomi = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            updateKomi(parseNumberInput(ev.target.value));
        },
        [updateKomi],
    );

    return (
        <>
            <div className="form-group">
                <label className="control-label">{_("Komi")}</label>
                <div className="controls">
                    <div className="checkbox">
                        <select
                            value={game.komi_auto}
                            onChange={cbUpdateKomiOption}
                            className="challenge-dropdown form-control"
                            id="challenge-komi"
                        >
                            <option value="automatic">{_("Automatic")}</option>
                            <option value="custom" disabled={disableCustomKomi}>
                                {_("Custom")}
                            </option>
                        </select>
                    </div>
                </div>
            </div>
            {game.komi_auto === "custom" && (
                <div className="form-group">
                    <label className="control-label"></label>
                    <div className="controls">
                        <div className="checkbox">
                            <input
                                type="number"
                                value={game.komi ?? ""}
                                onChange={cbUpdateKomi}
                                className="form-control"
                                style={{ width: "4em" }}
                                step="0.5"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
