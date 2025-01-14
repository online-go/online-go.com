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
import * as data from "@/lib/data";
import { Link } from "react-router-dom";
import { _ } from "@/lib/translate";
import { PaginatedTable } from "@/components/PaginatedTable";
import { SearchInput } from "@/components/misc-ui";
import { navigateTo } from "@/lib/misc";
import { useUser } from "@/lib/hooks";

export function GroupList(): React.ReactElement {
    const user = useUser();
    const [name_contains_filter, setNameContainsFilter] = React.useState("");

    const my_groups = data.get("cached.groups", []);

    React.useEffect(() => {
        window.document.title = _("Groups");
    }, []);

    console.log(my_groups);

    return (
        <div className="page-width">
            <div className="GroupList">
                <div className="page-nav">
                    <h2>
                        <i className="fa fa-users"></i> {_("Groups")}
                    </h2>
                    <div>
                        {(!user.anonymous || null) && (
                            <Link className="primary" to="/group/create">
                                <i className="fa fa-plus-square"></i> {_("New group")}
                            </Link>
                        )}

                        <SearchInput
                            placeholder={_("Search")}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                setNameContainsFilter(event.target.value.trim());
                            }}
                        />
                    </div>
                </div>

                <div className="group-list-container">
                    <PaginatedTable
                        className=""
                        name="game-history"
                        source={`groups/`}
                        orderBy={["-member_count"]}
                        filter={{
                            ...(name_contains_filter !== "" && {
                                name__icontains: name_contains_filter,
                            }),
                        }}
                        onRowClick={(row, ev) => navigateTo(`/group/${row.id}`, ev)}
                        columns={[
                            {
                                header: "",
                                className: "group-icon-header",
                                render: (X) => (
                                    <img
                                        className="group-icon"
                                        src={X.icon}
                                        width="64"
                                        height="64"
                                    />
                                ),
                            },
                            {
                                header: _("Group"),
                                className: () => "name",
                                render: (X) => (
                                    <div className="group-name">
                                        <div>
                                            <div style={{ fontWeight: "bold" }}>{X.name}</div>
                                            <div style={{ fontStyle: "italic" }}>{X.summary}</div>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                header: _("Members"),
                                className: () => "member-count",
                                render: (X) => X.member_count,
                            },
                        ]}
                    />

                    {my_groups.length > 0 && (
                        <div className="MyGroups">
                            <h3>{_("My groups")}</h3>
                            {my_groups.sort(group_sort_fn).map((group) => (
                                <div key={group.id} className="group-item">
                                    <Link to={`/group/${group.id}`}>
                                        <img
                                            className="group-icon"
                                            src={group.icon}
                                            width="16"
                                            height="16"
                                        />
                                        {group.name} ({group.member_count})
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function group_sort_fn(a: { name: string }, b: { name: string }) {
    const a_name = a.name.toLowerCase();
    const b_name = b.name.toLowerCase();

    if (a_name < b_name) {
        return -1;
    } else if (a_name > b_name) {
        return 1;
    } else {
        return 0;
    }
}
