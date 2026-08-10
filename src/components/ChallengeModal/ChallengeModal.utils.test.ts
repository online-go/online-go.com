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

import { preferred_setting_label, sort_preferred_settings } from "./ChallengeModal.utils";
import { ChallengeDetails } from "@/components/ChallengeModal/ChallengeModal.types";

jest.mock("@/lib/translate", () => ({
    _: (s: string) => s,
    pgettext: (_c: string, s: string) => s,
    npgettext: (_c: string, s: string, p: string, n: number) => (n === 1 ? s : p),
    llm_pgettext: (_c: string, s: string) => s,
    interpolate: (str: string, params: Array<any> | { [key: string]: any }) => {
        if (Array.isArray(params)) {
            let idx = 0;
            return str.replace(/%[sd]/g, () => params[idx++]);
        }
        if (typeof params === "object" && params !== null) {
            return str.replace(/{{([^}]+)}}/g, (_m: string, key: string) => params[key] ?? "");
        }
        return str.replace(/%[sd]/g, () => params);
    },
}));

jest.mock("@/lib/misc", () => ({
    rulesText: (rules: string) => rules,
}));

jest.mock("@/components/TimeControl", () => ({
    shortShortTimeControl: () => "10 min",
    timeControlSystemText: (system: string) => system,
}));

jest.mock("@/lib/rank_utils", () => ({
    rankSelectorIndexToText: (r: number) => `rank ${r}`,
}));

jest.mock("@/lib/data", () => ({
    get: jest.fn(() => undefined),
}));

function makeSetting(
    name: string,
    overrides: { game?: Partial<ChallengeDetails["game"]> } = {},
): ChallengeDetails {
    return {
        initialized: false,
        min_ranking: -1000,
        max_ranking: 1000,
        challenger_color: "automatic",
        rengo_auto_start: 0,
        game: {
            name,
            rules: "japanese",
            ranked: false,
            width: 19,
            height: 19,
            handicap: 0,
            komi_auto: "automatic",
            disable_analysis: false,
            initial_state: null,
            private: false,
            rengo: false,
            rengo_casual_mode: true,
            ...(overrides.game ?? {}),
        },
    };
}

describe("preferred_setting_label", () => {
    it("prefixes the description with the game name", () => {
        expect(preferred_setting_label(makeSetting("Bot Practice 1"))).toBe(
            "Bot Practice 1 | Unranked, 19x19, japanese rules, 0 handicap",
        );
    });

    it("does not add a prefix when the game has no name", () => {
        const label = preferred_setting_label(makeSetting(""));
        expect(label).toBe("Unranked, 19x19, japanese rules, 0 handicap");
        expect(label).not.toContain("|");
    });

    it("treats a whitespace-only name as unnamed", () => {
        const label = preferred_setting_label(makeSetting("   "));
        expect(label).not.toContain("|");
    });
});

describe("sort_preferred_settings", () => {
    function optionsOf(settings: ChallengeDetails[]) {
        return settings.map((setting, index) => ({
            value: index,
            label: preferred_setting_label(setting),
            setting,
        }));
    }

    it("sorts named games alphabetically before unnamed games", () => {
        const settings = [
            makeSetting("Zulu"),
            makeSetting(""),
            makeSetting("bravo"),
            makeSetting("Alpha"),
        ];
        const sorted = sort_preferred_settings(optionsOf(settings));

        expect(sorted.map((o) => o.setting.game.name)).toEqual(["Alpha", "bravo", "Zulu", ""]);
        expect(sorted.map((o) => o.value)).toEqual([3, 2, 0, 1]);
    });

    it("sorts unnamed games alphabetically by description after named games", () => {
        const settings = [
            makeSetting("", { game: { width: 19, height: 19 } }),
            makeSetting("Named"),
            makeSetting("", { game: { width: 9, height: 9 } }),
        ];
        const sorted = sort_preferred_settings(optionsOf(settings));

        expect(sorted.map((o) => o.setting.game.name)).toEqual(["Named", "", ""]);
        expect(sorted[1].label).toBe("Unranked, 19x19, japanese rules, 0 handicap");
        expect(sorted[2].label).toBe("Unranked, 9x9, japanese rules, 0 handicap");
    });
});
