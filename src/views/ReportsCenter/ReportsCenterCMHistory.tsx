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
import { PaginatedTable } from "PaginatedTable";

export function ReportsCenterCMHistory(): JSX.Element {
    const navigateTo = useNavigate();

    return (
        <div className="ReportsCenterHistory">
            <PaginatedTable
                className="history"
                name="reports-appeals"
                source={"me/cm_history"}
                orderBy={["-updated"]}
                columns={[
                    {
                        header: "Report",
                        className: () => "report",
                        render: (X) => (
                            <button
                                onClick={() => navigateTo(`/reports-center/all/${X?.id}`)}
                                className="small"
                            >
                                {"R" + X?.id?.toString()?.substr(-3)}
                            </button>
                        ),
                    },
                    {
                        header: "Type",
                        className: () => "report_type",
                        render: (X) => X.report_type,
                    },
                    {
                        header: "Outcome",
                        className: () => "outcome",
                        render: (X) => X.system_note,
                    },
                    {
                        header: "State",
                        className: (X) => `state ${X?.state}`,
                        render: (X) => X.state,
                    },
                    {
                        header: "Votes",
                        className: () => "vote_counts",
                        render: (X) => (
                            <ul>
                                {Object.entries(X.vote_counts).map(([action, count]) => (
                                    <li key={action}>
                                        "{action}": {count?.toString()}
                                    </li>
                                ))}
                            </ul>
                        ),
                    },
                    {
                        header: "Escalated?",
                        className: () => "escalated",
                        render: (X) => (X.escalated ? "Yes" : ""),
                    },
                    {
                        header: "Your vote",
                        className: () => "your_vote",
                        render: (X) => `"${X.users_vote}"`,
                    },
                ]}
            />
        </div>
    );
}
