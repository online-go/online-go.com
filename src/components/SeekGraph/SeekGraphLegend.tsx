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

import React from "react";
import { Card } from "@/components/material";
import { _ } from "@/lib/translate";
import {
    drawChallengeCircle,
    drawChallengeSquare,
    drawChallengeTriangle,
    drawLegendKey,
} from "./SeekGraphSymbols";
import { ChallengePointStyle, SeekGraphColorPalette, SeekGraphPalettes } from "./SeekGraphPalettes";
import * as data from "@/lib/data";
import { ChallengeFilter, ChallengeFilterKey } from "@/lib/challenge_utils";
// import { SeekGraph } from "./SeekGraph";
// import { SeekGraphColorPalette } from "./SeekGraphPalettes";

interface SeekGraphLegendProps {
    filter: ChallengeFilter;
    showIcons: boolean;
    toggleHandler: (key: ChallengeFilterKey) => void;
}

export function SeekGraphLegend(props: SeekGraphLegendProps): React.ReactElement {
    const [currentPalette, setCurrentPalette] = React.useState<SeekGraphColorPalette>(
        SeekGraphPalettes.DARK,
    );
    React.useEffect(() => {
        const callback = (theme?: string) => {
            if (theme) {
                setCurrentPalette(SeekGraphPalettes.getPalette(theme));
            }
        };
        data.watch("theme", callback);
        return () => data.unwatch("theme", callback);
    }, []);

    const legendItem = (
        text: string,
        iconCreator: () => React.ReactElement,
        filterKey: ChallengeFilterKey,
    ): React.ReactElement => {
        return (
            <div key={text} className="legend-item">
                {props.showIcons && iconCreator()}
                <input
                    id={text}
                    type="checkbox"
                    checked={props.filter[filterKey]}
                    onChange={() => props.toggleHandler(filterKey)}
                ></input>
                <label htmlFor={text}>{text}</label>
            </div>
        );
    };

    const group1 = [
        legendItem(_("19x19"), () => BoardSizeLegendIcon(currentPalette.size19), "show19x19"),
        legendItem(
            _("Ranked"),
            () =>
                LegendIcon((ctx) => {
                    return drawChallengeSquare(
                        ICON_CENTER.x,
                        ICON_CENTER.y,
                        ICON_HEIGHT - 2,
                        currentPalette.legend,
                        ctx,
                    );
                }),
            "showRanked",
        ),
        legendItem(
            _("Handicap"),
            () => BoardSizeLegendIcon(currentPalette.handicap),
            "showHandicap",
        ),
    ];
    const group2 = [
        legendItem(_("13x13"), () => BoardSizeLegendIcon(currentPalette.size13), "show13x13"),
        legendItem(
            _("Unranked"),
            () =>
                LegendIcon((ctx) => {
                    return drawChallengeTriangle(
                        ICON_CENTER.x,
                        ICON_CENTER.y,
                        ICON_HEIGHT - 2,
                        currentPalette.legend,
                        ctx,
                    );
                }),
            "showUnranked",
        ),
        legendItem(
            _("Other"),
            () => BoardSizeLegendIcon(currentPalette.sizeOther),
            "showOtherSizes",
        ),
    ];
    const group3 = [
        legendItem(_("9x9"), () => BoardSizeLegendIcon(currentPalette.size9), "show9x9"),
        legendItem(
            _("Rengo"),
            () =>
                LegendIcon((ctx) =>
                    drawChallengeCircle(
                        ICON_CENTER.x,
                        ICON_CENTER.y,
                        (ICON_HEIGHT - 2) / 2,
                        currentPalette.legend,
                        ctx,
                    ),
                ),
            "showRengo",
        ),
        legendItem(
            _("Ineligible"),
            () => BoardSizeLegendIcon(currentPalette.ineligible),
            "showIneligible",
        ),
    ];

    return (
        <div className="seek-graph-legend">
            <Card>
                <div className="row">
                    <div className="legend-group grid">{group1}</div>
                    <div className="legend-group grid">{group2}</div>
                    <div className="legend-group grid">{group3}</div>
                </div>
            </Card>
        </div>
    );
}

const ICON_WIDTH = 20;
const ICON_HEIGHT = 10;
const ICON_CENTER = { x: ICON_WIDTH / 2, y: ICON_HEIGHT / 2 };
const ICON_SCALE = 2;

function LegendIcon(draw: (ctx: CanvasRenderingContext2D) => void): React.ReactElement {
    const canvas = React.useRef<HTMLCanvasElement>(null);
    React.useEffect(() => {
        const ctx: CanvasRenderingContext2D | undefined | null = canvas?.current?.getContext("2d");
        if (ctx) {
            // ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.resetTransform();
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            // This gives higher quality rendering while allowing canvas drawing code to use the "true" dimensions
            // The CSS width/height are set to half of the below width and height (20, 10)
            ctx.scale(ICON_SCALE, ICON_SCALE);
            draw(ctx);
        }
    });
    return (
        <canvas ref={canvas} width={ICON_WIDTH * ICON_SCALE} height={ICON_HEIGHT * ICON_SCALE} />
    );
}

function BoardSizeLegendIcon(style: ChallengePointStyle) {
    return LegendIcon((ctx) => {
        drawLegendKey(
            ICON_CENTER.x,
            ICON_CENTER.y,
            ICON_WIDTH - 2,
            ICON_HEIGHT - 2,
            (ICON_HEIGHT - 2) / 2,
            style,
            ctx,
        );
    });
}
