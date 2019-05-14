/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import {browserHistory} from "ogsHistory";
import {PaginatedTable} from "PaginatedTable";
import {SearchInput} from "misc-ui";
import {navigateTo} from "misc";


interface GroupListProperties {
}

export class GroupList extends React.PureComponent<GroupListProperties, any> {
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
        <div className="page-width">
            <div className="GroupList">

                <div className="page-nav">
                    <h2><i className="fa fa-users"></i> {_("Groups")}</h2>
                    <div>
                        <a className="primary" href="/group/create"><i className="fa fa-plus-square"></i> {_("New group")}</a>

                        <SearchInput
                            placeholder={_("Search")}
                            onChange={(event) => {
                                this.refs.table.filter.name__istartswith = (event.target as HTMLInputElement).value.trim();
                                this.refs.table.filter_updated();
                            }}
                        />
                    </div>
                </div>

                <div className="group-list-container">
                    <PaginatedTable
                        className=""
                        ref="table"
                        name="game-history"
                        source={`groups/`}
                        orderBy={["-member_count"]}
                        filter={{ "name__istartswith": "" }}
                        onRowClick={(row, ev) => navigateTo(`/group/${row.id}`, ev)}
                        columns={[
                            {header: "",  className: "group-icon-header",
                                render: (X) => (<img className='group-icon' src={X.icon} width="64" height="64" />)},
                            {header: _("Group"),  className: () => "name",
                             render: (X) => (
                                 <div className="group-name">
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

                </div>
            </div>
        </div>
        );
    }
}
