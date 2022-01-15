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

import ReactTable from "react-table";

import selectTableHOC from "react-table/lib/hoc/selectTable";

import { openModal } from "Modal";
import { Player } from "Player";

import { JosekiPermissionsPanel } from "JosekiPermissionsPanel";
import { JosekiPageVisits, JosekiStatsModal } from "JosekiStatsModal";

interface JosekiAdminProps {
    oje_headers: HeadersInit;
    server_url: string;
    user_can_administer: boolean; // allows them to revert changes, give permissions etc
    user_can_edit: boolean; // allows them to filter
    db_locked_down: boolean;
    loadPositionToBoard(pos: string);
    updateDBLockStatus(value: boolean);
}

interface JosekiAdminState {
    data: any[];
    pages: number;
    current_page: number;
    current_pageSize: number;
    loading: boolean;
    all_selected: boolean;
    any_selected: boolean;
    server_status: string;
    selections: Map<string, boolean>;
    reversions: Map<string, string>;
    schema_version: string;
    filter_user_id: string;
    filter_position_id: string;
    filter_audit_type: string;
    page_visits?: string;
    daily_visits: JosekiPageVisits[];
}

const AuditTypes = [
    "CREATED",
    "CATEGORY_CHANGE",
    "DESCRIPTION_CHANGE",
    "SOURCE_CHANGE",
    "ADD_CHILD",
    "REMOVE_CHILD",
    "ADD_COMMENT",
    "REMOVE_COMMENT",
    "DEACTIVATE",
    "REACTIVATE",
];

const SelectTable = selectTableHOC(ReactTable);

export class JosekiAdmin extends React.PureComponent<JosekiAdminProps, JosekiAdminState> {
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
            schema_version: "",
            filter_user_id: "",
            filter_position_id: "",
            filter_audit_type: "",
            page_visits: null,
            daily_visits: [],
        };
    }

    componentDidMount = () => {
        fetch(this.props.server_url + "appinfo", {
            mode: "cors",
            headers: this.props.oje_headers,
        })
            .then((res) => res.json())
            .then((body) => {
                console.log("App info", body);
                this.setState({
                    schema_version: body.schema_version,
                    page_visits: body.page_visits,
                    daily_visits: body.daily_visits,
                });
            })
            .catch((r) => {
                console.log("Appinfo GET failed:", r);
            });
    };

    revertAllSelectedChanges = () => {
        // set up to revert each selected change one at a time...
        const reversions = new Map();
        this.state.selections.forEach((selected, selection) => {
            if (selected) {
                const target_id = selection.substring(7);
                reversions.set(selection, `Reversion of audit ${target_id} pending`);
            }
        });
        this.setState({ reversions: reversions });
        this.revertSelectedChanges(this.state.selections);
    };

    //  Call the server to revert each selected item in turn (one at a time, for ease of understanding what happened)
    revertSelectedChanges = (current_selections: Map<string, boolean>) => {
        const selections = current_selections.keys();
        let { value: next_selection, done: done } = selections.next();

        // Find next actually selected item.
        while (!current_selections.get(next_selection) && !done) {
            ({ value: next_selection, done: done } = selections.next());
        }
        // And if there was one, revert it then move on to the next after the previous is done.
        if (current_selections.get(next_selection)) {
            const target_id = next_selection.substring(7); //  get rid of the wierd "select-" from SelectTable
            // console.log("Revert requested for ", target_id);
            fetch(this.props.server_url + "revert", {
                method: "post",
                mode: "cors",
                headers: this.props.oje_headers,
                body: JSON.stringify({ audit_id: target_id }),
            })
                .then((res) => res.json())
                .then((body) => {
                    // Display the result of what happened
                    // console.log("reversion result", body);
                    const next_selections = new Map(current_selections);
                    next_selections.set(next_selection, false);
                    const next_reversions = new Map(this.state.reversions);
                    next_reversions.set(next_selection, `Reversion of audit ${target_id} status: ${body.result}`);
                    this.setState({
                        selections: next_selections,
                        reversions: next_reversions,
                    });

                    // get on with the next one, if there are more
                    this.revertSelectedChanges(next_selections);
                })
                .catch((r) => {
                    console.log("Revert POST failed:", r);
                });
        } else {
            // There are no more reversions to be done, so reload the audit log to show the ones that were done
            //console.log("...reversions done.")
            this.reloadData();
            this.props.loadPositionToBoard("root"); // and reset the board, incase the status of what is displayed changed
        }
    };

    // note: django back-end pager starts at page 1, our paged display component starts at page zero
    reloadData = () => {
        let audits_url =
            this.props.server_url +
            `changes?page=${this.state.current_page + 1}&page_size=${this.state.current_pageSize}`;

        if (this.state.filter_position_id !== "") {
            audits_url += `&position_id=${this.state.filter_position_id}`;
        }
        // note that the back end currently doesn't support multiple filters, but one day it might...
        if (this.state.filter_user_id !== "") {
            audits_url += `&user_id=${this.state.filter_user_id}`;
        }

        if (this.state.filter_audit_type !== "") {
            audits_url += `&audit_type=${this.state.filter_audit_type}`;
        }

        fetch(audits_url, {
            mode: "cors",
            headers: this.props.oje_headers,
        })
            .then((res) => res.json())
            .then((body) => {
                // initialise selections, so we have the full list of them for select-all operations
                const selections = new Map();
                for (const a of body.results) {
                    const key = `select-${a._id}`;
                    selections.set(key, false);
                }
                this.setState({
                    selections,
                    data: body.results,
                    pages: body.num_pages,
                    all_selected: false,
                    loading: false,
                });
            })
            .catch((r) => {
                console.log("Changes GET failed:", r);
            });
    };

    fetchDataForTable = (table_state, instance) => {
        // this shinanigans is so that we save the table state passed in the argument to this callback
        // into our component state, enabling us to reload the data again when we need to (after reverting an audit)
        this.setState(
            {
                loading: true,
                current_page: table_state.page,
                current_pageSize: table_state.pageSize,
            },
            this.reloadData,
        );
    };

    onUserIdChange = (e) => {
        const new_id = e.target.value;
        if (!/^\d*$/.test(new_id)) {
            return;
        } else {
            this.setState({ filter_user_id: new_id }, this.reloadData);
        }
    };

    onFilterPositionChange = (e) => {
        const new_id = e.target.value;
        if (!/^\d*$/.test(new_id)) {
            return;
        } else {
            this.setState({ filter_position_id: new_id }, this.renderFilteredPosition);
        }
    };

    renderFilteredPosition = () => {
        this.reloadData();
        this.props.loadPositionToBoard(this.state.filter_position_id);
    };

    onFilterAuditTypeChange = (e) => {
        this.setState({ filter_audit_type: e.target.value }, this.reloadData);
    };

    showVisitStats = () => {
        openModal(<JosekiStatsModal fastDismiss daily_page_visits={this.state.daily_visits} />);
    };

    toggleLockdown = () => {
        const lockdown_url = this.props.server_url + "lockdown?lockdown=" + !this.props.db_locked_down;

        fetch(lockdown_url, {
            method: "put",
            mode: "cors",
            headers: this.props.oje_headers,
        })
            .then(() => {
                this.props.updateDBLockStatus(!this.props.db_locked_down);
            })
            .catch((r) => {
                console.log("Toggle lockdown failed:", r);
            });
    };

    render = () => {
        // console.log("Joseki Admin render");

        // Don't let the user select rows if they can't actually do anything with them.
        const AuditTable = this.props.user_can_administer ? SelectTable : ReactTable;

        const audit_type_selections = Object.keys(AuditTypes).map((selection, i) => (
            <option key={i} value={AuditTypes[selection]}>
                {AuditTypes[selection].toLowerCase()}
            </option>
        ));

        audit_type_selections.unshift(<option key={-1} value=""></option>);

        const reversions = Array.from(this.state.reversions.values());

        return (
            <div className="audit-container">
                {this.props.user_can_edit && (
                    <div className="audit-actions">
                        <div className="audit-filters">
                            <div className="audit-filter">
                                <div>Filter by position:</div>
                                <input value={this.state.filter_position_id} onChange={this.onFilterPositionChange} />
                            </div>
                            <div
                                className={
                                    "audit-filter" +
                                    (this.state.filter_position_id === "" ? "" : " audit-filter-overridden")
                                }
                            >
                                <div>Filter by user (id):</div>
                                <input value={this.state.filter_user_id} onChange={this.onUserIdChange} />
                                <span>
                                    (<Player user={parseInt(this.state.filter_user_id)} />)
                                </span>
                            </div>
                            <div
                                className={
                                    "audit-filter" +
                                    (this.state.filter_position_id === "" && this.state.filter_user_id === ""
                                        ? ""
                                        : " audit-filter-overridden")
                                }
                            >
                                <div>Filter by type:</div>
                                <select value={this.state.filter_audit_type} onChange={this.onFilterAuditTypeChange}>
                                    {audit_type_selections}
                                </select>
                            </div>
                        </div>
                        {this.props.user_can_administer && (
                            <button
                                className={"btn" + (this.state.any_selected ? " danger" : "disabled")}
                                onClick={this.revertAllSelectedChanges}
                            >
                                {_("Revert")}
                            </button>
                        )}
                    </div>
                )}
                {reversions.length > 0 && reversions.map((reversion, idx) => <div key={idx}>{reversion}</div>)}
                <AuditTable
                    showPaginationBottom
                    pageSizeOptions={[5, 10, 15, 30, 50, 100]}
                    data={this.state.data}
                    pages={this.state.pages}
                    loading={this.state.loading}
                    defaultPageSize={15}
                    minRows={10}
                    manual
                    selectType={"checkbox"}
                    isSelected={(key) => {
                        const key_string = `select-${key}`;
                        const result = this.state.selections.has(key_string) && this.state.selections.get(key_string);
                        //console.log(`check for ${key_string}:`, result);
                        return result;
                    }}
                    toggleSelection={(key) => {
                        const selections = new Map(this.state.selections);
                        selections.set(key, selections.has(key) ? !selections.get(key) : true);
                        this.setState({
                            any_selected: Array.from(selections.values()).includes(true),
                            selections,
                        });
                    }}
                    selectAll={this.state.all_selected}
                    toggleAll={() => {
                        const all_selected = !this.state.all_selected;
                        const selections = new Map(this.state.selections);
                        selections.forEach((value, key) => {
                            selections.set(key, all_selected);
                        });
                        this.setState({
                            any_selected: Array.from(selections.values()).includes(true),
                            selections,
                            all_selected,
                        });
                    }}
                    onFetchData={this.fetchDataForTable}
                    columns={[
                        {
                            Header: _("At"), // translators: This is the header field for move coordinates on the joseki admin audit table
                            accessor: "placement",
                            maxWidth: 60,
                            // Click the placement to see the position on the board
                            getProps: ((state, rowInfo, column) => ({
                                onClick: (e, handleOriginal) => {
                                    this.props.loadPositionToBoard(rowInfo.original.node_id.toString());
                                },
                                className: "position-link",
                            })) as any,
                        },
                        {
                            Header: _("User"),
                            accessor: "user_id",
                            Cell: (props) => <Player user={props.value}></Player>,
                        },
                        {
                            Header: _("Date"),
                            accessor: "date",
                        },
                        {
                            Header: _("Action"),
                            accessor: "comment",
                            minWidth: 200,
                        },
                        {
                            Header: _("Result"),
                            accessor: "new_value",
                            minWidth: 250,
                        },
                    ]}
                />
                <div className="explorer-stats">
                    <span>Page visits: {this.state.page_visits || "..."}</span>
                    <button className="btn s" onClick={this.showVisitStats}>
                        details
                    </button>
                </div>

                {this.props.user_can_administer && (
                    <div className="bottom-admin-stuff">
                        <div className="user-admin">
                            <div>{_("Permissions Admin")}</div>
                            <JosekiPermissionsPanel
                                oje_headers={this.props.oje_headers}
                                server_url={this.props.server_url}
                            />
                        </div>
                        <div className="misc-admin">
                            <button className={"btn"} onClick={this.toggleLockdown}>
                                {this.props.db_locked_down ? _("Unlock") : _("Lockdown")}
                            </button>
                            <span>
                                {_("Schema version")}: {this.state.schema_version}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    };
}
