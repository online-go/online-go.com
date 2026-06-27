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

import { community_mod_has_power } from "@/lib/report_util";
import { MODERATOR_POWERS } from "@/lib/moderation";

describe("community_mod_has_power for malicious_report", () => {
    test("returns true when user has HANDLE_MALICIOUS_REPORT", () => {
        expect(
            community_mod_has_power(MODERATOR_POWERS.HANDLE_MALICIOUS_REPORT, "malicious_report"),
        ).toBe(true);
    });

    test("returns false when user lacks HANDLE_MALICIOUS_REPORT", () => {
        expect(community_mod_has_power(MODERATOR_POWERS.HANDLE_STALLING, "malicious_report")).toBe(
            false,
        );
    });
});
