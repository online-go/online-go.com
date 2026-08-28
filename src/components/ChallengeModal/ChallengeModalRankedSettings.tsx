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

type ChallengeModalRankedSettingsProps = {
    game: {
        ranked: boolean;
        private: boolean;
        rengo: boolean;
    };
    updateRanked: (ranked: boolean) => void;
};

export const ChallengeModalRankedSettings = ({
    game,
    updateRanked,
}: ChallengeModalRankedSettingsProps) => {
    const isRankedDisabled = !game.ranked && (game.private || game.rengo);

    const cbUpdateRanked = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            updateRanked(ev.target.checked);
        },
        [updateRanked],
    );

    return (
        <div>
            <div className="form-group">
                <label className="control-label" htmlFor="challenge-ranked">
                    {_("Ranked")}
                </label>
                <div className="controls">
                    <div className="checkbox">
                        <input
                            type="checkbox"
                            id="challenge-ranked"
                            disabled={isRankedDisabled}
                            checked={game.ranked}
                            onChange={cbUpdateRanked}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
