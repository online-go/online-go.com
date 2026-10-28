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

import * as React from "react";
import type { GobanController } from "@/lib/GobanController";

export function useKibitzScoreEstimation(
    controller: GobanController | null,
    source: GobanController | null,
    roomChannel: string,
): { estimating: boolean; disabled: boolean; toggle: () => void } {
    const [, refresh] = React.useReducer((value: number) => value + 1, 0);

    React.useEffect(() => {
        if (!controller || !source) {
            return;
        }
        const sync = () => refresh();
        const checkMode = () => {
            if (controller.estimating_score && controller.goban.mode !== "score estimation") {
                controller.stopEstimatingScore();
            }
            sync();
        };
        const checkAccess = () => {
            if (controller.estimating_score && !controller.canEstimateScore(source)) {
                controller.stopEstimatingScore();
            }
            sync();
        };
        controller.on("estimating_score", sync);
        controller.goban.on("mode", checkMode);
        source.goban.on("phase", checkAccess);
        source.goban.on("load", checkAccess);
        sync();
        return () => {
            controller.off("estimating_score", sync);
            controller.goban.off("mode", checkMode);
            source.goban.off("phase", checkAccess);
            source.goban.off("load", checkAccess);
            if (!controller.destroyed && controller.estimating_score) {
                controller.stopEstimatingScore();
            }
        };
    }, [controller, source, roomChannel]);

    return {
        estimating: controller?.estimating_score ?? false,
        disabled: !controller || !source || !controller.canEstimateScore(source),
        toggle: () => {
            if (controller?.estimating_score) {
                controller.stopEstimatingScore();
            } else if (controller && source) {
                controller.estimateScore({ source, preserveAnnotations: true });
            }
        },
    };
}
