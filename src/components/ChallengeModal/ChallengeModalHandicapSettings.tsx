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
import { GameInput } from "@/components/ChallengeModal/ChallengeModal.types";

type ChallengeModalHandicapSettingsProps = {
    game: Pick<GameInput, "handicap" | "ranked">;
    mode: string;
    handicapRanges: number[];
    updateHandicap: (handicap: number) => void;
};

export function ChallengeModalHandicapSettings({
    game,
    mode,
    handicapRanges,
    updateHandicap,
}: ChallengeModalHandicapSettingsProps) {
    // In bot mode, users can pick any handicap; ranked auto-flips to false.
    const restrictRankedOnly = game.ranked && mode !== "computer";

    const cbUpdateHandicap = React.useCallback(
        (ev: React.ChangeEvent<HTMLSelectElement>) => {
            updateHandicap(parseInt(ev.target.value, 10));
        },
        [updateHandicap],
    );

    return (
        <div className="form-group" id="challenge.game.handicap-group">
            <label className="control-label">{_("Handicap")}</label>
            <div className="controls">
                <div className="checkbox">
                    <select
                        value={game.handicap}
                        onChange={cbUpdateHandicap}
                        className="challenge-dropdown form-control"
                        id="challenge-handicap"
                    >
                        <option
                            value="-1"
                            /*{disabled={!this.state.conf.handicap_enabled}}*/
                        >
                            {_("Automatic")}
                        </option>
                        <option value="0">{_("None")}</option>
                        {handicapRanges.map((n, idx) => (
                            <option key={idx} value={n} disabled={n > 9 && restrictRankedOnly}>
                                {n}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
