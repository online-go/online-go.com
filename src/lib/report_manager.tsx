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

import * as React from "react";
import * as data from "data";
import * as preferences from "preferences";
import { toast } from "toast";
import { alert } from "swal_config";
import { socket } from "sockets";
import { pgettext } from "translate";
import { ReportedConversation } from "Report";
import { PlayerCacheEntry } from "player_cache";
import { EventEmitter } from "eventemitter3";
import { emitNotification } from "Notifications";
import { browserHistory } from "ogsHistory";
import { get, post } from "requests";
import { MODERATOR_POWERS } from "moderation";

export const DAILY_REPORT_GOAL = 10;

const DONT_OFFER_COMMUNITY_MODERATION_TYPES_TO_MODERATORS = false;

interface Vote {
    voter_id: number;
    action: string;
}

export interface Report {
    // TBD put this into /models, in a suitable namespace?
    // TBD: relationship between this and SeverToClient['incident-report']
    id: number;
    created: string;
    updated: string;
    state: string;
    escalated: boolean;
    source: string;
    report_type: string;
    reporting_user: any;
    reported_user: any;
    reported_game: number;
    reported_game_move?: number;
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
    detected_ai_games: Array<Object>;

    automod_to_moderator?: string; // Suggestions from "automod"
    automod_to_reporter?: string;
    automod_to_reported?: string;

    available_actions: Array<string>; // community moderator actions
    voters: Vote[]; // votes from community moderators on this report
    community_mod_note: string;

    unclaim: () => void;
    claim: () => void;
    steal: () => void;
    bad_report: () => void;
    good_report: () => void;
    cancel: () => void;
    set_note: () => void;
}

export interface ReportRelation {
    relationship: string;
    report: Report;
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
            this.updateIncidentReport(report as any as Report),
        );

        preferences.watch("moderator.report-settings", () => {
            this.update();
        });

        preferences.watch("moderator.report-sort-order", () => {
            this.update();
        });
    }

    public updateIncidentReport(report: Report) {
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

        if (
            report.state === "resolved" ||
            report.voters?.some((vote) => vote.voter_id === user.id) ||
            (user.moderator_powers && report.escalated)
        ) {
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

        const reports: Report[] = [];
        let normal_ct = 0;
        for (const id in this.active_incident_reports) {
            const report = this.active_incident_reports[id];
            if ((prefs[report.report_type]?.visible ?? true) && !this.getIgnored(report.id)) {
                reports.push(report);
                if (!report.moderator || report.moderator.id === user.id) {
                    normal_ct++;
                }
            }
        }

        reports.sort(compare_reports);

        this.sorted_active_incident_reports = reports;
        this.emit("active-count", normal_ct);
        this.emit("update");
    }

    public getAvailableReports(): Report[] {
        const user = data.get("user");

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
            // that they have not yet voted on.
            const has_handle_score_cheat =
                (user.moderator_powers & MODERATOR_POWERS.HANDLE_SCORE_CHEAT) > 0;
            const has_handle_escaping =
                (user.moderator_powers & MODERATOR_POWERS.HANDLE_ESCAPING) > 0;
            const has_handle_stalling =
                (user.moderator_powers & MODERATOR_POWERS.HANDLE_STALLING) > 0;

            const report_type = report.report_type;
            if (
                !user.is_moderator &&
                user.moderator_powers &&
                ((!(report_type === "score_cheating" && has_handle_score_cheat) &&
                    !(report_type === "escaping" && has_handle_escaping) &&
                    !(report_type === "stalling" && has_handle_stalling)) ||
                    report.voters?.some((vote) => vote.voter_id === user.id) ||
                    report.escalated)
            ) {
                return false;
            }

            if (DONT_OFFER_COMMUNITY_MODERATION_TYPES_TO_MODERATORS) {
                // don't hand community moderation reports to full mods unless the report is escalated,
                // because community moderators are supposed to do these!
                if (
                    user.is_moderator &&
                    !(report.moderator?.id === user.id) && // maybe they already have it, so they need to see it
                    ["escaping", "score_cheating", "stalling"].includes(report_type) &&
                    !report.escalated
                ) {
                    return false;
                }
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
        const res = await post(`moderation/incident/${report_id}`, {
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
        const res = await post(`moderation/incident/${report_id}`, {
            id: report_id,
            action: "unclaim",
        });
        this.updateIncidentReport(res);
        return res;
    }
    public async claim(report_id: number): Promise<Report> {
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
    public vote(report_id: number, voted_action: string, mod_note: string): Promise<Report> {
        const res = post(`moderation/incident/${report_id}`, {
            action: "vote", // darn, yes, two different uses of the word "action" collide here
            voted_action: voted_action,
            mod_note,
        }).then((res) => {
            toast(
                <div>
                    {pgettext("Thanking a community moderator for voting", "Submitted, thanks!")}
                </div>,
                2000,
            );
            this.updateIncidentReport(res);
            return res;
        });
        return res;
    }

    public getHandledTodayCount(): number {
        return data.get("user").reports_handled_today || 0;
    }
    public getReportsLeftUntilGoal(): number {
        const count = this.getAvailableReports().length;
        const handled_today = this.getHandledTodayCount();
        return Math.max(0, Math.min(count, DAILY_REPORT_GOAL - handled_today));
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
        return custom_ordering || (sort_order === "newest-first" ? b.id - a.id : a.id - b.id);
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

(window as any)["report_manager"] = report_manager;
