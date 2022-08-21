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

import * as React from "react";
import { GoConditionalMove } from "goban";
import { useGoban } from "./goban_context";
import { generateGobanHook } from "./GameHooks";

interface ConditionalMoveTreeDisplayProps {
    tree: GoConditionalMove;
    cpath: string;
}

export function ConditionalMoveTreeDisplay({ tree, cpath }: ConditionalMoveTreeDisplayProps) {
    const player_move: string = tree.move;

    const goban = useGoban();
    const opponent_color = goban.conditional_starting_color;
    const player_color = opponent_color === "black" ? "white" : "black";
    const selected_path = useCurrentConditionalpath(goban);
    const player_move_selected = player_move && cpath + player_move === selected_path;

    if (!cpath) {
        return (
            <div className="conditional-move-tree-container">
                {Object.keys(tree.children).map((opponent_move: string) => {
                    const child_tree = tree.getChild(opponent_move);
                    return (
                        <ConditionalMoveTreeDisplay
                            tree={child_tree}
                            cpath={opponent_move}
                            key={opponent_move}
                        />
                    );
                })}
            </div>
        );
    }

    return (
        <ul className="tree">
            <li className="move-row">
                <MoveEntry color={opponent_color} cpath={cpath} />
                {player_move && <MoveEntry color={player_color} cpath={cpath + player_move} />}
                {player_move_selected && <DeleteButton cpath={cpath + player_move} />}
                {Object.keys(tree.children).map((opponent_move: string) => {
                    const child_tree = tree.getChild(opponent_move);
                    const child_cpath = cpath + player_move + opponent_move;
                    return (
                        <ConditionalMoveTreeDisplay
                            tree={child_tree}
                            cpath={child_cpath}
                            key={opponent_move}
                        />
                    );
                })}
            </li>
        </ul>
    );
}

interface MoveEntryProps {
    color: "black" | "white" | "invalid";
    cpath: string;
}

const useCurrentConditionalpath = generateGobanHook(
    (goban) => goban.getCurrentConditionalPath(),
    ["conditional-moves.updated"],
);

function MoveEntry({ color, cpath }: MoveEntryProps) {
    const goban = useGoban();
    const mv = goban.engine.decodeMoves(cpath.slice(-2))[0];
    const selected_cpath = useCurrentConditionalpath(goban);
    const selected = cpath === selected_cpath;

    const cb = () => {
        goban.jumpToLastOfficialMove();
        console.log(cpath);
        goban.followConditionalPath(cpath);
        goban.redraw();
    };

    if (!mv) {
        return;
    }

    return (
        <span className={`entry ${selected ? "selected" : ""}`} onClick={cb}>
            <span className={`stone ${color}`}></span>
            <span>{goban.engine.prettyCoords(mv.x, mv.y)}</span>
        </span>
    );
}

function DeleteButton({ cpath }: { cpath: string }) {
    const goban = useGoban();
    const cb = () => {
        goban.jumpToLastOfficialMove();
        goban.deleteConditionalPath(cpath);
        goban.redraw();
    };
    return <i className="fa fa-times delete-move" onClick={cb} />;
}
