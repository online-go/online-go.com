/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {browserHistory} from "react-router";
import {OGSComponent, AdUnit, PaginatedTable, SearchInput} from "components";

interface GroupListProperties {
}

export class GroupList extends OGSComponent<GroupListProperties, any> {
    refs: {
        table
    };

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        return (
        <div className="GroupList">
            <AdUnit unit="cdm-zone-01"/>

            <div className="group-list-container">
                <SearchInput
                    className="pull-right"
                    placeholder={_("Search")}
                    onChange={(event) => {
                        this.refs.table.filter.name__istartswith = (event.target as HTMLInputElement).value.trim();
                        this.refs.table.filter_updated();
                    }}
                />

                <PaginatedTable
                    className=""
                    ref="table"
                    name="game-history"
                    source={`groups/`}
                    orderBy={["-member_count"]}
                    filter={{ "name__istartswith": "" }}
                    onRowClick={(row) => browserHistory.push(`/group/${row.id}`)}
                    columns={[
                        {header: _("Group"),  className: () => "name",
                         render: (X) => (
                             <div className="group-name">
                                <img src={X.icon} width="64" height="64" style={{marginRight: "1em", float: "left", maxHeight: "64px", maxWidth: "64px"}} />
                                <div>
                                    <div style={{fontWeight: "bold"}}>{X.name}</div>
                                    <div style={{fontStyle: "italic"}}>
                                        {X.summary}
                                    </div>
                                </div>
                             </div>
                         )
                        },
                        {header: _("Members"), className: () => "member-count",                    render: (X) => X.member_count},
                    ]}
                />

                <div className="start-a-new-group">
                    {_("Want to start a new group?")} <a className="primary" href="/group/create">{_("Create a group here!")}</a>
                </div>
            </div>
        </div>
        );
    }
}
