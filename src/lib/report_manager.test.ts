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
 * Unit tests for ReportManager.moderationQueue escaping-report serialization.
 *
 * A community moderator must see only the oldest active escaping report per
 * reported player at a time, and must not have a newer report leak in after
 * they have voted on the oldest one (which resolves only on CM consensus).
 */

// Module mocks: importing report_manager runs the singleton constructor and
// pulls in several collaborators at module load. Stub them so the import is
// side-effect-free under jsdom. The last group is only touched by methods this
// test does not call; trivial stubs keep their (potentially React-heavy)
// import graphs out of the test.
jest.mock("@/lib/sockets", () => ({
    socket: { on: jest.fn(), connected: false },
}));
jest.mock("@/lib/preferences", () => ({
    get: jest.fn((key: string) => (key === "moderator.report-settings" ? {} : undefined)),
    watch: jest.fn(),
}));
// @/lib/report_util is deliberately NOT mocked: getVisibleReports() relies on
// the real community_mod_can_handle(), which hides a report from a CM once they
// have voted on it (for non-escalated reports). That is the exact interaction
// the serialization must survive, so mocking it away would hide the bug.
jest.mock("@/lib/translate", () => ({
    pgettext: (_ctx: string, s: string) => s,
}));
jest.mock("@/lib/swal_config", () => ({ alert: { fire: jest.fn() } }));
jest.mock("@/lib/toast", () => ({ toast: jest.fn() }));
jest.mock("@/components/Notifications", () => ({ emitNotification: jest.fn() }));
jest.mock("@/lib/ogsHistory", () => ({ browserHistory: { push: jest.fn() } }));
jest.mock("@/lib/requests", () => ({ get: jest.fn(), post: jest.fn() }));

// CM user id. Kept as a literal inside the data factory too (the factory is
// hoisted and cannot safely close over a non-`mock`-prefixed const).
const CM_ID = 1000;
jest.mock("@/lib/data", () => ({
    get: (key: string) => {
        if (key === "user") {
            // HANDLE_ESCAPING power (0b010) so the real community_mod_can_handle
            // grants this CM escaping reports they have not voted on
            return { id: 1000, is_moderator: false, moderator_powers: 0b010 };
        }
        if (key === "ignored-reports") {
            return {};
        }
        return undefined;
    },
    set: jest.fn(),
    watch: jest.fn(),
}));

import { report_manager } from "./report_manager";
import type { ReportNotification } from "./report_util";

function escapingReport(
    id: number,
    reportedUserId: number,
    votedByCM: boolean,
): ReportNotification {
    return {
        id,
        report_type: "escaping",
        reported_user: { id: reportedUserId, username: `accused-${reportedUserId}` },
        reporting_user: { id: 2000, username: "reporter" }, // not the CM, so it is not "our own" report
        moderator: undefined, // unclaimed
        escalated: false,
        voters: votedByCM ? [{ voter_id: CM_ID, updated: "2026-07-16T00:00:00Z" }] : [],
    } as ReportNotification;
}

describe("moderationQueue escaping serialization", () => {
    it("suppresses a newer escaping report after the CM voted on the older one", () => {
        const older = escapingReport(1, 500, /* votedByCM */ true);
        const newer = escapingReport(2, 500, /* votedByCM */ false);
        report_manager.sorted_active_incident_reports = [older, newer];

        const queue = report_manager.moderationQueue();
        const ids = queue.map((r) => r.id);

        // The CM has done their part on report 1 (awaiting other CMs), so they
        // see nothing for this player until report 1 resolves. Report 2 must
        // not leak in.
        expect(ids).not.toContain(2);
        expect(ids).not.toContain(1); // already voted -> removed at the end
    });

    it("shows only the oldest when none are voted yet", () => {
        const older = escapingReport(10, 501, /* votedByCM */ false);
        const newer = escapingReport(11, 501, /* votedByCM */ false);
        report_manager.sorted_active_incident_reports = [older, newer];

        const ids = report_manager.moderationQueue().map((r) => r.id);
        expect(ids).toContain(10);
        expect(ids).not.toContain(11);
    });
});

describe("report queue updates", () => {
    beforeEach(() => {
        report_manager.active_incident_reports = {};
        report_manager.sorted_active_incident_reports = [];
        report_manager.this_user_reported_games = [];
    });

    it("holds the next report until consensus resolves the first", () => {
        const first = escapingReport(20, 502, false);
        const next = escapingReport(21, 502, false);
        report_manager.updateIncidentReport(next);
        report_manager.updateIncidentReport(first);
        expect(report_manager.moderationQueue().map((report) => report.id)).toEqual([20]);

        report_manager.updateIncidentReport(escapingReport(20, 502, true));
        expect(report_manager.moderationQueue()).toEqual([]);

        report_manager.updateIncidentReport({ ...first, state: "resolved" });
        expect(report_manager.moderationQueue().map((report) => report.id)).toEqual([21]);

        report_manager.updateIncidentReport({ ...next, state: "resolved" });
        expect(report_manager.moderationQueue()).toEqual([]);
    });

    it("keeps queues for different accused players independent", () => {
        report_manager.updateIncidentReport(escapingReport(30, 503, true));
        report_manager.updateIncidentReport(escapingReport(31, 503, false));
        report_manager.updateIncidentReport(escapingReport(32, 504, false));
        expect(report_manager.moderationQueue().map((report) => report.id)).toEqual([32]);
    });

    it("counts only this reporter's reports when another user files one", () => {
        const own = {
            ...escapingReport(40, 505, false),
            reporting_user: { id: CM_ID, username: "reporter" },
        };
        report_manager.updateIncidentReport(own);
        report_manager.updateIncidentReport(escapingReport(41, 506, false));
        expect(report_manager.getMyReports().map((report) => report.id)).toEqual([40]);

        report_manager.updateIncidentReport({ ...own, state: "resolved" });
        expect(report_manager.getMyReports()).toEqual([]);
    });
});
