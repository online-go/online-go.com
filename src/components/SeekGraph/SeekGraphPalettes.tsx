/*
 * Copyright (C) 2012-2022  Online-Go.com
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
    // UNRANKED: ChallengePointStyle;
    ineligible: ChallengePointStyle;
    user: ChallengePointStyle;
}

export class SeekGraphPalettes {
    static readonly DARK: SeekGraphColorPalette = {
        size19: { fill: "#00aa30", stroke: "#00ff00" },
        size13: { fill: "#f000d0", stroke: "#ff60dd" },
        size9: { fill: "#009090", stroke: "#00ffff" },
        sizeOther: { fill: "#d06000", stroke: "#ff9000" },
        // UNRANKED: { fill: "#d06000", stroke: "#ff9000" },
        ineligible: { fill: "#bbb", stroke: "#aaa" },
        user: { fill: "#ed1f1f", stroke: "#e25551" },
    };
    static readonly LIGHT: SeekGraphColorPalette = {
        size19: { fill: "#00ff00", stroke: "#00aa30" },
        size13: { fill: "#ff60dd", stroke: "#f000d0" },
        size9: { fill: "#00ffff", stroke: "#009090" },
        sizeOther: { fill: "#ff9000", stroke: "#d06000" },
        // UNRANKED: { fill: "#d06000", stroke: "#ff9000" },
        ineligible: { fill: "#aaa", stroke: "#bbb" },
        user: { fill: "#e25551", stroke: "#ed1f1f" },
    };
    static readonly ACCESSIBLE: SeekGraphColorPalette = {
        size19: { fill: "#00aa30", stroke: "#00ff00" },
        size13: { fill: "#f000d0", stroke: "#ff60dd" },
        size9: { fill: "#009090", stroke: "#00ffff" },
        sizeOther: { fill: "#d06000", stroke: "#ff9000" },
        // UNRANKED: { fill: "#d06000", stroke: "#ff9000" },
        ineligible: { fill: "#bbb", stroke: "#aaa" },
        user: { fill: "#ed1f1f", stroke: "#e25551" },
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

        if (challenge.width === 19) {
            return palette.size19;
        }
        if (challenge.width === 13) {
            return palette.size13;
        }
        if (challenge.width === 9) {
            return palette.size9;
        }
        return palette.sizeOther;
    }
}
