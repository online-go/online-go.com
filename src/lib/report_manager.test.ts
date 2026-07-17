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
    get: jest.fn(() => undefined),
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

function escapingReport(id: number, reportedUserId: number, votedByCM: boolean) {
    return {
        id,
        report_type: "escaping",
        reported_user: { id: reportedUserId },
        reporting_user: { id: 2000 }, // not the CM, so it is not "our own" report
        moderator: undefined, // unclaimed
        escalated: false,
        voters: votedByCM ? [{ voter_id: CM_ID, updated: "2026-07-16T00:00:00Z" }] : [],
    } as any;
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
