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
import { _, interpolate, pgettext } from "@/lib/translate";
import { get, post, put } from "@/lib/requests";

import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
    CellContext,
    HeaderContext,
} from "@tanstack/react-table";

import { openModal } from "@/components/Modal";
import { Player } from "@/components/Player";

import { JosekiPermissionsPanel } from "@/components/JosekiPermissionsPanel";
import { JosekiPageVisits, JosekiStatsModal } from "@/components/JosekiStatsModal";
import { JosekiTagEditor } from "@/components/JosekiTagEditor/JosekiTagEditor";

interface JosekiAdminProps {
    server_url: string;
    user_can_administer: boolean; // allows them to revert changes, give permissions etc
    user_can_edit: boolean; // allows them to filter
    db_locked_down: boolean;
    loadPositionToBoard: (pos: string) => void;
    updateDBLockStatus: (value: boolean) => void;
}

interface AuditRow {
    _id: string;
    node_id: number;
    placement: string;
    user_id: number;
    date: string;
    comment: string;
    new_value: string;
}

interface JosekiAdminState {
    data: AuditRow[];
    pages: number;
    current_page: number;
    current_pageSize: number;
    loading: boolean;
    server_status: string;
    reversions: Map<string, string>;
    schema_version: string;
    filter_user_id: string;
    filter_position_id: string;
    filter_tag: string;
    filter_audit_type: string;
    page_visits?: string;
    daily_visits: JosekiPageVisits[];
    rowSelection: Record<string, boolean>;
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

interface AuditTableProps {
    data: AuditRow[];
    pageCount: number;
    loading: boolean;
    rowSelection: Record<string, boolean>;
    onRowSelectionChange: (rowSelection: Record<string, boolean>) => void;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    columns: ColumnDef<AuditRow>[];
    userCanAdminister: boolean;
    onInitialLoad: () => void;
}

function AuditTable(props: AuditTableProps) {
    const [hasLoadedInitially, setHasLoadedInitially] = React.useState(false);

    React.useEffect(() => {
        if (!hasLoadedInitially) {
            props.onInitialLoad();
            setHasLoadedInitially(true);
        }
    }, [hasLoadedInitially, props.onInitialLoad]);

    const table = useReactTable({
        data: props.data,
        columns: props.columns,
        pageCount: props.pageCount,
        state: {
            pagination: {
                pageIndex: props.currentPage,
                pageSize: props.pageSize,
            },
            rowSelection: props.rowSelection,
        },
        enableRowSelection: props.userCanAdminister,
        onRowSelectionChange: (updater) => {
            const newSelection =
                typeof updater === "function" ? updater(props.rowSelection) : updater;
            props.onRowSelectionChange(newSelection);
        },
        onPaginationChange: (updater) => {
            const newPagination =
                typeof updater === "function"
                    ? updater({ pageIndex: props.currentPage, pageSize: props.pageSize })
                    : updater;
            props.onPageChange(newPagination.pageIndex);
            props.onPageSizeChange(newPagination.pageSize);
        },
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        getRowId: (row) => row._id,
    });

    return (
        <div className="ReactTable">
            <table>
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext(),
                                          )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {props.loading ? (
                        <tr>
                            <td colSpan={props.columns.length}>Loading...</td>
                        </tr>
                    ) : table.getRowModel().rows.length === 0 ? (
                        <tr>
                            <td colSpan={props.columns.length}>No results</td>
                        </tr>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <div className="pagination-bottom">
                <div className="-pagination">
                    <button
                        className="-btn"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </button>
                    <span>
                        Page{" "}
                        <input
                            type="number"
                            value={table.getState().pagination.pageIndex + 1}
                            onChange={(e) => {
                                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                                table.setPageIndex(page);
                            }}
                            min="1"
                            max={table.getPageCount()}
                        />{" "}
                        of {table.getPageCount()}
                    </span>
                    <select
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => {
                            table.setPageSize(Number(e.target.value));
                        }}
                    >
                        {[5, 10, 15, 30, 50, 100].map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                                {pageSize} rows
                            </option>
                        ))}
                    </select>
                    <button
                        className="-btn"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

export class JosekiAdmin extends React.PureComponent<JosekiAdminProps, JosekiAdminState> {
    constructor(props: JosekiAdminProps) {
        super(props);
        this.state = {
            data: [],
            pages: -1,
            current_page: 0,
            current_pageSize: 15,
            loading: false,
            server_status: "",
            reversions: new Map(),
            schema_version: "",
            filter_user_id: "",
            filter_position_id: "",
            filter_tag: "",
            filter_audit_type: "",
            page_visits: undefined,
            daily_visits: [],
            rowSelection: {},
        };
    }

    componentDidMount = () => {
        get(this.props.server_url + "appinfo")
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
        Object.keys(this.state.rowSelection).forEach((id) => {
            if (this.state.rowSelection[id]) {
                reversions.set(id, `Reversion of audit ${id} pending`);
            }
        });
        this.setState({ reversions });

        const selectedIds = Object.keys(this.state.rowSelection).filter(
            (id) => this.state.rowSelection[id],
        );
        this.revertSelectedChangesById(selectedIds);
    };

    //  Call the server to revert each selected item in turn (one at a time, for ease of understanding what happened)
    revertSelectedChangesById = (selectedIds: string[]) => {
        if (selectedIds.length === 0) {
            // There are no more reversions to be done, so reload the audit log to show the ones that were done
            this.reloadData();
            this.props.loadPositionToBoard("root"); // and reset the board, incase the status of what is displayed changed
            return;
        }

        const [currentId, ...remainingIds] = selectedIds;

        post(this.props.server_url + "revert", { audit_id: currentId })
            .then((body) => {
                // Display the result of what happened
                const nextReversions = new Map(this.state.reversions);
                nextReversions.set(
                    currentId,
                    `Reversion of audit ${currentId} status: ${body.result}`,
                );
                this.setState({ reversions: nextReversions });

                // get on with the next one, if there are more
                this.revertSelectedChangesById(remainingIds);
            })
            .catch((r) => {
                console.log("Revert POST failed:", r);
                this.revertSelectedChangesById(remainingIds);
            });
    };

    // note: django back-end pager starts at page 1, our paged display component starts at page zero
    reloadData = () => {
        let audits_url =
            this.props.server_url +
            `changes?page=${this.state.current_page + 1}&page_size=${this.state.current_pageSize}`;

        if (this.state.filter_position_id !== "") {
            audits_url += `&ref=${this.state.filter_position_id}`;
        }

        if (this.state.filter_user_id !== "") {
            audits_url += `&user=${this.state.filter_user_id}`;
        }

        // Not supported in new backend yet
        //if (this.state.filter_audit_type !== "") {
        //    audits_url += `&type=${this.state.filter_audit_type}`;
        //}

        get(audits_url)
            .then((body) => {
                this.setState({
                    data: body.results,
                    pages: body.num_pages,
                    loading: false,
                    rowSelection: {},
                });
            })
            .catch((r) => {
                console.log("Changes GET failed:", r);
            });
    };

    fetchDataForTable = (table_state: { page: number; pageSize: number }) => {
        // this shenanigans is so that we save the table state passed in the argument to this callback
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

    handleInitialLoad = () => {
        this.setState({ loading: true }, this.reloadData);
    };

    onUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const new_id = e.target.value;
        if (!/^\d*$/.test(new_id)) {
            return;
        } else {
            this.setState({ filter_user_id: new_id }, this.reloadData);
        }
    };

    onFilterPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const new_id = e.target.value;
        if (!/^\d*$/.test(new_id)) {
            return;
        } else {
            this.setState({ filter_position_id: new_id }, this.renderFilteredPosition);
        }
    };

    onFilterTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const new_tag = e.target.value;
        this.setState({ filter_tag: new_tag }, this.reloadData);
    };

    renderFilteredPosition = () => {
        this.reloadData();
        this.props.loadPositionToBoard(this.state.filter_position_id);
    };

    onFilterAuditTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({ filter_audit_type: e.target.value }, this.reloadData);
    };

    showVisitStats = () => {
        openModal(<JosekiStatsModal fastDismiss daily_page_visits={this.state.daily_visits} />);
    };

    toggleLockdown = () => {
        const lockdown_url = this.props.server_url + "lockdown";

        put(lockdown_url, { lockdown: !this.props.db_locked_down })
            .then((response) => {
                this.props.updateDBLockStatus(response.db_locked_down);
            })
            .catch((r) => {
                console.log("Toggle lockdown failed:", r);
            });
    };

    getColumns = (): ColumnDef<AuditRow>[] => [
        ...(this.props.user_can_administer
            ? [
                  {
                      id: "select",
                      header: ({ table }: HeaderContext<AuditRow, unknown>) => (
                          <input
                              type="checkbox"
                              checked={table.getIsAllRowsSelected()}
                              ref={(el: HTMLInputElement | null) => {
                                  if (el) {
                                      el.indeterminate = table.getIsSomeRowsSelected();
                                  }
                              }}
                              onChange={table.getToggleAllRowsSelectedHandler()}
                          />
                      ),
                      cell: ({ row }: CellContext<AuditRow, unknown>) => (
                          <input
                              type="checkbox"
                              checked={row.getIsSelected()}
                              disabled={!row.getCanSelect()}
                              onChange={row.getToggleSelectedHandler()}
                          />
                      ),
                  } as ColumnDef<AuditRow>,
              ]
            : []),
        {
            header: _("At"), // translators: This is the header field for move coordinates on the joseki admin audit table
            accessorKey: "placement",
            // Click the placement to see the position on the board
            cell: ({ row }: CellContext<AuditRow, string>) => (
                <div
                    className="position-link"
                    onClick={() => {
                        this.props.loadPositionToBoard(row.original.node_id.toString());
                    }}
                    style={{ cursor: "pointer" }}
                >
                    {row.original.placement}
                </div>
            ),
        },
        {
            header: _("User"),
            accessorKey: "user_id",
            cell: ({ row }: CellContext<AuditRow, number>) => (
                <Player user={row.original.user_id} />
            ),
        },
        {
            header: _("Date"),
            accessorKey: "date",
        },
        {
            header: _("Action"),
            accessorKey: "comment",
        },
        {
            header: _("Result"),
            accessorKey: "new_value",
        },
    ];

    render = () => {
        const audit_type_selections = Object.keys(AuditTypes).map((selection, i) => (
            <option key={i} value={AuditTypes[selection as keyof typeof AuditTypes] as any}>
                {(AuditTypes[selection as keyof typeof AuditTypes] as string).toLowerCase()}
            </option>
        ));

        audit_type_selections.unshift(<option key={-1} value=""></option>);

        const reversions = Array.from(this.state.reversions.values());

        return (
            <div className="admin-container">
                {this.props.user_can_edit && (
                    <>
                        <h3>Audit Admin</h3>
                        <div className="audit-actions">
                            <div className="audit-filters">
                                <div className="audit-filter">
                                    <div>Filter by position:</div>
                                    <input
                                        value={this.state.filter_position_id}
                                        onChange={this.onFilterPositionChange}
                                    />
                                </div>
                                <div className="audit-filter">
                                    <div>Filter by user (id):</div>
                                    <input
                                        value={this.state.filter_user_id}
                                        onChange={this.onUserIdChange}
                                    />
                                    <span>
                                        (<Player user={parseInt(this.state.filter_user_id)} />)
                                    </span>
                                </div>
                                <div
                                    className={
                                        "hide audit-filter" +
                                        (this.state.filter_position_id === "" &&
                                        this.state.filter_user_id === ""
                                            ? ""
                                            : " audit-filter-overridden")
                                    }
                                >
                                    <div>Filter by type:</div>
                                    <select
                                        value={this.state.filter_audit_type}
                                        onChange={this.onFilterAuditTypeChange}
                                    >
                                        {audit_type_selections}
                                    </select>
                                </div>
                            </div>
                            {this.props.user_can_administer && (
                                <button
                                    className={
                                        "btn" +
                                        (Object.values(this.state.rowSelection).some((val) => val)
                                            ? " danger"
                                            : " disabled")
                                    }
                                    onClick={this.revertAllSelectedChanges}
                                    disabled={
                                        !Object.values(this.state.rowSelection).some((val) => val)
                                    }
                                >
                                    {_("Revert")}
                                </button>
                            )}
                        </div>
                    </>
                )}
                {reversions.length > 0 &&
                    reversions.map((reversion, idx) => <div key={idx}>{reversion}</div>)}
                <AuditTable
                    data={this.state.data}
                    pageCount={this.state.pages}
                    loading={this.state.loading}
                    rowSelection={this.state.rowSelection}
                    onRowSelectionChange={(rowSelection) => {
                        this.setState({ rowSelection });
                    }}
                    currentPage={this.state.current_page}
                    pageSize={this.state.current_pageSize}
                    onPageChange={(page) => {
                        this.setState({ current_page: page, loading: true }, this.reloadData);
                    }}
                    onPageSizeChange={(pageSize) => {
                        this.setState(
                            { current_pageSize: pageSize, loading: true },
                            this.reloadData,
                        );
                    }}
                    columns={this.getColumns()}
                    userCanAdminister={this.props.user_can_administer}
                    onInitialLoad={this.handleInitialLoad}
                />
                <div className="explorer-stats">
                    <span>
                        {interpolate(_("Page visits: {{count}}"), {
                            count: this.state.page_visits || "...",
                        })}
                    </span>
                    <button className="s" onClick={this.showVisitStats}>
                        {pgettext(
                            "A button that shows details of joseki visit statistics",
                            "details",
                        )}
                    </button>
                </div>
                <h3>Tag Editor</h3>
                <JosekiTagEditor />
                {this.props.user_can_administer && (
                    <div className="bottom-admin-stuff">
                        <h3>{_("Permissions Admin")}</h3>
                        <div className="user-admin">
                            <JosekiPermissionsPanel server_url={this.props.server_url} />
                        </div>
                        <h3>{_("Misc Admin")}</h3>
                        <div className="misc-admin">
                            <button className="" onClick={this.toggleLockdown}>
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
