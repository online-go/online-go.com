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

const SelectTable = selectTableHOC(ReactTable);

import { Player } from "Player";

interface JosekiAdminProps {
    godojo_headers: any;
    server_url: string;
    loadPositionToBoard(pos: string);
}

export class JosekiAdmin extends React.PureComponent<JosekiAdminProps, any> {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            pages: -1,
            loading: false,
            all_selected: false,
            selections: new Map()
        };
    }

    render = () => {
        console.log("Joseki Admin render: selections:", this.state.selections);
        return (
            <div className="audit-container">
                <SelectTable
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
                        this.setState({selections});
                    }}
                    selectAll={this.state.all_selected}
                    toggleAll={() => {
                        console.log("toggle all");
                        let selections = new Map(this.state.selections);
                        const all_selected = !this.state.all_selected;
                        selections.forEach((value, key) => {
                            selections.set(key, all_selected);
                        });
                        this.setState({
                            selections,
                            all_selected
                        });
                    }}
                    onFetchData={(state, instance) => {
                        this.setState({ loading: true });
                        fetch(this.props.server_url +
                            `changes?page=${state.page}&size=${state.pageSize}&sort=a.seq`, {
                            mode: 'cors',
                            headers: this.props.godojo_headers
                        })
                            .then(res => res.json())
                            .then(body => {
                                // initialise selections, so we have the full list of them for select-all operations
                                let selections = new Map();
                                for (const a of body.content) {
                                    selections.set(`select-${a._id}`, false);
                                }
                                this.setState({
                                    selections,
                                    data: body.content,
                                    pages: body.totalPages,
                                    all_selected: false,
                                    loading: false
                                });
                            });
                    }}
                    columns={[
                        {
                            Header: "Pos", accessor: "placement",
                            maxWidth: 60,
                            // Click the placement to see the position on the board
                            getProps: (state, rowInfo, column) => (
                                {
                                    onClick: (e, handleOriginal) => {
                                        this.props.loadPositionToBoard(rowInfo.original.node_id);
                                    }
                                }
                            )
                        },
                        {
                            Header: "User", accessor: "user_id",
                            Cell: props => <Player user={props.value}></Player>
                        },
                        {
                            Header: "Action", accessor: "comment",
                            minWidth: 150
                        },
                        {
                            Header: "Result", accessor: "new_value",
                            minWidth: 300
                        }
                    ]}
                />
            </div>
                );
            }
        }
