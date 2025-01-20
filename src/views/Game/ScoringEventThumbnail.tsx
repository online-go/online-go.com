/*
 * Copyright (C)  Online-Go.com
 * Copyright (C)  Benjamin P. Jones
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

import { GobanRenderer, GobanRendererConfig, createGoban, decodeMoves } from "goban";
import React from "react";
import { PersistentElement } from "../../components/PersistentElement";

export function ScoringEventThumbnail({
    config,
    move_number,
    removal_string,
}: {
    config: GobanRendererConfig;
    move_number: number | undefined;
    removal_string: string | undefined;
}) {
    const goban_div = React.useRef<HTMLDivElement>(
        (() => {
            const ret = document.createElement("div");
            ret.className = "Goban";
            return ret;
        })(),
    );
    const goban = React.useRef<GobanRenderer | null>(null);

    React.useEffect(() => {
        goban.current = createGoban({
            ...config,
            board_div: goban_div.current,
            server_socket: undefined,
        });
        const engine = goban.current.engine;
        if (move_number != null) {
            engine.jumpToOfficialMoveNumber(move_number);
        }
        if (removal_string != null) {
            decodeMoves(removal_string, config.width ?? 19, config.height ?? 19).forEach(
                ({ x, y }) => {
                    engine.setRemoved(x, y, true);
                },
            );
        }
        const score = engine.computeScore();
        goban.current?.showScores(score);

        return () => {
            goban.current?.destroy();
        };
    }, [config]);

    return <PersistentElement className={"goban-thumbnail"} elt={goban_div.current} />;
}
