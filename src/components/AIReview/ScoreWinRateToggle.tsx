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
import { Toggle } from "@/components/Toggle";
import { pgettext } from "@/lib/translate";
import * as preferences from "@/lib/preferences";

interface ScoreWinRateToggleProps {
    useScore: boolean;
    onUseScoreChange: (useScore: boolean) => void;
    canViewTable: boolean;
    tableHidden: boolean;
    onTableHiddenChange: (hidden: boolean) => void;
    showTableToggle: boolean; // Only show when engine includes "katago"
}

/**
 * Component for toggling between score and win rate display,
 * and optionally showing/hiding the AI summary table
 */
export function ScoreWinRateToggle({
    useScore,
    onUseScoreChange,
    canViewTable,
    tableHidden,
    onTableHiddenChange,
    showTableToggle,
}: ScoreWinRateToggleProps) {
    const handleWinToggleClick = () => {
        preferences.set("ai-review-use-score", false);
        onUseScoreChange(false);
    };

    const handleScoreToggleClick = () => {
        preferences.set("ai-review-use-score", true);
        onUseScoreChange(true);
    };

    const handleToggleChange = (checked: boolean) => {
        preferences.set("ai-review-use-score", checked);
        onUseScoreChange(checked);
    };

    const handleTableToggleChange = (checked: boolean) => {
        preferences.set("ai-summary-table-show", checked);
        onTableHiddenChange(!checked);
    };

    return (
        <div className="ai-review-togglers">
            <div className="left-section"></div>
            <div className="middle-section">
                <span className="win-toggle" onClick={handleWinToggleClick}>
                    {pgettext("Display the win % that the AI estimates", "Win %")}
                </span>

                <span>
                    <Toggle checked={useScore} onChange={handleToggleChange} />
                </span>

                <span className="score-toggle" onClick={handleScoreToggleClick}>
                    {pgettext("Display the game score that the AI estimates", "Score")}
                </span>
            </div>
            <div className="right-section">
                {canViewTable && showTableToggle && (
                    <div className="ai-summary-toggler">
                        <span>
                            <i className="fa fa-table"></i>
                        </span>
                        <span>
                            <Toggle checked={!tableHidden} onChange={handleTableToggleChange} />
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
