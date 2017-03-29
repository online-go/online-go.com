/*
 * Copyright 2012-2017 Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {GoStoneGroup} from "./GoStoneGroup";
import {GoEngine} from './GoEngine';

export interface Move {
    x: number;
    y: number;
    color?: number;
    timedelta?: number;
    edited?: boolean;
}

export class GoMath {
    private engine: GoEngine;
    public group_id_map: any;
    public groups: any;

    constructor(engine, original_board?) { /* {{{ */
        let self = this;
        let groups = [null];
        let group_id_map = [];

        this.engine = engine;
        this.group_id_map = group_id_map;
        this.groups = groups;

        //console.log("::: h5", engine.board[4][7], original_board[4][7])

        function floodFill(x, y, color, dame, id) {
            if (x >= 0 && x < self.engine.width) {
                if (y >= 0 && y < self.engine.height) {
                    if (self.engine.board[y][x] === color
                        && group_id_map[y][x] === 0
                        && (!original_board
                            || ((!dame && (original_board[y][x] !== 0 || !self.engine.removal[y][x]))
                                 || ( dame && (original_board[y][x] === 0 &&  self.engine.removal[y][x]))
                               )
                           )
                    ) {
                        group_id_map[y][x] = id;
                        floodFill(x - 1, y, color, dame, id);
                        floodFill(x + 1, y, color, dame, id);
                        floodFill(x, y - 1, color, dame, id);
                        floodFill(x, y + 1, color, dame, id);
                    }
                }
            }
        }

        /* Build groups */
        group_id_map = GoMath.makeMatrix(this.engine.width, this.engine.height);
        let groupId = 1;
        for (let y = 0; y < self.engine.height; ++y) {
            for (let x = 0; x < self.engine.width; ++x) {
                if (group_id_map[y][x] === 0) {
                    floodFill(x, y, self.engine.board[y][x], (original_board && self.engine.removal[y][x] && original_board[y][x] === 0), groupId++);
                }

                if (!(group_id_map[y][x] in groups)) {
                    groups.push(new GoStoneGroup(self.engine, group_id_map[y][x], self.engine.board[y][x], (original_board && self.engine.removal[y][x] && original_board[y][x] === 0)));
                }
                groups[group_id_map[y][x]].addStone(x, y);
            }
        }

        /* Compute group neighbors */
        this.foreachGroup((gr) => {
            gr.foreachStone((pt) => {
                let x = pt.x;
                let y = pt.y;
                if (x - 1 >= 0 && group_id_map[y][x - 1] !== gr.id) {
                    gr.addNeighborGroup(groups[group_id_map[y][x - 1]]);
                }
                if (x + 1 < self.engine.width  && group_id_map[y][x + 1] !== gr.id) {
                    gr.addNeighborGroup(groups[group_id_map[y][x + 1]]);
                }
                if (y - 1 >= 0 && group_id_map[y - 1][x] !== gr.id) {
                    gr.addNeighborGroup(groups[group_id_map[y - 1][x]]);
                }
                if (y + 1 < self.engine.height && group_id_map[y + 1][x] !== gr.id) {
                    gr.addNeighborGroup(groups[group_id_map[y + 1][x]]);
                }
                for (let Y = -1; Y <= 1; ++Y) {
                    for (let X = -1; X <= 1; ++X) {
                        if (x + X >= 0 && x + X < self.engine.width && y + Y >= 0 && y + Y < self.engine.height) {
                            gr.addCornerGroup(x + X, y + Y, groups[group_id_map[y + Y][x + X]]);
                        }
                    }
                }
            });
        });

        this.foreachGroup((gr) => { gr.computeIsTerritory(); });
        this.foreachGroup((gr) => { gr.computeIsTerritoryInSeki(); });
        this.foreachGroup((gr) => { gr.computeIsEye(); });
        this.foreachGroup((gr) => { gr.computeIsStrongEye(); });
        this.foreachGroup((gr) => { gr.computeIsStrongString(); });
    } /* }}} */
    public foreachGroup(fn) { /* {{{ */
        for (let i = 1; i < this.groups.length; ++i) {
            fn(this.groups[i]);
        }
    } /* }}} */
    //private getGroup(x, y) { /* {{{ */
    //    return this.groups[this.group_id_map[y][x]];
    //}; /* }}} */

    public static makeMatrix(width, height, initialValue?) { /* {{{ */
        if (!initialValue) {
            initialValue = 0;
        }

        let ret = [];
        for (let y = 0; y < height; ++y) {
            ret.push([]);
            for (let x = 0; x < width; ++x) {
                ret[y].push(initialValue);
            }
        }
        return ret;
    } /* }}} */
    public static makeObjectMatrix(width, height) { /* {{{ */
        let ret = new Array(height);
        for (let y = 0; y < height; ++y) {
            let row = new Array(width);
            for (let x = 0; x < width; ++x) {
                row[x] = {};
            }
            ret[y] = row;
        }
        return ret;
    } /* }}} */
    public static prettyCoords(x, y, board_height) { /* {{{ */
        if (x >= 0) {
            return ("ABCDEFGHJKLMNOPQRSTUVWXYZ"[x]) + ("" + (board_height - y));
        }
        return "";
    } /* }}} */
    private static convertMoveStringToArrayFormat(move_string, width, height) { /* {{{ */
        let moves = GoMath.decodeMoves(move_string, width, height);
        let ret = [];
        for (let i = 0; i < moves.length; ++i) {
            let mv = moves[i];
            ret.push(GoMath.encodeMoveToArray(mv));
        }
        return ret;
    } /* }}} */
    public static decodeMoves(move_obj, width?, height?): Array<Move> { /* {{{ */
        let ret: Array<Move> = [];

        function decodeSingleMoveArray(arr) {
            let obj = {
                x         : arr[0],
                y         : arr[1],
                timedelta : arr.length > 2 ? arr[2] : -1,
                color     : arr.length > 3 ? arr[3] : 0,
            };
            let extra = arr.length > 4 ? arr[4] : {};
            for (let k in extra) {
                obj[k] = extra[k];
            }
            return obj;
        }

        if (move_obj instanceof Array) {
            if (move_obj.length && typeof(move_obj[0]) === "number") {
                ret.push(decodeSingleMoveArray(move_obj));
            }
            else {
                for (let i = 0; i < move_obj.length; ++i) {
                    let mv = move_obj[i];
                    if (mv instanceof Array) {
                        ret.push(decodeSingleMoveArray(mv));
                    }
                    else {
                        console.error("mv: ", mv);
                        throw new Error(`Unrecognized move format: ${mv}`);
                    }
                }
            }
        }
        else if (typeof(move_obj) === "string") {

            if (/[a-zA-Z][0-9]/.test(move_obj)) {
                /* coordinate form, used from human input. */
                let move_string = move_obj;

                let moves = move_string.split(/([a-zA-Z][0-9]+|[.][.])/);
                for (let i = 0; i < moves.length; ++i) {
                    if (i % 2) { /* even are the 'splits', which should always be blank unless there is an error */
                        let x = GoMath.pretty_char2num(moves[i][0]);
                        let y = height - parseInt(moves[i].substring(1));
                        if ((width && x >= width) || x < 0) {
                            x = y = -1;
                        }
                        if ((height && y >= height) || y < 0) {
                            x = y = -1;
                        }
                        ret.push({"x": x, "y": y, "edited": false, "color": 0});
                    } else {
                        if (moves[i] !== "") {
                            throw "Unparsed move input: " + moves[i];
                        }
                    }
                }
            } else {
                /* Pure letter encoded form, used for all records */
                let move_string = move_obj;

                for (let i = 0; i < move_string.length - 1; i += 2) {
                    let edited = false;
                    let color = 0;
                    if (move_string[i + 0] === "!") {
                        edited = true;
                        color = parseInt(move_string[i + 1]);
                        i += 2;
                    }


                    let x = GoMath.char2num(move_string[i]);
                    let y = GoMath.char2num(move_string[i + 1]);
                    if (width && x >= width) {
                        x = y = -1;
                    }
                    if (height && y >= height) {
                        x = y = -1;
                    }
                    ret.push({"x": x, "y": y, "edited": edited, "color": color});
                }
            }
        }
        else {
            throw new Error("Invalid move format: " + move_obj);
        }

        return ret;
    }; /* }}} */
    private static char2num(ch) { /* {{{ */
        if (ch === ".") { return -1; }
        return "abcdefghijklmnopqrstuvwxyz".indexOf(ch);
    }; /* }}} */
    private static pretty_char2num(ch) { /* {{{ */
        if (ch === ".") { return -1; }
        return "abcdefghjklmnopqrstuvwxyz".indexOf(ch.toLowerCase());
    }; /* }}} */
    public static num2char(num) { /* {{{ */
        if (num === -1) { return "."; }
        return "abcdefghijklmnopqrstuvwxyz"[num];
    }; /* }}} */
    public static encodeMove(x, y?) { /* {{{ */
        if (typeof(x) === "number") {
            return GoMath.num2char(x) + GoMath.num2char(y);
        } else {
            let mv = x;

            if (!mv.edited) {
                return GoMath.num2char(mv.x) + GoMath.num2char(mv.y);
            } else {
                return "!" + mv.player + GoMath.num2char(mv.x) + GoMath.num2char(mv.y);
            }
        }
    }; /* }}} */
    public static encodeMoves(lst) { /* {{{ */
        let ret = "";
        for (let i = 0; i < lst.length; ++i) {
            ret += GoMath.encodeMove(lst[i]);
        }
        return ret;
    }; /* }}} */
    public static encodeMoveToArray(mv) { /* {{{ */
        let arr = [mv.x, mv.y];
        arr.push(mv.timedelta ? mv.timedelta : -1);
        if (mv.edited) {
            arr.push(mv.color);
        }
        return arr;
    }; /* }}} */
    public static encodeMovesToArray(moves) { /* {{{ */
        let ret = [];
        for (let i = 0; i < moves.length; ++i) {
            ret.push(GoMath.encodeMoveToArray(moves[i]));
        }
        return ret;
    }; /* }}} */

    /* Returns a sorted move string, this is used in our stone removal logic */
    public static sortMoves(move_string) { /* {{{ */
        let moves = GoMath.decodeMoves(move_string);
        moves.sort((a, b) => {
            let av = (a.edited ? 1 : 0) * 10000 + a.x + a.y * 100;
            let bv = (b.edited ? 1 : 0) * 10000 + b.x + b.y * 100;
            return av - bv;
        });
        return GoMath.encodeMoves(moves);
    }; /* }}} */
}
