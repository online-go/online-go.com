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

/*
 * This file contains the incident report tracking and management system
 * which is used by our IncidentReportTracker widget and our ReportsCenter view.
 */

import * as data from "data";
import * as preferences from "preferences";
import { alert } from "swal_config";
import { socket } from "sockets";
import { ReportedConversation } from "Report";
import { PlayerCacheEntry } from "player_cache";
import { EventEmitter } from "eventemitter3";
import { emitNotification } from "Notifications";
import { browserHistory } from "ogsHistory";
import { get, post } from "requests";

export interface Report {
    id: number;
    created: string;
    updated: string;
    state: string;
    source: string;
    report_type: string;
    reporting_user: any;
    reported_user: any;
    reported_game: number;
    reported_review: number;
    reported_conversation: ReportedConversation;
    url: string;
    moderator: PlayerCacheEntry;
    cleared_by_user: boolean;
    was_helpful: boolean;
    reporter_note: string;
    reporter_note_translation: {
        source_language: string;
        target_language: string;
        source_text: string;
        target_text: string;
    };
    moderator_note: string;
    system_note: string;

    unclaim: () => void;
    claim: () => void;
    steal: () => void;
    bad_report: () => void;
    good_report: () => void;
    cancel: () => void;
    set_note: () => void;
}

interface Events {
    "incident-report": (report: Report) => void;
    "active-count": (count: number) => void;
    update: () => void;
}

// when true, don't alert mods about notifications - this prevents a surge of
// existing notifications when we reconnect to the server
let post_connect_notification_squelch = true;

class ReportManager extends EventEmitter<Events> {
    active_incident_reports: { [id: string]: Report } = {};
    sorted_active_incident_reports: Report[] = [];

    constructor() {
        super();

        const connect_fn = () => {
            const user = data.get("user");
            this.active_incident_reports = {};

            if (!user.anonymous) {
                socket.send("incident/connect", {
                    player_id: user.id,
                    auth: data.get("config.incident_auth"),
                });
            }

            post_connect_notification_squelch = true;
            setTimeout(() => {
                post_connect_notification_squelch = false;
            }, 5000);
        };

        socket.on("connect", connect_fn);
        if (socket.connected) {
            connect_fn();
        }

        socket.on("incident-report", (report: Report) => this.updateIncidentReport(report));

        preferences.watch("moderator.report-settings", () => {
            this.update();
        });

        preferences.watch("moderator.report-sort-order", () => {
            this.update();
        });
    }

    public updateIncidentReport(report: Report) {
        report.id = parseInt(report.id as unknown as string);

        if (!(report.id in this.active_incident_reports)) {
            if (
                data.get("user").is_moderator &&
                preferences.get("notify-on-incident-report") &&
                !post_connect_notification_squelch
            ) {
                emitNotification(
                    "Incident Report",
                    report.reporting_user?.username + ": " + report.reporter_note,
                    () => {
                        if (report.reported_game) {
                            browserHistory.push(`/game/${report.reported_game}`);
                        } else if (report.reported_review) {
                            browserHistory.push(`/review/${report.reported_review}`);
                        } else if (report.reported_user) {
                            browserHistory.push(`/user/view/${report.reported_user.id}`);
                        }
                    },
                );
            }
        }

        if (report.state === "resolved") {
            delete this.active_incident_reports[report.id];
        } else {
            this.active_incident_reports[report.id] = report;
        }

        this.emit("incident-report", report);
        this.update();
    }

    public update() {
        const prefs = preferences.get("moderator.report-settings");
        const user = data.get("user");

        const reports = [];
        let normal_ct = 0;
        for (const id in this.active_incident_reports) {
            const report = this.active_incident_reports[id];
            if ((prefs[report.report_type]?.visible ?? true) && !this.getIgnored(report.id)) {
                reports.push(report);
                if (report.moderator === null || report.moderator.id === user.id) {
                    normal_ct++;
                }
            }
        }

        console.log("Sort order: ", preferences.get("moderator.report-sort-order"));

        reports.sort(compare_reports);

        this.sorted_active_incident_reports = reports;
        this.emit("active-count", normal_ct);
        this.emit("update");
    }

    public getAvailableReports() {
        const user = data.get("user");

        return this.sorted_active_incident_reports.filter((report) => {
            if (this.getIgnored(report.id)) {
                return false;
            }

            return report.moderator === null || report.moderator.id === user.id;
        });
    }

    public getIgnored(report_id: number) {
        const ignored = data.get("ignored-reports") || {};
        return ignored[report_id] || false;
    }

    public ignore(report_id: number) {
        const ignored = data.get("ignored-reports") || {};
        ignored[report_id] = Date.now() + 1000 * 60 * 60 * 24 * 7; // for 7 days
        for (const key in ignored) {
            if (ignored[key] < Date.now()) {
                delete ignored[key];
            }
        }
        data.set("ignored-reports", ignored);
        this.update();
    }

    public async getReport(id: number): Promise<Report> {
        if (id in this.active_incident_reports) {
            return this.active_incident_reports[id];
        }

        const res = await get(`moderation/incident/${id}`);

        if (res) {
            return res;
        }

        throw new Error("Report not found");
    }

    public async reopen(report_id: number): Promise<Report> {
        const res = await post(`moderation/incident/${report_id}`, {
            id: report_id,
            action: "reopen",
        });
        this.updateIncidentReport(res);
        return res;
    }
    public async close(report_id: number, helpful: boolean): Promise<Report> {
        delete this.active_incident_reports[report_id];
        this.update();
        const res = await post("moderation/incident/%%", report_id, {
            id: report_id,
            action: "resolve",
            was_helpful: helpful,
        });
        this.updateIncidentReport(res);
        return res;
    }
    public async good_report(report_id: number): Promise<Report> {
        const res = await this.close(report_id, true);
        this.updateIncidentReport(res);
        return res;
    }
    public async bad_report(report_id: number): Promise<Report> {
        const res = await this.close(report_id, false);
        this.updateIncidentReport(res);
        return res;
    }
    public async unclaim(report_id: number): Promise<Report> {
        const res = await post("moderation/incident/%%", report_id, {
            id: report_id,
            action: "unclaim",
        });
        this.updateIncidentReport(res);
        return res;
    }
    public async claim(report_id: number): Promise<Report> {
        const res = await post("moderation/incident/%%", report_id, {
            id: report_id,
            action: "claim",
        }).then((res) => {
            if (res.vanished) {
                void alert.fire("Report was removed");
            }
            if (res.already_claimed) {
                void alert.fire("Report was removed");
            }
            return res;
        });
        this.updateIncidentReport(res);
        return res;
    }
}

function compare_reports(a: Report, b: Report): number {
    const prefs = preferences.get("moderator.report-settings");
    const sort_order = preferences.get("moderator.report-sort-order");
    const user = data.get("user");
    const A_BEFORE_B = -1;
    const B_BEFORE_A = 1;

    const custom_ordering =
        (prefs[a.report_type]?.priority ?? 1) - (prefs[b.report_type]?.priority ?? 1);

    if (!a.moderator && !b.moderator) {
        return custom_ordering || b.id - a.id;
    }
    if (a.moderator && !b.moderator) {
        if (a.moderator.id === user.id) {
            return A_BEFORE_B;
        }
        return B_BEFORE_A;
    }
    if (b.moderator && !a.moderator) {
        if (b.moderator.id === user.id) {
            return B_BEFORE_A;
        }
        return A_BEFORE_B;
    }

    // both have moderators, sort our mod reports first, then other
    // mods, then by id

    if (a.moderator.id !== user.id && b.moderator.id === user.id) {
        return B_BEFORE_A;
    }
    if (a.moderator.id === user.id && b.moderator.id !== user.id) {
        return A_BEFORE_B;
    }

    return custom_ordering || (sort_order === "newest-first" ? b.id - a.id : a.id - b.id);
}

export const report_manager = new ReportManager();

window["report_manager"] = report_manager;
