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
import { generateGobanHook } from "@/components/GobanView";
import type { GobanController } from "@/lib/GobanController";
import { _, interpolate } from "@/lib/translate";
import "./KibitzScoreEstimate.css";

const useEstimate = generateGobanHook(
    (goban) => {
        const estimate = goban?.score_estimator;
        return estimate ? { winner: estimate.winner, amount: estimate.amount } : null;
    },
    ["score_estimate"],
);

export function KibitzScoreEstimate({
    controller,
}: {
    controller: GobanController;
}): React.ReactElement {
    const estimate = useEstimate(controller.goban);
    return (
        <div className="KibitzScoreEstimate">
            <span role="status">
                {estimate?.winner
                    ? interpolate(_("{{winner}} by {{score}}"), {
                          winner: estimate.winner,
                          score: estimate.amount.toFixed(1),
                      })
                    : _("Estimating...")}
            </span>
            <button className="sm primary bold" onClick={controller.stopEstimatingScore}>
                {_("Back to Board")}
            </button>
        </div>
    );
}
