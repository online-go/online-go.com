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

import React, { useEffect, useState } from "react";

import { get } from "@/lib/requests";
import * as data from "@/lib/data";
import { ResponsivePie } from "@nivo/pie";
import { ReportType } from "@/components/Report";

interface VoteSummaryData {
    report_type: string;
    total_consensus: number;
    total_non_consensus: number;
    total_escalated: number;
}

interface VoteSummaryPieProps {
    summary_data: VoteSummaryData;
}

export function VoteSummaryPie({ summary_data }: VoteSummaryPieProps): React.ReactElement {
    const chart_data = React.useMemo(
        () => [
            { id: "consensus", value: summary_data["total_consensus"] },
            { id: "non-consensus", value: summary_data["total_non_consensus"] },
            { id: "escalated", value: summary_data["total_escalated"] },
        ],
        [summary_data],
    );

    const have_data =
        summary_data["total_consensus"] ||
        summary_data["total_escalated"] ||
        summary_data["total_non_consensus"];

    const chart_theme =
        data.get("theme") === "light" // (Accessible theme TBD - this assumes accessible is dark for now)
            ? {
                  grid: { line: { stroke: "#bbbbbb" } },
              }
            : {
                  text: { fill: "#bbbbbb" },
                  tooltip: { container: { color: "#111111" } },
                  grid: { line: { stroke: "#444444" } },
              };

    if (!have_data) {
        return <div className="empty-vote-outcome-summary">-</div>;
    }
    return (
        <div className="vote-outcome-summary">
            <ResponsivePie
                data={chart_data}
                animate
                enableArcLabels={false}
                margin={{ top: 20, right: 100, bottom: 30, left: 120 }}
                theme={chart_theme}
            />
        </div>
    );
}

interface UserVoteActionSummaryProps {
    user_id: number;
    report_type?: ReportType;
}

export function UserVoteActionSummary({
    user_id,
    report_type,
}: UserVoteActionSummaryProps): React.ReactElement {
    const [summary_data, setSummaryData] = useState<VoteSummaryData | null>(null);

    // Data fetch
    useEffect(() => {
        let query_url = `players/${user_id}/vote_summary`;

        if (report_type) {
            query_url += `?report_type=${report_type}`;
        }
        const fetchData = async () => {
            const response = await get(query_url);
            const fetchedData: VoteSummaryData = await response;
            setSummaryData(fetchedData);
        };

        fetchData().catch((err) => {
            console.error(err);
        });
    }, [user_id, report_type]);

    if (!summary_data) {
        return <div>Loading...</div>;
    }
    return <VoteSummaryPie summary_data={summary_data} />;
}
