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

import React, { useEffect } from "react";

import { get } from "@/lib/requests";

import { useUser } from "@/lib/hooks";
import { PaginatedTable } from "@/components/PaginatedTable";
import { Player } from "@/components/Player";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { llm_pgettext, pgettext, _ } from "@/lib/translate";
import { UserVoteActivityGraph } from "@/views/User";

import { CMPieCharts } from "@/views/User";
import {
    CMVoteCountGraph,
    CMVotingGroupGraph,
    ReportAlignmentCount,
    ReportCount,
} from "@/components/CMVotingGroupGraph";
import { useNavigate } from "react-router-dom";

interface SystemPerformanceData {
    [reportType: string]: {
        created: string;
        report_id?: number; // Optional since regular users won't have this
    };
}

interface CMVotingOutcomeData {
    [reportType: string]: ReportCount[];
}

interface CMGroupVotingAlignmentData {
    [reportType: string]: ReportAlignmentCount[];
}

interface IndividualCMVotingOutcomeData {
    user_id: number;
    vote_data: CMVotingOutcomeData;
}
export function ReportsCenterCMDashboard(): React.ReactElement {
    const user = useUser();
    const navigateTo = useNavigate();
    const [selectedTabIndex, setSelectedTabIndex] = React.useState(user.moderator_powers ? 0 : 1);
    const [vote_data, setVoteData] = React.useState<CMGroupVotingAlignmentData | null>(null);
    const [users_data, setUsersData] = React.useState<CMVotingOutcomeData | null>(null);
    const [system_data, setSystemData] = React.useState<SystemPerformanceData | null>(null);

    useEffect(() => {
        handleTabSelect(selectedTabIndex);
    }, []);

    // Use tab selection to fetch data for tabs that need this done for them
    const handleTabSelect = (index: number) => {
        setSelectedTabIndex(index);

        if (index === 1 && !vote_data) {
            fetchVoteData();
        } else if (index === 3 && !users_data) {
            fetchUsersData();
        } else if (index === 4 && !system_data) {
            fetchSystemData();
        }
    };

    const fetchVoteData = () => {
        get(`moderation/cm_voting_outcomes?period=60`)
            .then((response) => {
                const fetchedData: CMGroupVotingAlignmentData = response;
                setVoteData(fetchedData);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const fetchUsersData = () => {
        get(`me/cm_vote_outcomes?period=60`)
            .then((response) => {
                const fetchedData: IndividualCMVotingOutcomeData = response;
                setUsersData(fetchedData["vote_data"]);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const fetchSystemData = () => {
        get(`moderation/system_performance`)
            .then((response) => {
                const fetchedData: SystemPerformanceData = response;
                const currentDate = new Date();

                const performanceAsAge: SystemPerformanceData = Object.fromEntries(
                    Object.entries(fetchedData).map(([reportType, data]) => {
                        const date = new Date(data.created);
                        const age = Math.floor(
                            (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60),
                        ); // age in hours
                        return [
                            reportType,
                            {
                                created: age.toString(),
                                ...(data.report_id && { report_id: data.report_id }),
                            },
                        ];
                    }),
                );
                setSystemData(performanceAsAge);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    return (
        <Tabs
            className="ReportsCenterCMInfo"
            selectedIndex={selectedTabIndex}
            onSelect={handleTabSelect}
        >
            <TabList>
                <Tab disabled={!user.moderator_powers}>
                    {pgettext("This is a title of a page showing summary graphs", "My Summary")}
                </Tab>
                <Tab>
                    {pgettext(
                        "This is a title of a page showing graphs of Community Moderation outcomes",
                        "Group Outcomes",
                    )}
                </Tab>
                <Tab disabled={!user.is_moderator}>
                    {pgettext(
                        "This is a title of a page showing graphs of individual Community Moderators' votes",
                        "Individual Votes",
                    )}
                </Tab>
                <Tab disabled={!user.moderator_powers}>
                    {pgettext(
                        "This is a title of a page showing a Community Moderator how their votes turned out",
                        "My Votes",
                    )}
                </Tab>
                <Tab>
                    {pgettext(
                        "This is a title of a page showing graphs how the report system is performing",
                        "System Performance",
                    )}
                </Tab>
            </TabList>

            {/* My Summary: A CM's Summary Pie Charts */}
            <TabPanel>
                <div className="mod-graph-header">
                    {pgettext(
                        "header for a graph showing how often the moderator voted with the others",
                        "'consensus' votes (by week)",
                    )}
                </div>
                <div>
                    <UserVoteActivityGraph user_id={user.id} />
                </div>
                <h3>{llm_pgettext("A heading for a 'vote outcomes' table", "Vote Outcomes")}</h3>
                <h4>
                    {llm_pgettext(
                        "explanatory text",
                        "Outcomes since the last 'consensus rules' update",
                    )}
                </h4>
                <CMPieCharts user_id={user.id} user_moderator_powers={user.moderator_powers} />
            </TabPanel>

            {/* Group Outcomes: The overall CM voting outcomes */}
            <TabPanel>
                {vote_data ? (
                    ["overall", "escaping", "stalling", "score_cheating"].map((report_type) => (
                        <div key={report_type}>
                            <h3>{report_type}</h3>
                            {vote_data[report_type] ? (
                                <CMVotingGroupGraph
                                    vote_data={vote_data[report_type]}
                                    period={60}
                                />
                            ) : (
                                "no data"
                            )}
                        </div>
                    ))
                ) : (
                    <p>{_("loading...")}</p>
                )}
            </TabPanel>

            {/* Individual Votes: Moderator view of each CM's vote categories */}
            <TabPanel>
                <PaginatedTable
                    pageSize={4} /* Limit aggregation compute load */
                    pageSizeOptions={[1, 4]}
                    className="individual-overview"
                    name="individual-overview"
                    source={"moderation/cm_individual_outcomes"}
                    columns={[
                        {
                            header: "CM",
                            className: () => "cm-name",
                            render: (X) => <Player user={X.user_id} />,
                        },
                        {
                            header: "summaries",
                            className: () => "votes",
                            render: (X) => (
                                <CMVoteCountGraph vote_data={X.vote_data["overall"]} period={60} />
                            ),
                        },
                    ]}
                />
            </TabPanel>

            {/* My Votes: A CM's individual vote categories */}
            <TabPanel>
                {users_data ? (
                    ["overall", "escaping", "stalling", "score_cheating"].map((report_type) => (
                        <div key={report_type}>
                            <h3>{report_type}</h3>
                            {users_data[report_type] ? (
                                <CMVoteCountGraph
                                    vote_data={users_data[report_type]}
                                    period={120}
                                />
                            ) : (
                                "no data"
                            )}
                        </div>
                    ))
                ) : (
                    <p>{_("loading...")}</p>
                )}
            </TabPanel>

            {/* System Performance: Info about how the report system is performing */}
            <TabPanel>
                <h3>{_("System Performance - oldest open reports")}</h3>
                {system_data ? (
                    <ul>
                        {Object.entries(system_data).map(([reportType, data]) => {
                            const ageInHours = parseInt(data.created, 10);
                            let displayAge;
                            if (ageInHours < 24) {
                                displayAge = `${ageInHours} hour${ageInHours !== 1 ? "s" : ""}`;
                            } else {
                                const days = Math.floor(ageInHours / 24);
                                const hours = ageInHours % 24;
                                displayAge = `${days} day${days !== 1 ? "s" : ""}`;
                                if (hours > 0) {
                                    displayAge += ` and ${hours} hour${hours !== 1 ? "s" : ""}`;
                                }
                            }
                            return (
                                <li key={reportType}>
                                    {reportType}: {displayAge}
                                    {data.report_id && (
                                        <button
                                            onClick={() =>
                                                navigateTo(`/reports-center/all/${data.report_id}`)
                                            }
                                            className="small"
                                        >
                                            {`R${data.report_id.toString().slice(-3)}`}
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p>{_("loading...")}</p>
                )}
            </TabPanel>
        </Tabs>
    );
}
