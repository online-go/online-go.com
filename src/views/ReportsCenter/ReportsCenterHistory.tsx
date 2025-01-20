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
import { useNavigate, Link } from "react-router-dom";
import { PaginatedTable } from "@/components/PaginatedTable";
import { Player } from "@/components/Player";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";

export function ReportsCenterHistory(): React.ReactElement {
    const navigateTo = useNavigate();
    const [reportingUserFilter, setReportingUserFilter] = React.useState<number>();

    return (
        <div className="ReportsCenterHistory">
            <div className="history-options">
                <div className="search">
                    <i className="fa fa-search"></i>
                    <PlayerAutocomplete
                        placeholder={"Reporter name"}
                        onComplete={(player) => {
                            // happily, and importantly, if there isn't a player, then we get null
                            setReportingUserFilter(player?.id);
                        }}
                    />
                </div>
            </div>
            <PaginatedTable
                className="history"
                name="reports-appeals"
                source={"moderation/incident"}
                filter={
                    reportingUserFilter !== null && reportingUserFilter !== undefined
                        ? {
                              reporting_user: reportingUserFilter,
                          }
                        : undefined
                }
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
                        header: "Moderator",
                        className: () => "moderator",
                        render: (X) => X.moderator && <Player user={X.moderator} />,
                    },
                    {
                        header: "Reporter",
                        className: () => "state",
                        render: (X) =>
                            X.reporting_user ? <Player user={X.reporting_user} /> : "System",
                    },
                    {
                        header: "Type",
                        className: () => "report_type",
                        render: (X) => X.report_type,
                    },
                    {
                        header: "Reported",
                        className: () => "reported",
                        render: (X) => (
                            <>
                                {X.reported_user && <Player user={X.reported_user} />}{" "}
                                {X.reported_game && (
                                    <Link to={`/game/${X.reported_game}`}>#{X.reported_game}</Link>
                                )}{" "}
                                {X.reported_review && (
                                    <Link to={`/review/${X.reported_review}`}>
                                        ##{X.reported_review}
                                    </Link>
                                )}
                            </>
                        ),
                    },
                    {
                        header: "State",
                        className: (X) => `state ${X?.state}`,
                        render: (X) => X.state,
                    },
                    {
                        header: "Note",
                        className: () => "note",
                        render: (X) =>
                            (X.reporter_note_translation?.target_text || X.reporter_note).substring(
                                0,
                                30,
                            ),
                    },
                ]}
            />
        </div>
    );
}
