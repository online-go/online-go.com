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

type Challenge = socket_api.seekgraph_global.Challenge;

export interface ChallengePointStyle {
    fill: string;
    stroke: string;
}

export interface SeekGraphColorPalette {
    size19: ChallengePointStyle;
    size13: ChallengePointStyle;
    size9: ChallengePointStyle;
    sizeOther: ChallengePointStyle;
    handicap: ChallengePointStyle;
    // UNRANKED: ChallengePointStyle;
    ineligible: ChallengePointStyle;
    user: ChallengePointStyle;
    legend: ChallengePointStyle;
    textColor: string;
    axisColor: string;
    rankLineColor: string;
    timeLineColor: string;
}

export class SeekGraphPalettes {
    static readonly DARK: SeekGraphColorPalette = {
        size19: { fill: "#00aa30aa", stroke: "#00ff00" },
        size13: { fill: "#f000d0aa", stroke: "#ff60dd" },
        size9: { fill: "#009090aa", stroke: "#00ffff" },
        sizeOther: { fill: "#d06000aa", stroke: "#ff9000" },
        handicap: { fill: "#d1cb0faa", stroke: "#fff712" },
        // UNRANKED: { fill: "#d06000", stroke: "#ff9000" },
        ineligible: { fill: "#6b6b6baa", stroke: "#bbb" },
        user: { fill: "#ed1f1faa", stroke: "#e37495" },
        legend: { fill: "#FFFFFFAA", stroke: "#FFF" },
        textColor: "#dddddd",
        axisColor: "#666666",
        rankLineColor: "#ccccff",
        timeLineColor: "#aaaaaa",
    };
    static readonly LIGHT: SeekGraphColorPalette = {
        size19: { fill: "#00ff00aa", stroke: "#00aa30" },
        size13: { fill: "#ff60ddaa", stroke: "#f000d0" },
        size9: { fill: "#00ffffaa", stroke: "#009090" },
        sizeOther: { fill: "#ff9000aa", stroke: "#d06000" },
        handicap: { fill: "#fff712aa", stroke: "#d1cb0f" },
        // UNRANKED: { fill: "#d06000", stroke: "#ff9000" },
        ineligible: { fill: "#bbbbbbaa", stroke: "#6b6b6b" },
        user: { fill: "#e37495aa", stroke: "#ed1f1f" },
        legend: { fill: "#222222AA", stroke: "#222" },
        textColor: "#000000",
        axisColor: "#666666",
        rankLineColor: "#ccccff",
        timeLineColor: "#aaaaaa",
    };
    static readonly ACCESSIBLE: SeekGraphColorPalette = {
        size19: { fill: "#02a172aa", stroke: "#02a172" },
        size13: { fill: "#cc73a8aa", stroke: "#cc73a8" },
        size9: { fill: "#55b2ebaa", stroke: "#55b2eb" },
        sizeOther: { fill: "#d55b00aa", stroke: "#d55b00" },
        handicap: { fill: "#d55b00aa", stroke: "#d55b00" },
        // UNRANKED: { fill: "#d06000", stroke: "#ff9000" },
        ineligible: { fill: "#bbbbbbaa", stroke: "#bbb" },
        user: { fill: "#e6a100aa", stroke: "#e6a100" },
        legend: { fill: "#FFFFFFAA", stroke: "#FFF" },
        textColor: "#dddddd",
        axisColor: "#666666",
        rankLineColor: "#ccccff",
        timeLineColor: "#aaaaaa",
    };

    static getPalette(siteTheme: string): SeekGraphColorPalette {
        if (siteTheme === "light") {
            return SeekGraphPalettes.LIGHT;
        }
        if (siteTheme === "accessible") {
            return SeekGraphPalettes.ACCESSIBLE;
        }
        return SeekGraphPalettes.DARK;
    }

    static getStyle(challenge: Challenge, palette: SeekGraphColorPalette): ChallengePointStyle {
        if (challenge.user_challenge) {
            return palette.user;
        }
        if (challenge.eligible === false) {
            return palette.ineligible;
        }

        if (challenge.width === challenge.height) {
            if (challenge.width === 19) {
                return palette.size19;
            }
            if (challenge.width === 13) {
                return palette.size13;
            }
            if (challenge.width === 9) {
                return palette.size9;
            }
        }
        return palette.sizeOther;
    }
}
