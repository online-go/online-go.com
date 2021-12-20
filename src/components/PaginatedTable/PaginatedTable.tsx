/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import {deepCompare} from "misc";
import * as data from "data";

interface PaginatedTableColumnProperties<EntryT> {
    cellProps?: any;
    render: (row: EntryT) => JSX.Element | string | number;
    header: string;
    headerProps?: any;
    sortable?: boolean;
    striped?: boolean;
    className?: ((row) => string) | string;
    orderBy?: Array<string>;
}

type PaginatedObject<EntryT> = { results: EntryT[]; count: number };
type SourceFunction<EntryT> = (filter: any, sorting: Array<string>) => Promise<PaginatedObject<EntryT>>;

interface PaginatedTableProperties<RawEntryT, GroomedEntryT = RawEntryT> {
    source: string | SourceFunction<RawEntryT>;
    method?: "get" | "post";
    pageSize?: number;
    columns: Array<PaginatedTableColumnProperties<GroomedEntryT>>;
    aliases?: string;
    name?: string;
    className: string;
    filter?: any;
    orderBy?: Array<string>;
    groom?: ((data: Array<RawEntryT>) => Array<GroomedEntryT>);
    onRowClick?: (row, ev) => any;
    debug?: boolean;
    pageSizeOptions?: Array<number>;
    startingPage?: number;
    fillBlankRows?: boolean;
    hidePageControls?: boolean;
}

interface PaginatedTableState {
    rows: any[];
    total: number;
    page: number;
    num_pages: number;
    page_size: number;
    orderBy: string[];
}

export class PaginatedTable<RawEntryT = any, GroomedEntryT = RawEntryT> extends React.Component<PaginatedTableProperties<RawEntryT, GroomedEntryT>, PaginatedTableState> {
    sorting: Array<string> = [];
    source_url: string;
    source_method: string;
    source_function: SourceFunction<RawEntryT>;

    constructor(props) {
        super(props);
        this.state = {
            rows: [],
            total: -1,
            page: this.props.startingPage || 1,
            num_pages: 0,
            page_size: 1,
            orderBy: this.props.orderBy,
        };
    }

    componentDidMount() {
        this.setState({
            page_size: this.props.pageSize || (this.props.name ? data.get(`paginated-table.${this.props.name}.page_size`) : 0) || 10,
        });
        this.update_source();
        setTimeout(() => this.update(), 1);
    }

    componentDidUpdate(prevProps) {
        if (this.props.source !== prevProps.source) {
            this.update_source();
        }
        setTimeout(() => this.update(), 1);
    }

    update_source = () => {
        if (typeof(this.props.source) === "string") {
            this.source_url = this.props.source as string;
            this.source_method = this.props.method || "get";
            this.source_function = this.ajax_loader.bind(this);
        } else {
            this.source_function = this.props.source;
        }
    };

    shouldComponentUpdate(nextProps, nextState) {
        return !deepCompare(this.props, nextProps) || !deepCompare(this.state, nextState);
    }

    setPageSize(n: number|string) {
        const old_page_size = this.state.page_size;
        const page_size = parseInt(n + "");
        if (this.props.name) {
            data.set(`paginated-table.${this.props.name}.page_size`, page_size);
        }
        this.setState({page_size: page_size});
        this.setPage(Math.max(0, ((this.state.page - 1) * old_page_size) / page_size) + 1, true);
    }

    ajax_loader(filter: any, sorting: Array<string>): Promise<RawEntryT> {
        const query = {
            page_size: this.state.page_size,
            page: this.state.page,
        };
        for (const k in filter) {
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
        const order_by = (this.state.orderBy ? this.state.orderBy : (sorting || []));

        if (order_by.length) {
            query["ordering"] = order_by.join(",");
        }
        if (this.source_method === "get") {
            return get(this.source_url, query); // TODO: Check the URLs and typify the result
        }
        return post(this.source_url, query); // TODO: Check the URLs and typify the result again
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
        this.source_function(this.props.filter, this.sorting)
        .then((res) => {
            const new_rows = this.props.groom ? this.props.groom(res.results || []) : res.results || [];

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
    };

    _setPage = (ev) => {
        if ((ev.target as any).value === "") {
            // TODO (bpj): investigate whether "" is really an appropriate for
            // `page`, which is usually treated as a number.
            this.setState({page: "" as any});
            return;
        }
        const n = parseInt(ev.target.value);
        this.setPage(n);
    };
    _select = (ev) => {
        $(ev.target).select();
    };

    _sort = (order_by) => {
        if (this.ordersMatch(order_by, this.state.orderBy)) {
            order_by = this.reverseOrder(this.state.orderBy);
        }
        this.setState({
            orderBy: order_by
        });
        setTimeout(() => this.update(), 1);
    };

    ordersMatch(order1, order2) {
        let match = true;
        if (order1.length === order2.length) {
            for (const i in order1) {
                if (order1[i].replace("-", "") !== order2[i].replace("-", "")) {
                    match = false;
                    break;
                }
            }
        } else {
            match = false;
        }
        return match;
    }

    reverseOrder(order) {
        const new_order_by = [];
        for (const str of order) {
            new_order_by.push(str.indexOf("-") === 0 ? str.substr(1) : "-" + str);
        }
        return new_order_by;
    }

    getHeader(order, header) {
        let el;
        if (order && order.length > 0) {
            let clsName = "";
            if (this.ordersMatch(this.state.orderBy, order)) {
                let minus = false;
                for (const o of this.state.orderBy) {
                    if (o.indexOf("-") === 0) {
                        minus = true;
                        break;
                    }
                }
                clsName = "fa fa-sort-" + (minus ? "down" : "up");
            } else {
                clsName = "fa fa-sort";
            }
            el = (<a className="sort-link">{header} <i className={clsName}/></a>);
        } else {
            el = header;
        }
        return el;
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

        const extra_classes = [
            this.props.className || "",
            this.props.onRowClick ? "clickable-rows" : "",
        ].join(" ");
        const page_sizes = this.props.pageSizeOptions || [10, 25, 50];
        if (this.props.pageSize) {
            if (page_sizes.indexOf(this.props.pageSize) < 0) {
                page_sizes.push(this.props.pageSize);
            }
        }
        page_sizes.sort();

        const columns = this.props.columns.filter((c) => !!c);
        const ncols = columns.length;

        const blank_rows = [];
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
                            {columns.map((column, idx) => <th key={idx} className={cls(null, column)} {...column.headerProps} onClick={column.orderBy ? () => {this._sort(column.orderBy); } : null}>{this.getHeader(column.orderBy, column.header)}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.rows.map((row, i) => {
                            const cols = columns.map((column, idx) => (
                                <td key={idx} className={cls(row, column)} {...column.cellProps}>{column_render(column, row)}</td>
                            ));
                            if (this.props.onRowClick) {
                                return (<tr key={row.id} onMouseUp={(ev) => this.props.onRowClick(row, ev)}>{cols}</tr>);
                            } else {
                                return (<tr key={row.id}>{cols}</tr>);
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
                            <span className="of"> /  </span><span className="total">{this.state.num_pages}</span>
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
