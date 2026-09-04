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

import { AI_QUALITY_BADGES, DEFAULT_SCORE_DIFF_THRESHOLDS } from "goban";
import { EXCELLENT_BLEND_CAP, lerpColor, qualityColor } from "./generateHeatmapAndMarks";

describe("qualityColor", () => {
    test("no data gives no color", () => {
        expect(qualityColor(undefined, undefined)).toBeNull();
    });

    test("no loss leans toward excellent but keeps some green", () => {
        expect(qualityColor(0, 0)).toBe(
            lerpColor(AI_QUALITY_BADGES.great.color, AI_QUALITY_BADGES.excellent.color, 0.75),
        );
        expect(EXCELLENT_BLEND_CAP).toBe(0.75);
    });

    test("the middle of the great band is pure great", () => {
        const t = DEFAULT_SCORE_DIFF_THRESHOLDS;
        expect(qualityColor((t.Excellent + t.Great) / 2, 0)).toBe(AI_QUALITY_BADGES.great.color);
    });

    test("a large score loss is a blunder even when the win rate barely moves", () => {
        expect(qualityColor(15, 0.1)).toBe(AI_QUALITY_BADGES.blunder.color);
    });

    test("a large win rate loss is a blunder even when the score barely moves", () => {
        expect(qualityColor(1, 90)).toBe(AI_QUALITY_BADGES.blunder.color);
    });

    test("the worse metric decides the color", () => {
        const from_score = qualityColor(3, undefined);
        const from_win_rate = qualityColor(undefined, 2);
        expect(qualityColor(3, 2)).toBe(from_score);
        expect(qualityColor(0.1, 2)).toBe(from_win_rate);
    });

    test("a missing metric does not pull the color down", () => {
        expect(qualityColor(undefined, 90)).toBe(AI_QUALITY_BADGES.blunder.color);
        expect(qualityColor(15, undefined)).toBe(AI_QUALITY_BADGES.blunder.color);
    });
});
