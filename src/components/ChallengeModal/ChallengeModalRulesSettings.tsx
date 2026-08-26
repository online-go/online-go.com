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

type ChallengeModalRulesSettingsProps = {
    rules: string;
    updateRules: (rules: string) => void;
};

export function ChallengeModalRulesSettings({
    rules,
    updateRules,
}: ChallengeModalRulesSettingsProps) {
    const cbUpdateRules = React.useCallback(
        (ev: React.ChangeEvent<HTMLSelectElement>) => {
            updateRules(ev.target.value);
        },
        [updateRules],
    );

    return (
        <div>
            <div className="form-group" id="challenge.game.rules-group">
                <label className="control-label" htmlFor="rules">
                    {_("Rules")}
                </label>
                <div className="controls">
                    <div className="checkbox">
                        <select
                            id="challenge-rules"
                            value={rules}
                            onChange={cbUpdateRules}
                            className="challenge-dropdown form-control"
                        >
                            <option value="aga">{_("AGA")}</option>
                            <option value="chinese">{_("Chinese")}</option>
                            <option value="ing">{_("Ing SST")}</option>
                            <option value="japanese">{_("Japanese")}</option>
                            <option value="korean">{_("Korean")}</option>
                            <option value="nz">{_("New Zealand")}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
