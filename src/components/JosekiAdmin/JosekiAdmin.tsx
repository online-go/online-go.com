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
import { _, pgettext, interpolate } from "translate";

import ReactTable from 'react-table';

import selectTableHOC from "react-table/lib/hoc/selectTable";

import { Player } from "Player";

import { JosekiPermissionsPanel } from "JosekiPermissionsPanel";

interface JosekiAdminProps {
    godojo_headers: any;
    server_url: string;
    user_can_administer: boolean;
    loadPositionToBoard(pos: string);
}

const SelectTable = selectTableHOC(ReactTable) ;

export class JosekiAdmin extends React.PureComponent<JosekiAdminProps, any> {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            pages: -1,
            current_page: 0,
            current_pageSize: 15,
            loading: false,
            all_selected: false,
            any_selected: false,
            server_status: "",
            selections: new Map(),
            reversions: new Map(),
            schema_version: ''
        };
    }

    componentDidMount = () => {
        fetch(this.props.server_url + "appinfo/", {
            mode: 'cors',
            headers: this.props.godojo_headers
        })
        .then(res => res.json())
        .then(body => {
            this.setState({schema_version: body.schema_version});
        }).catch((r) => {
            console.log("Appinfo GET failed:", r);
        });
    }

    revertAllSelectedChanges = () => {
        // set up to revert each selected change one at a time...
        let reversions = new Map();
        this.state.selections.forEach((selected, selection) => {
            if (selected) {
                const target_id = selection.substring(7);
                reversions.set(selection, `Reversion of audit ${target_id} pending`);
            }
        });
        this.setState({reversions: reversions});
        this.revertSelectedChanges(this.state.selections);
    }

    //  Call the server to revert each selected item in turn (one at a time, for ease of understanding what happened)
    revertSelectedChanges = (current_selections) => {
        let selections = current_selections.keys();
        let {value: next_selection, done: done} = selections.next();

        // Find next actually selected item.
        while (!current_selections.get(next_selection) && !done) {
            ({value: next_selection, done: done} = selections.next());
        }
        // And if there was one, revert it then move on to the next after the previous is done.
        if (current_selections.get(next_selection)) {
            const target_id = next_selection.substring(7);  //  get rid of the wierd "select-" from SelectTable
            console.log("Revert requested for ", target_id);
            fetch(this.props.server_url + "revert/", {
                method: 'post',
                mode: 'cors',
                headers: this.props.godojo_headers,
                body: JSON.stringify({ audit_id: target_id})
            }).then (res => res.json())
            .then (body => {
                // Display the result of what happened
                console.log("reversion result", body);
                let next_selections = new Map(current_selections);
                next_selections.set(next_selection, false);
                let next_reversions = new Map(this.state.reversions);
                next_reversions.set(next_selection, `Reversion of audit ${target_id} status: ${body.result}`);
                this.setState({
                    selections: next_selections,
                    reversions: next_reversions
                });

                // get on with the next one, if there are more
                this.revertSelectedChanges(next_selections);
            }).catch((r) => {
                console.log("Revert POST failed:", r);
            });
        }
        else {
            // There are no more reversions to be done, so reload the audit log to show the ones that were done
            this.reloadData();
            this.props.loadPositionToBoard("root"); // and reset the board, incase the status of what is displayed changed
        }
    }

    reloadData = () => {
        fetch(this.props.server_url +
            `changes?page=${this.state.current_page}&size=${this.state.current_pageSize}`, {
            mode: 'cors',
            headers: this.props.godojo_headers
        })
        .then(res => res.json())
        .then(body => {
            // initialise selections, so we have the full list of them for select-all operations
            let selections = new Map();
            for (const a of body.content) {
                const key = `select-${a._id}`;
                selections.set(key, false);
            }
            this.setState({
                selections,
                data: body.content,
                pages: body.totalPages,
                all_selected: false,
                loading: false
            });
        }).catch((r) => {
            console.log("Changes GET failed:", r);
        });
    }

    fetchDataForTable = (table_state, instance) => {
        // this shinanigans is so that we save the table state passed in the argument to this callback
        // into our component state, enabling us to reload the data again when we need to (after reverting an audit)
        this.setState({
            loading: true,
            current_page: table_state.page,
            current_pageSize: table_state.pageSize
        }, this.reloadData);
    }

    render = () => {
        console.log("Joseki Admin render");

        // Don't let the user select rows if they can't actually do anything with them.
        const AuditTable = this.props.user_can_administer ?
            SelectTable : ReactTable;

        return (
            <div className="audit-container">
                {this.props.user_can_administer &&
                 <div className="audit-actions">
                    <button className={"btn" + (this.state.any_selected ? " danger" : "disabled")} onClick={this.revertAllSelectedChanges}>
                        {_("Revert")}
                    </button>
                </div>
                }
                {this.state.reversions.size > 0 &&
                    [...this.state.reversions.values()].map((reversion, idx) => (<div key={idx}>{reversion}</div>))
                }
                <AuditTable
                    showPaginationBottom
                    pageSizeOptions={[5, 10, 15, 30, 50, 100]}
                    data={this.state.data}
                    pages={this.state.pages}
                    loading={this.state.loading}
                    defaultPageSize={15}
                    minRows={10}
                    manual
                    selectType={'checkbox'}
                    isSelected={(key) => {
                        let key_string = `select-${key}`;
                        let result = this.state.selections.has(key_string) && this.state.selections.get(key_string);
                        //console.log(`check for ${key_string}:`, result);
                        return result;
                    }}
                    toggleSelection={(key) => {
                        let selections = new Map(this.state.selections);
                        selections.set(key, selections.has(key) ? !selections.get(key) : true);
                        this.setState({
                            any_selected: Array.from(selections.values()).includes(true),
                            selections
                        });
                    }}
                    selectAll={this.state.all_selected}
                    toggleAll={() => {
                        const all_selected = !this.state.all_selected;
                        let selections = new Map(this.state.selections);
                        selections.forEach((value, key) => {
                            selections.set(key, all_selected);
                        });
                        this.setState({
                            any_selected: Array.from(selections.values()).includes(true),
                            selections,
                            all_selected
                        });
                    }}
                    onFetchData={this.fetchDataForTable}
                    columns={[
                        {
                            Header: "At", accessor: "placement",
                            maxWidth: 60,
                            // Click the placement to see the position on the board
                            getProps: (state, rowInfo, column) => (
                                {
                                    onClick: (e, handleOriginal) => {
                                        this.props.loadPositionToBoard(rowInfo.original.node_id);
                                    },
                                    className: "position-link"
                                }
                            )
                        },
                        {
                            Header: "User", accessor: "user_id",
                            Cell: props => <Player user={props.value}></Player>
                        },
                        {
                            Header: "Date", accessor: "date",
                        },
                        {
                            Header: "Action", accessor: "comment",
                            minWidth: 200
                        },
                        {
                            Header: "Result", accessor: "new_value",
                            minWidth: 250
                        }
                    ]}
                />
                {this.props.user_can_administer &&
                <div className="bottom-admin-stuff">
                    <div className="user-admin">
                        <div>Permissions Admin</div>
                        <JosekiPermissionsPanel
                            godojo_headers={this.props.godojo_headers}
                            server_url={this.props.server_url}
                        />
                    </div>
                    <div className="admin-info">
                        Schema version: {this.state.schema_version}
                    </div>
                </div>
                }
            </div>
        );
    }
}
