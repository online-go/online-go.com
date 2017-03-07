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
import {OGSComponent} from "components";
import data from "data";

interface PaginatedTableColumnProperties {
    cellProps?: any;
    render: (row) => any | string;
    header: string;
    headerProps?: any;
    sortable?: boolean;
    striped?: boolean;
    className: ((row) => string) | string;
}

type SourceFunction = (filter: any, sorting: Array<string>) => Promise<any>;
type GroupFunction = (data: Array<any>) => Array<any>;

interface PaginatedTableProperties {
    source: string | SourceFunction;
    method?: "get" | "post";
    pageSize?: number;
    columns: Array<PaginatedTableColumnProperties>;
    aliases?: string;
    name?: string;
    className: string;
    filter?: any;
    orderBy?: Array<string>;
    groom?: ((data: Array<any>) => Array<any>);
    onRowClick?: (row) => any;
    debug?: boolean;
    pageSizeOptions?: Array<number>;
    startingPage?: number;
    fillBlankRows?: boolean;
    hidePageControls?: boolean;
    // id?: any,
    // user?: any,
    // callback?: ()=>any,
}

export class PaginatedTable extends OGSComponent<PaginatedTableProperties, any> {
    filter: any = {};
    sorting: Array<string> = [];
    source_url: string;
    source_method: string;
    source_function: SourceFunction;

    constructor(props) {
        super(props);
        this.state = {
            rows: [],
            total: -1,
            page: this.props.startingPage || 1,
            num_pages: 0,
            page_size: 1,
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this.setState({
            page_size: this.props.pageSize || (this.props.name ? data.get(`paginated-table.${this.props.name}.page_size`) : 0) || 10,
        });
        this.filter = this.props.filter || {};
        if (typeof(this.props.source) === "string") {
            this.source_url = this.props.source as string;
            this.source_method = this.props.method || "get";
            this.source_function = this.ajax_loader.bind(this);
        } else {
            this.source_function = this.props.source as SourceFunction;
        }
        setTimeout(() => this.update(), 1);
    }

    setPageSize(n: number|string) {
        let old_page_size = this.state.page_size;
        let page_size = parseInt(n + "");
        if (this.props.name) {
            data.set(`paginated-table.${this.props.name}.page_size`, page_size);
        }
        this.setState({page_size: page_size});
        this.setPage(Math.max(0, ((this.state.page - 1) * old_page_size) / page_size) + 1, true);
    }

    ajax_loader(filter: any, sorting: Array<string>): Promise<any> {
        let query = {
            page_size: this.state.page_size,
            page: this.state.page,
        };
        for (let k in filter) {
            if (
                (
                    (k.indexOf("__istartswith") > 0) ||
                    (k.indexOf("__startswith") > 0) ||
                    (k.indexOf("__icontains") > 0) ||
                    (k.indexOf("__contains") > 0)
                )
                && filter[k] === ""
           ) {
               continue;
           }

            query[k] = filter[k];
        }
        //console.log(query);
        let order_by = this.props.orderBy ? this.props.orderBy.concat(sorting || []) : sorting || [];

        if (order_by.length) {
            query["ordering"] = order_by.join(",");
        }
        if (this.source_method === "get") {
            return get(this.source_url, query);
        }
        return post(this.source_url, query);
    }


    needs_another_update: boolean = false;
    filter_updated() {
        this.setPage(1);
        if (this.updating) {
            this.needs_another_update = true;
        } else {
            this.update();
        }
    }

    updating: boolean = false;
    update() {
        if (this.updating) {
            return;
        }
        this.updating = true;
        this.needs_another_update = false;
        this.source_function(this.filter, this.sorting)
        .then((res) => {
            let new_rows = this.props.groom ? this.props.groom(res.results || []) : res.results || [];

            if (this.props.debug) {
                console.debug("PaginatedTable groomed rows: ", new_rows);
            }

            this.updating = false;
            this.setState({
                total: res.count,
                rows: new_rows,
                num_pages:  Math.ceil(res.count / this.state.page_size),
            });

            if (this.needs_another_update) {
                this.update();
            }
        })
        .catch((err) => {
            this.updating = false;
            console.error(err.stack);

            if (this.needs_another_update) {
                this.update();
            }
        });
    }

    setPage(n: number|string, skip_bounds_check?: boolean) {
        let page = parseInt(n + "");
        if (!skip_bounds_check) {
            page = Math.max(1, Math.min(page, this.state.num_pages));
        }
        this.setState({
            page: page
        });
        setTimeout(() => this.update(), 1);
    }

    _setPageSize = (ev) => {
        this.setPageSize(parseInt(ev.target.value));
    }

    _setPage = (ev) => {
        let n = parseInt(ev.target.value);
        if (isNaN(n)) {
            if (ev.target.value.trim() === "") {
                this.setPage(1);
            }
            return;
        }
        this.setPage(n);
    }
    _select = (ev) => {
        $(ev.target).select();
    }


    render() {
        function cls(row, column): string {
            if (!column.className) {
                return "";
            }
            if (typeof(column.className) === "function") {
                return column.className(row, column);
            }
            return column.className;
        }

        function column_render(column, row): string {
            if (typeof(column.render) === "function") {
                return column.render(row);
            }
            return column.render;
        }

        let extra_classes = [
            this.props.className || "",
            this.props.onRowClick ? "clickable-rows" : "",
        ].join(" ");
        let page_sizes = this.props.pageSizeOptions || [10, 25, 50];
        if (this.props.pageSize) {
            if (page_sizes.indexOf(this.props.pageSize) < 0) {
                page_sizes.push(this.props.pageSize);
            }
        }
        page_sizes.sort();

        let columns = this.props.columns.filter((c) => !!c);
        let ncols = columns.length;

        let blank_rows = [];
        if (this.props.fillBlankRows) {
            for (let i = 0; i < this.state.page_size - this.state.rows.length; ++i) {
                blank_rows.push(<tr key={"blank-" + i}><td className="blank" colSpan={ncols} /></tr>);
            }
        }


        return (
            <div className={"PaginatedTable " + extra_classes}>
                <table className={extra_classes}>
                    <thead>
                        <tr>
                            {columns.map((column, c) => <th key={this.key("th", c)} className={cls(null, column)} {...column.headerProps}>{column.header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.rows.map((row, i) => {
                            let cols = columns.map((column, c) => (
                                <td key={this.key("td", row.id, c)} className={cls(row, column)} {...column.cellProps}>{column_render(column, row)}</td>
                            ));
                            if (this.props.onRowClick) {
                                return (<tr key={this.key("tr", row.id)} onClick={(ev) => this.props.onRowClick(row)}>{cols}</tr>);
                            } else {
                                return (<tr key={this.key("tr", row.id)}>{cols}</tr>);
                            }
                        })}
                        {blank_rows}
                    </tbody>
                </table>
                {(!this.props.hidePageControls || null) &&
                    <div className="page-controls">
                        <div className="left">
                            {this.state.page > 1 ? <i className="fa fa-step-backward" onClick={() => this.setPage(this.state.page - 1)}/> : <i className="fa"/>}
                            <input
                                onChange={this._setPage}
                                onFocus={this._select}
                                value={this.state.page}/>
                                <span className="of"> of </span><span className="total">{this.state.num_pages}</span>
                            {this.state.page < this.state.num_pages ? <i className="fa fa-step-forward" onClick={() => this.setPage(this.state.page + 1)}/> : <i className="fa"/>}
                        </div>
                        <div className="right">
                            {(page_sizes.length > 1 || null) &&
                                <select onChange={this._setPageSize} value={this.state.page_size}>
                                    {page_sizes.map((v, idx) => <option key={idx} value={v}>{v}</option>)}
                                </select>
                            }
                        </div>
                    </div>
                }
            </div>
        );
    }
}
