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

import React from "react";
import { UserVoteActionSummary } from "./UserVoteActionSummary";
import { community_mod_has_power, COMMUNITY_MODERATION_REPORT_TYPES } from "@/lib/report_util";
import { ReportType } from "@/components/Report";
import { pgettext } from "@/lib/translate";

interface CMPieChartsProps {
    user_id: number;
    user_moderator_powers: number;
}

export function CMPieCharts({
    user_id,
    user_moderator_powers,
}: CMPieChartsProps): React.ReactElement {
    return (
        <div className="CMPieCharts">
            <div className="mod-graph-header">
                {pgettext(
                    "header for a graph showing breakdown of moderator's vote outcomes",
                    "Summary (all report types)",
                )}
            </div>
            <UserVoteActionSummary user_id={user_id} />
            {Object.entries(COMMUNITY_MODERATION_REPORT_TYPES)
                .filter(([report_type, _name]) =>
                    community_mod_has_power(user_moderator_powers, report_type as ReportType),
                )
                .map(([report_type, _flag]) => (
                    <div key={report_type}>
                        <div className="mod-graph-header" key={report_type}>
                            {report_type}
                        </div>
                        <UserVoteActionSummary
                            user_id={user_id}
                            report_type={report_type as ReportType}
                        />
                    </div>
                ))}
        </div>
    );
}
