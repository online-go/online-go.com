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

import * as preferences from "@/lib/preferences";
import * as data from "@/lib/data";

const TEST_USER: rest_api.UserConfig = {
    anonymous: false,
    id: 123,
    username: "test_user",
    registration_date: "2022-05-10 11:03:24.299562+00:00",
    ratings: {
        version: 5,
        overall: { rating: 1500, deviation: 350, volatility: 0.06 },
    },
    country: "un",
    professional: false,
    ranking: 23,
    provisional: 0,
    can_create_tournaments: true,
    is_moderator: false,
    is_superuser: false,
    moderator_powers: 0,
    offered_moderator_powers: 0,
    is_tournament_moderator: false,
    supporter: true,
    supporter_level: 4,
    tournament_admin: false,
    ui_class: "",
    icon: "https://secure.gravatar.com/avatar/8d809ecc50408afc399a4cb7c8fd4510?s=32&d=retro",
    email: "",
    email_validated: false,
    is_announcer: false,
    last_supporter_trial: "",
};

describe("last-move crosshair preferences", () => {
    test("defaults are disabled, blue, thickness 0.1", () => {
        expect(preferences.get("accessibility.last-move-crosshair")).toBe(false);
        expect(preferences.get("accessibility.last-move-crosshair-color")).toBe("#1e6bff");
        expect(preferences.get("accessibility.last-move-crosshair-thickness")).toBe(0.1);
    });
});

describe("stone scale preferences", () => {
    test("defaults to normal size and is included in selected goban themes", () => {
        data.set("user", TEST_USER);

        expect(preferences.get("goban-theme-stone-scale")).toBe(1.0);
        expect(preferences.getSelectedThemes()["stone-scale"]).toBe(1.0);
    });
});
