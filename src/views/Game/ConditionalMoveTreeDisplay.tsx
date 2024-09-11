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
import { ConditionalMoveTree } from "goban";
import { useGoban } from "./goban_context";
import { generateGobanHook } from "./GameHooks";
import { _ } from "@/lib/translate";

interface ConditionalMoveTreeDisplayProps {
    tree: ConditionalMoveTree;
    conditional_path: string;
}

export function ConditionalMoveTreeDisplay({
    tree,
    conditional_path,
}: ConditionalMoveTreeDisplayProps) {
    const player_move: string | null = tree.move;

    const goban = useGoban();
    const opponent_color = goban.conditional_starting_color;
    const player_color = opponent_color === "black" ? "white" : "black";
    const selected_path = useCurrentConditionalPath(goban);
    const player_move_selected = player_move && conditional_path + player_move === selected_path;

    if (!conditional_path) {
        return (
            <div className="conditional-move-tree-container">
                {Object.keys(tree.children).map((opponent_move: string) => {
                    const child_tree = tree.getChild(opponent_move);
                    return (
                        <ConditionalMoveTreeDisplay
                            tree={child_tree}
                            conditional_path={opponent_move}
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
                <MoveEntry color={opponent_color} conditional_path={conditional_path} />
                {player_move && (
                    <MoveEntry
                        color={player_color}
                        conditional_path={conditional_path + player_move}
                    />
                )}
                {player_move_selected && (
                    <DeleteButton conditional_path={conditional_path + player_move} />
                )}
                {Object.keys(tree.children).map((opponent_move: string) => {
                    const child_tree = tree.getChild(opponent_move);
                    const child_conditional_path = conditional_path + player_move + opponent_move;
                    return (
                        <ConditionalMoveTreeDisplay
                            tree={child_tree}
                            conditional_path={child_conditional_path}
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
    conditional_path: string;
}

const useCurrentConditionalPath = generateGobanHook(
    (goban) => goban?.getCurrentConditionalPath(),
    ["conditional-moves.updated"],
);

function MoveEntry({ color, conditional_path }: MoveEntryProps) {
    const goban = useGoban();
    const mv = goban.engine.decodeMoves(conditional_path.slice(-2))[0];
    const selected_conditional_path = useCurrentConditionalPath(goban);
    const selected = conditional_path === selected_conditional_path;

    const cb = () => {
        goban.jumpToLastOfficialMove();
        console.log(conditional_path);
        goban.followConditionalPath(conditional_path);
        goban.redraw();
    };

    if (!mv) {
        return;
    }

    return (
        <span className={`entry ${selected ? "selected" : ""}`} onClick={cb}>
            <span className={`stone ${color}`}></span>
            <span>
                {goban.engine.prettyCoordinates(mv.x, mv.y) !== "pass"
                    ? goban.engine.prettyCoordinates(mv.x, mv.y)
                    : _("Pass")}
            </span>
        </span>
    );
}

function DeleteButton({ conditional_path }: { conditional_path: string }) {
    const goban = useGoban();
    const cb = () => {
        goban.jumpToLastOfficialMove();
        goban.deleteConditionalPath(conditional_path);
        goban.redraw();
    };
    return <i className="fa fa-times delete-move" onClick={cb} />;
}
