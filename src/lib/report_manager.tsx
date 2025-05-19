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
 * which is used by our IncidentReportIndicator widget and our ReportsCenter view.
 */

import * as React from "react";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { toast } from "@/lib/toast";
import { alert } from "@/lib/swal_config";
import { socket } from "@/lib/sockets";
import { pgettext } from "@/lib/translate";
import { ReportNotification, community_mod_can_handle } from "@/lib/report_util";
import { EventEmitter } from "eventemitter3";
import { emitNotification } from "@/components/Notifications";
import { browserHistory } from "@/lib/ogsHistory";
import { get, post } from "@/lib/requests";
import { MODERATOR_POWERS } from "./moderation";

type ReportDetail = rest_api.moderation.ReportDetail;

export interface ReportRelation {
    relationship: string;
    report: ReportNotification;
}

interface Events {
    "incident-report": (report: ReportNotification) => void;
    "active-count": (count: number) => void;
    update: () => void;
}

// when true, don't alert mods about notifications - this prevents a surge of
// existing notifications when we reconnect to the server
let post_connect_notification_squelch = true;

// Notifications about "reports and changes to reports that the user has access to"
// arrive here from the server, over the websocket.

class ReportManager extends EventEmitter<Events> {
    active_incident_reports: { [id: string]: ReportNotification } = {};
    sorted_active_incident_reports: ReportNotification[] = [];
    this_user_reported_games: number[] = [];

    constructor() {
        super();

        const connect_fn = () => {
            this.active_incident_reports = {};

            post_connect_notification_squelch = true;
            setTimeout(() => {
                post_connect_notification_squelch = false;
            }, 5000);
        };

        socket.on("connect", connect_fn);
        if (socket.connected) {
            connect_fn();
        }

        socket.on("incident-report", (report) =>
            this.updateIncidentReport(report as any as ReportNotification),
        );

        preferences.watch("moderator.report-settings", () => {
            this.update();
        });

        preferences.watch("moderator.report-sort-order", () => {
            this.update();
        });
    }

    // Processing for each notification from the server: mostly making sure our lists contain the right reports
    public updateIncidentReport(report: ReportNotification) {
        const user = data.get("user");
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
            this.this_user_reported_games = this.this_user_reported_games.filter(
                (game_id) => game_id !== report.reported_game,
            );
        } else {
            this.active_incident_reports[report.id] = report;
            if (report.reported_game && report.reporting_user?.id === user.id) {
                this.this_user_reported_games.push(report.reported_game);
            }
        }
        // this is used in the Report submitting modal to prevent or warn about
        // duplicate reports on the same game
        data.set("reported-games", this.this_user_reported_games);

        this.emit("incident-report", report);
        this.update();
    }

    // Processing that's needed if anything changes - our user actions and new notifications
    private update() {
        const prefs = preferences.get("moderator.report-settings");

        const current_reports = Object.values(this.active_incident_reports).filter(
            (report) => (prefs[report.report_type]?.visible ?? true) && !this.getIgnored(report.id),
        );
        current_reports.sort(compare_reports);

        const active_count = this.getNotificationReports().length;

        this.sorted_active_incident_reports = current_reports;

        this.emit("active-count", active_count);
        this.emit("update");
    }

    private userAlreadyVoted(user: rest_api.UserConfig, report: ReportNotification): boolean {
        // They voted if there is a vote from them (obviously) - but:
        // if the report is escalated _and_ they have SUSPEND power, we are only interested in votes
        // after the escalated_at time

        const they_already_voted = report.voters?.some(
            (vote) =>
                vote.voter_id === user.id &&
                (!report.escalated || // If the report is not escalated, any vote counts
                    !(user.moderator_powers & MODERATOR_POWERS.SUSPEND) || // If the user does not have SUSPEND powers, any vote counts
                    new Date(vote.updated) > new Date(report.escalated_at)), // If the user has SUSPEND powers, vote must be after escalation
        );
        //console.log("userAlreadyVoted", user.id, report.id, report, they_already_voted);
        return they_already_voted;
    }

    private userCanModerate(user: rest_api.UserConfig, report: ReportNotification): boolean {
        // (assumes that they can see the report)
        return (
            (user.is_moderator && (!report.moderator || report.moderator.id === user.id)) ||
            (!!user.moderator_powers && community_mod_can_handle(user, report))
        );
    }

    public moderationQueue(): ReportNotification[] {
        const user = data.get("user");
        const quota = preferences.get("moderator.report-quota");
        return !quota || this.getHandledTodayCount() < preferences.get("moderator.report-quota")
            ? this.getVisibleReports().filter(
                  (r) => this.userCanModerate(user, r) && !this.userAlreadyVoted(user, r),
              )
            : [];
    }

    public getMyReports(): ReportNotification[] {
        const user_id = data.get("user")?.id;
        if (!user_id) {
            return [];
        }
        return this.getVisibleReports().filter((r) => r.reporting_user?.id === user_id);
    }

    public getNotificationReports(): ReportNotification[] {
        const user = data.get("user");
        if (!user) {
            return [];
        }
        return user.is_moderator || user.moderator_powers
            ? this.moderationQueue()
            : this.getMyReports();
    }

    private getVisibleReports(): ReportNotification[] {
        const user = data.get("user");
        if (!user) {
            return [];
        }
        return this.sorted_active_incident_reports.filter((report) => {
            if (!report) {
                return false;
            }
            if (this.getIgnored(report.id)) {
                return false;
            }

            // we can always see our own reports
            if (user.id === report.reporting_user?.id) {
                return true;
            }

            // if it's not ours, we need special powers to see it...
            if (!user.is_moderator && !user.moderator_powers) {
                return false;
            }

            // Community moderators only get to see reports that they have the power for and
            // that they have not yet voted on

            if (user.moderator_powers && !community_mod_can_handle(user, report)) {
                return false;
            }

            // Don't offer community moderation reports to full mods, because community moderators do these.
            // (The only way full moderators see CM-class reports is if they go hunting and claim them)
            // (We do allow full moderators to see all AI reports, even while they're being voted on, at least for now
            if (
                user.is_moderator &&
                !(report.moderator?.id === user.id) && // maybe they already have it, so they need to see it
                ["escaping", "score_cheating", "stalling"].includes(report.report_type)
            ) {
                return false;
            }

            // Never give a claimed report to community moderators
            if (!user.is_moderator && report.moderator?.id) {
                return false;
            }

            if (report.moderator && report.moderator.id !== user.id) {
                // claimed reports are not given out to others
                return false;
            }

            return true;
        });
    }

    public getRelatedReports(report_id: number): ReportRelation[] {
        const related: ReportRelation[] = [];
        const report = this.active_incident_reports[report_id];

        if (!report) {
            return related;
        }

        for (const id in this.sorted_active_incident_reports) {
            const other = this.sorted_active_incident_reports[id];
            if (other.id === report_id) {
                continue;
            }

            const relationships: string[] = [];

            if (report.reported_game && other.reported_game === report.reported_game) {
                relationships.push("Same game");
            }

            if (report.reported_review && other.reported_review === report.reported_review) {
                relationships.push("Same review");
            }

            if (
                report.reporting_user?.id &&
                other.reporting_user?.id === report.reporting_user?.id
            ) {
                relationships.push("Same reporting user");
            }

            if (report.reported_user?.id && other.reported_user?.id === report.reported_user?.id) {
                relationships.push("Same reported user");
            }

            if (relationships.length > 0) {
                related.push({ relationship: relationships.join(", "), report: other });
            }
        }

        return related;
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
        data.set("ignored-reports", ignored, data.Replication.REMOTE_OVERWRITES_LOCAL);
        this.update();
    }

    public async getReportDetails(id: number): Promise<ReportDetail> {
        const res = await get(`moderation/incident/${id}`);

        if (res) {
            return res;
        }

        throw new Error("Report not found");
    }

    public async reopen(report_id: number): Promise<ReportNotification> {
        const res = await post(`moderation/incident/${report_id}`, {
            id: report_id,
            action: "reopen",
        });
        this.updateIncidentReport(res);
        return res;
    }
    public async close(report_id: number, helpful: boolean): Promise<ReportNotification> {
        delete this.active_incident_reports[report_id];
        this.update();
        const res = await post(`moderation/incident/${report_id}`, {
            id: report_id,
            action: "resolve",
            was_helpful: helpful,
        });
        this.updateIncidentReport(res);
        return res;
    }
    public async good_report(report_id: number): Promise<ReportNotification> {
        const res = await this.close(report_id, true);
        this.updateIncidentReport(res);
        return res;
    }
    public async bad_report(report_id: number): Promise<ReportNotification> {
        const res = await this.close(report_id, false);
        this.updateIncidentReport(res);
        return res;
    }
    public async unclaim(report_id: number): Promise<ReportNotification> {
        const res = await post(`moderation/incident/${report_id}`, {
            id: report_id,
            action: "unclaim",
        });
        this.updateIncidentReport(res);
        return res;
    }
    public async claim(report_id: number): Promise<ReportNotification> {
        const res = await post(`moderation/incident/${report_id}`, {
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

    public vote(
        report_id: number,
        voted_action: string,
        escalation_note: string,
        dissenter_note: string,
        voter_note: string,
    ): Promise<ReportNotification> {
        return post(`moderation/incident/${report_id}`, {
            action: "vote",
            voted_action: voted_action,
            escalation_note: escalation_note,
            ...(dissenter_note && { dissenter_note }),
            ...(voter_note && { voter_note }),
        })
            .then((res) => {
                toast(
                    <div>
                        {pgettext(
                            "Thanking a community moderator for voting",
                            "Submitted, thanks!",
                        )}
                    </div>,
                    2000,
                );
                this.updateIncidentReport(res);
                return res;
            })
            .catch((error) => {
                void alert.fire(`Error during vote submission: ${error.error}`);
                console.error("Error during vote submission:", error);
                throw error;
            });
    }

    public getHandledTodayCount(): number {
        return data.get("user").reports_handled_today || 0;
    }
    public getReportsLeftUntilGoal(): number {
        const report_quota = preferences.get("moderator.report-quota");
        const count = this.moderationQueue().length;
        const handled_today = this.getHandledTodayCount();
        return Math.max(0, Math.min(count, report_quota - handled_today));
    }
}

function compare_reports(a: ReportNotification, b: ReportNotification): number {
    const prefs = preferences.get("moderator.report-settings");
    const sort_order = preferences.get("moderator.report-sort-order");
    const user = data.get("user");
    const A_BEFORE_B = -1;
    const B_BEFORE_A = 1;

    const custom_ordering =
        (prefs[a.report_type]?.priority ?? 1) - (prefs[b.report_type]?.priority ?? 1);

    if (!a.moderator && !b.moderator) {
        return custom_ordering || (sort_order === "newest-first" ? b.id - a.id : a.id - b.id);
    }
    if (a.moderator && !b.moderator) {
        if (a.moderator?.id === user.id) {
            return A_BEFORE_B;
        }
        return B_BEFORE_A;
    }
    if (b.moderator && !a.moderator) {
        if (b.moderator?.id === user.id) {
            return B_BEFORE_A;
        }
        return A_BEFORE_B;
    }

    // both have moderators, sort our mod reports first, then other
    // mods, then by id

    if (a.moderator?.id !== user.id && b.moderator?.id === user.id) {
        return B_BEFORE_A;
    }
    if (a.moderator?.id === user.id && b.moderator?.id !== user.id) {
        return A_BEFORE_B;
    }

    return custom_ordering || (sort_order === "newest-first" ? b.id - a.id : a.id - b.id);
}

export const report_manager = new ReportManager();

window.report_manager = report_manager;
