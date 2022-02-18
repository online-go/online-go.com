/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { _ } from "translate";
import { post, get } from "requests";
import * as data from "data";
import { UIPush } from "../UIPush";

interface PaginatedTableColumnProperties<EntryT> {
    cellProps?: any;
    render: (row: EntryT) => JSX.Element | string | number;
    header: string;
    headerProps?: any;
    sortable?: boolean;
    striped?: boolean;
    className?: ((row: EntryT) => string) | string;
    orderBy?: Array<string>;
}

export interface Filter {
    [key: string]: string | number | boolean;
}

interface PagedResults<EntryT = any> {
    count: number; // total results
    results: Array<EntryT>;
}

interface PaginatedTableProperties<RawEntryT, GroomedEntryT = RawEntryT> {
    source: string;
    method?: "GET" | "POST";
    pageSize?: number;
    columns: Array<PaginatedTableColumnProperties<GroomedEntryT>>;
    aliases?: string;
    name?: string;
    className: string;
    filter?: Filter;
    orderBy?: Array<string>;
    groom?: (data: Array<RawEntryT>) => Array<GroomedEntryT>;
    onRowClick?: (row, ev) => any;
    debug?: boolean;
    pageSizeOptions?: Array<number>;
    startingPage?: number;
    fillBlankRows?: boolean;
    hidePageControls?: boolean;
    /** If provided, the table will listen for this push event and refresh its data accordingly */
    uiPushProps?: { event: string; channel: string };
}

export interface PaginatedTableRef {
    refresh: () => void;
}

export const PaginatedTable = React.forwardRef<PaginatedTableRef, PaginatedTableProperties<any>>(
    _PaginatedTable,
) as <RawEntryT = any, GroomedEntryT = RawEntryT>(
    props: PaginatedTableProperties<RawEntryT, GroomedEntryT> & {
        ref?: React.ForwardedRef<PaginatedTableRef>;
    },
) => ReturnType<typeof _PaginatedTable>;

function _PaginatedTable<RawEntryT = any, GroomedEntryT = RawEntryT>(
    props: PaginatedTableProperties<RawEntryT, GroomedEntryT>,
    ref: React.ForwardedRef<PaginatedTableRef>,
): JSX.Element {
    const table_name = props.name || "default";
    const [rows, setRows]: [any[], (x: any[]) => void] = React.useState([]);
    const [page, _setPage]: [number, (x: number) => void] = React.useState(props.startingPage || 1);
    const [page_input_text, _setPageInputText]: [string, (s: string) => void] = React.useState(
        (props.startingPage || 1).toString(),
    );
    const [num_pages, setNumPages]: [number, (x: number) => void] = React.useState(0);
    const [page_size, _setPageSize]: [number, (x: number) => void] = React.useState(
        data.get(`paginated-table.${table_name}.page_size`, props.pageSize || 10),
    );
    const [order_by, setOrderBy]: [string[], (x: string[]) => void] = React.useState(
        props.orderBy || [],
    );
    const [loading, setLoading]: [boolean, (x: boolean) => void] = React.useState(false as boolean);
    const [load_again_refresh, setLoadAgainRefresh]: [number, (x: number) => void] =
        React.useState(0);
    const mounted = React.useRef(false);

    const load_again = React.useRef(false as boolean);
    const last_loaded = React.useRef([] as any[]);
    const filter: any = props.filter;

    React.useImperativeHandle(ref, () => ({
        refresh: () => {
            refresh(true);
        },
    }));

    React.useEffect(refresh, [order_by, page, page_size, filter, load_again_refresh]);

    React.useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    function refresh(force: boolean = false) {
        const cur = [order_by, page, page_size, filter, load_again_refresh];
        const last = last_loaded.current;
        if (!force && last.length && softEquals(last, cur)) {
            return;
        }
        last_loaded.current = cur;

        if (loading) {
            load_again.current = true;
            return;
        }

        setLoading(true);
        load_again.current = false;
        const [promise, cancel] = ajax_loader();

        promise
            .then((res: PagedResults) => {
                if (!mounted.current) {
                    return;
                }
                let new_rows;
                if (props.groom) {
                    try {
                        console.log(res);
                        new_rows = props.groom(res.results || []);
                    } catch (e) {
                        console.error(e);
                        new_rows = res.results || [];
                    }
                } else {
                    new_rows = res.results || [];
                }

                if (props.debug) {
                    console.debug("PaginatedTable groomed rows: ", new_rows);
                }

                setLoading(false);
                if (load_again.current) {
                    load_again.current = false;
                    setLoadAgainRefresh(load_again_refresh + 1);
                }
                setRows(new_rows);
                setNumPages(Math.ceil(res.count / page_size));
                if (page > Math.ceil(res.count / page_size)) {
                    const new_page = Math.max(1, Math.ceil(res.count / page_size));
                    _setPage(new_page);
                    setPageInputText(new_page.toString());
                }
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
                if (load_again.current) {
                    load_again.current = false;
                    setLoadAgainRefresh(load_again_refresh + 1);
                }
            });

        return cancel;
    }

    function ajax_loader(): [Promise<any>, () => void] {
        if (typeof props.source === "string") {
            const url = props.source as string;
            const method = props.method || "GET";

            const query = { page_size, page };
            for (const k in filter) {
                if (
                    (k.indexOf("__istartswith") > 0 ||
                        k.indexOf("__startswith") > 0 ||
                        k.indexOf("__icontains") > 0 ||
                        k.indexOf("__contains") > 0) &&
                    filter[k] === ""
                ) {
                    continue;
                }

                query[k] = filter[k];
            }

            if (order_by.length) {
                query["ordering"] = order_by.join(",");
            }

            //const cancel = () => abort_requests_in_flight(url, method);
            const cancel = () => 0;
            if (method === "GET") {
                return [get(url, query), cancel];
            } else if (method === "POST") {
                return [post(url, query), cancel];
            }

            throw new Error(`Unhandled query method: ${method}`);
        }

        throw new Error(`Source was not a url`);
    }

    function setPage(page: number): void {
        const new_page = Math.max(1, Math.min(page, num_pages));
        _setPage(new_page);
        setPageInputText(new_page.toString());
    }

    function setPageInputText(s: string): void {
        _setPageInputText(s.replace(/[^0-9]/g, ""));
    }

    function syncPageInputTextToPage() {
        if (!page_input_text) {
            setPageInputText("1");
            setPage(1);
        } else {
            if (parseInt(page_input_text).toString() !== page_input_text) {
                setPageInputText(parseInt(page_input_text).toString());
            }
            setPage(parseInt(page_input_text));
        }
    }

    function setPageSize(new_page_size: number) {
        const old_page_size = page_size;
        data.set(`paginated-table.${table_name}.page_size`, new_page_size);
        _setPageSize(new_page_size);

        const new_page = Math.floor(Math.max(0, ((page - 1) * old_page_size) / new_page_size) + 1);
        _setPage(new_page);
        setPageInputText(new_page.toString());
    }

    function _sort(new_order_by: string[]): void {
        if (ordersMatch(new_order_by, order_by)) {
            new_order_by = reverseOrder(order_by);
        }
        setOrderBy(new_order_by);
    }

    function getHeader(order: string[], header: string): JSX.Element {
        let el: JSX.Element;
        if (order && order.length > 0) {
            let clsName = "";
            if (ordersMatch(order_by, order)) {
                let minus = false;
                for (const o of order_by) {
                    if (o.indexOf("-") === 0) {
                        minus = true;
                        break;
                    }
                }
                clsName = "fa fa-sort-" + (minus ? "down" : "up");
            } else {
                clsName = "fa fa-sort";
            }
            el = (
                <a className="sort-link">
                    {header} <i className={clsName} />
                </a>
            );
        } else {
            el = <>{header}</>;
        }
        return el;
    }

    /** RENDER **/

    const extra_classes = [props.className || "", props.onRowClick ? "clickable-rows" : ""].join(
        " ",
    );
    const columns = props.columns.filter((c) => !!c);
    const blank_rows = [];
    const page_sizes = props.pageSizeOptions || [10, 25, 50];

    if (props.fillBlankRows) {
        for (let i = 0; i < page_size - rows.length; ++i) {
            blank_rows.push(
                <tr key={"blank-" + i}>
                    <td className="blank" colSpan={columns.length} />
                </tr>,
            );
        }
    }
    if (props.pageSize) {
        if (page_sizes.indexOf(props.pageSize) < 0) {
            page_sizes.push(props.pageSize);
        }
    }
    page_sizes.sort();

    return (
        <div className={`PaginatedTable ${extra_classes} ${loading ? "loading" : ""}`}>
            {props.uiPushProps && (
                <UIPush
                    event={props.uiPushProps.event}
                    channel={props.uiPushProps.channel}
                    action={() => {
                        refresh(true);
                    }}
                />
            )}
            <div className="loading-overlay">{_("Loading")}</div>
            <table className={extra_classes}>
                <thead>
                    <tr>
                        {columns.map((column, idx) => (
                            <th
                                key={idx}
                                className={cls(null, column)}
                                {...column.headerProps}
                                onClick={
                                    column.orderBy
                                        ? () => {
                                              _sort(column.orderBy);
                                          }
                                        : null
                                }
                            >
                                {getHeader(column.orderBy, column.header)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const cols = columns.map((column, idx) => (
                            <td key={idx} className={cls(row, column)} {...column.cellProps}>
                                {column_render(column, row)}
                            </td>
                        ));
                        if (props.onRowClick) {
                            return (
                                <tr key={row.id} onMouseUp={(ev) => props.onRowClick(row, ev)}>
                                    {cols}
                                </tr>
                            );
                        } else {
                            return <tr key={row.id}>{cols}</tr>;
                        }
                    })}
                    {blank_rows}
                </tbody>
            </table>
            {(!props.hidePageControls || null) && (
                <div className="page-controls">
                    <div className="left">
                        {page > 1 ? (
                            <i className="fa fa-step-backward" onClick={() => setPage(page - 1)} />
                        ) : (
                            <i className="fa" />
                        )}
                        <input
                            value={page_input_text}
                            type="tel"
                            onChange={(ev) => setPageInputText(ev.target.value)}
                            onKeyDown={(ev) => ev.keyCode === 13 && syncPageInputTextToPage()}
                            onBlur={() => syncPageInputTextToPage()}
                        />
                        <span className="of"> / </span>
                        <span className="total">{num_pages}</span>
                        {page < num_pages ? (
                            <i className="fa fa-step-forward" onClick={() => setPage(page + 1)} />
                        ) : (
                            <i className="fa" />
                        )}
                    </div>
                    <div className="right">
                        {(page_sizes.length > 1 || null) && (
                            <select
                                onChange={(ev) => setPageSize(parseInt(ev.target.value))}
                                value={page_size}
                            >
                                {page_sizes.map((v, idx) => (
                                    <option key={idx} value={v}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function column_render(column, row): JSX.Element | string | number {
    if (typeof column.render === "function") {
        return column.render(row);
    }
    return column.render;
}

function cls(row, column): string {
    if (!column.className) {
        return "";
    }
    if (typeof column.className === "function") {
        return column.className(row, column);
    }
    return column.className;
}

function ordersMatch(order1: string[], order2: string[]): boolean {
    if (order1.length !== order2.length) {
        return false;
    }

    for (const i in order1) {
        if (order1[i].replace("-", "") !== order2[i].replace("-", "")) {
            return false;
        }
    }

    return true;
}

function reverseOrder(order: string[]): string[] {
    const new_order_by = [];
    for (const str of order) {
        new_order_by.push(str.indexOf("-") === 0 ? str.substr(1) : "-" + str);
    }
    return new_order_by;
}

function softEquals(a: any, b: any) {
    if (typeof a !== typeof b) {
        return false;
    }

    if (typeof a === "object") {
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) {
                return false;
            }
            for (let i = 0; i < a.length; ++i) {
                if (!softEquals(a[i], b[i])) {
                    return false;
                }
            }
        } else {
            const done: { [k: string]: boolean } = {};
            for (const k in a) {
                done[k] = true;
                if (!(k in b) || !softEquals(a[k], b[k])) {
                    return false;
                }
            }
            for (const k in b) {
                if (!(k in done)) {
                    return false;
                }
            }
        }
        return true;
    }

    if (typeof a === "function") {
        return a.toString() === b.toString();
    }

    if (typeof a === "undefined") {
        return true;
    }

    return a === b;
}
