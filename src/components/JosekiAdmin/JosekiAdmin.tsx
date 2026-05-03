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
import moment from "moment";
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
import "./JosekiAdmin.css";

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

type AdminSubTab = "audit" | "tags" | "perms" | "misc";

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
    page_visits?: string;
    daily_visits: JosekiPageVisits[];
    rowSelection: Record<string, boolean>;
    sub_tab: AdminSubTab;
}

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

    const rows = table.getRowModel().rows;

    const renderCell = (row: (typeof rows)[number], id: string): React.ReactNode | null => {
        const cell = row.getVisibleCells().find((c) => c.column.id === id);
        if (!cell) {
            return null;
        }
        return flexRender(cell.column.columnDef.cell, cell.getContext());
    };

    return (
        <div className="audit-list">
            {props.loading ? (
                <div className="audit-empty">{_("Loading…")}</div>
            ) : rows.length === 0 ? (
                <div className="audit-empty">{_("No results")}</div>
            ) : (
                rows.map((row) => (
                    <div className="audit-row" key={row.id}>
                        <div className="audit-row-line1">
                            {props.userCanAdminister && (
                                <span className="audit-row-select">
                                    {renderCell(row, "select")}
                                </span>
                            )}
                            <span className="audit-row-pos">{renderCell(row, "placement")}</span>
                            <span className="audit-row-date">{renderCell(row, "date")}</span>
                        </div>
                        <div className="audit-row-line2">
                            <span className="audit-row-user">{renderCell(row, "user_id")}</span>
                            <span className="audit-row-action">{renderCell(row, "comment")}</span>
                            <span className="audit-row-result">{renderCell(row, "new_value")}</span>
                        </div>
                    </div>
                ))
            )}

            <div className="audit-pagination">
                <button
                    className="audit-pagination-btn"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    title={_("Previous page")}
                >
                    <i className="fa fa-chevron-left" />
                </button>
                <span className="audit-pagination-info">
                    {interpolate(
                        pgettext("Pagination: page X of Y", "Page {{page}} of {{total}}"),
                        {
                            page: table.getState().pagination.pageIndex + 1,
                            total: table.getPageCount() || 1,
                        },
                    )}
                </span>
                <button
                    className="audit-pagination-btn"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    title={_("Next page")}
                >
                    <i className="fa fa-chevron-right" />
                </button>
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
            page_visits: undefined,
            daily_visits: [],
            rowSelection: {},
            sub_tab: "audit",
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
            this.props.loadPositionToBoard("root"); // and reset the board, in case the status of what is displayed changed
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
        }
        // Reset to page 0 on filter change so a stale page index doesn't
        // land outside the filtered result's page count.
        this.setState({ filter_user_id: new_id, current_page: 0, loading: true }, this.reloadData);
    };

    onFilterPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const new_id = e.target.value;
        if (!/^\d*$/.test(new_id)) {
            return;
        }
        this.setState(
            { filter_position_id: new_id, current_page: 0, loading: true },
            this.renderFilteredPosition,
        );
    };

    renderFilteredPosition = () => {
        this.reloadData();
        this.props.loadPositionToBoard(this.state.filter_position_id);
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
            cell: ({ row }: CellContext<AuditRow, string>) => {
                const m = moment(row.original.date);
                return m.isValid() ? m.format("YYYY-MM-DD HH:mm") : row.original.date;
            },
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
        const reversions = Array.from(this.state.reversions.values());
        const has_selection = Object.values(this.state.rowSelection).some((v) => v);
        const sub_tab = this.state.sub_tab;

        const tabs: { id: AdminSubTab; label: string }[] = [
            { id: "audit", label: pgettext("Joseki admin sub-tab", "Audit") },
        ];
        if (this.props.user_can_edit) {
            tabs.push({ id: "tags", label: pgettext("Joseki admin sub-tab", "Tags") });
        }
        if (this.props.user_can_administer) {
            tabs.push({ id: "perms", label: pgettext("Joseki admin sub-tab", "Perms") });
            tabs.push({ id: "misc", label: pgettext("Joseki admin sub-tab", "Misc") });
        }
        const active_tab = tabs.some((t) => t.id === sub_tab) ? sub_tab : "audit";

        return (
            <div className="admin-container">
                <div className="joseki-admin-tabs">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            className={"joseki-admin-tab" + (active_tab === t.id ? " active" : "")}
                            onClick={() => this.setState({ sub_tab: t.id })}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="joseki-admin-meta">
                    <span>
                        {interpolate(_("Page visits: {{count}}"), {
                            count: this.state.page_visits || "…",
                        })}
                    </span>
                    <button className="joseki-admin-meta-link" onClick={this.showVisitStats}>
                        {pgettext("Joseki admin: open visit-stats modal", "details")}
                    </button>
                </div>

                {active_tab === "audit" && (
                    <div className="admin-pane admin-pane-audit">
                        {this.props.user_can_edit && (
                            <div className="audit-filters">
                                <label className="audit-filter">
                                    <span>
                                        {pgettext("Joseki admin filter label", "Position id")}
                                    </span>
                                    <input
                                        value={this.state.filter_position_id}
                                        onChange={this.onFilterPositionChange}
                                    />
                                </label>
                                <label className="audit-filter">
                                    <span>{pgettext("Joseki admin filter label", "User id")}</span>
                                    <input
                                        value={this.state.filter_user_id}
                                        onChange={this.onUserIdChange}
                                    />
                                </label>
                                {this.state.filter_user_id !== "" && (
                                    <div className="audit-filter-resolved">
                                        <Player user={parseInt(this.state.filter_user_id)} />
                                    </div>
                                )}
                            </div>
                        )}

                        {reversions.length > 0 && (
                            <div className="audit-reversions">
                                {reversions.map((reversion, idx) => (
                                    <div key={idx}>{reversion}</div>
                                ))}
                            </div>
                        )}

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
                                this.setState(
                                    { current_page: page, loading: true },
                                    this.reloadData,
                                );
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

                        {this.props.user_can_administer && has_selection && (
                            <div className="audit-revert-bar">
                                <button className="reject" onClick={this.revertAllSelectedChanges}>
                                    {_("Revert selected")}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {active_tab === "tags" && this.props.user_can_edit && (
                    <div className="admin-pane">
                        <JosekiTagEditor />
                    </div>
                )}

                {active_tab === "perms" && this.props.user_can_administer && (
                    <div className="admin-pane">
                        <JosekiPermissionsPanel server_url={this.props.server_url} />
                    </div>
                )}

                {active_tab === "misc" && this.props.user_can_administer && (
                    <div className="admin-pane admin-pane-misc">
                        <div className="joseki-admin-subhead">
                            {pgettext("Joseki admin subsection heading", "Database")}
                        </div>
                        <button onClick={this.toggleLockdown}>
                            {this.props.db_locked_down ? _("Unlock") : _("Lockdown")}
                        </button>
                        <div className="joseki-admin-meta">
                            <span>
                                {_("Schema version")}: {this.state.schema_version || "…"}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    };
}
