/*
 * Copyright 2012-2019 Online-Go.com
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

export interface BoardState {
    width: number;
    height: number;
    board: Array<Array<number>>;
    removal: Array<Array<number>>;
}

// [x, y, time_delta, edited?]
export type MoveArray = [number, number, number, number|void];

export class GoMath {
    private state: BoardState;
    public group_id_map: Array<Array<number>>;
    public groups: Array<GoStoneGroup>;

    constructor(state:BoardState, original_board?:Array<Array<number>>) { 
        let groups:Array<GoStoneGroup> = [null];
        let group_id_map:Array<Array<number>> = null;

        this.state = state;
        this.group_id_map = group_id_map;
        this.groups = groups;

        let floodFill = (x, y, color, dame, id) => {
            if (x >= 0 && x < this.state.width) {
                if (y >= 0 && y < this.state.height) {
                    if (this.state.board[y][x] === color
                        && group_id_map[y][x] === 0
                        && (!original_board
                            || ((!dame && (original_board[y][x] !== 0 || !this.state.removal[y][x]))
                                 || ( dame && (original_board[y][x] === 0 &&  this.state.removal[y][x]))
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
        };

        /* Build groups */
        group_id_map = GoMath.makeMatrix(this.state.width, this.state.height);
        let groupId = 1;
        for (let y = 0; y < this.state.height; ++y) {
            for (let x = 0; x < this.state.width; ++x) {
                if (group_id_map[y][x] === 0) {
                    floodFill(x, y, this.state.board[y][x], (original_board && this.state.removal[y][x] && original_board[y][x] === 0), groupId++);
                }

                if (!(group_id_map[y][x] in groups)) {
                    groups.push(new GoStoneGroup(this.state, group_id_map[y][x], this.state.board[y][x], (original_board && this.state.removal[y][x] && original_board[y][x] === 0)));
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
                if (x + 1 < this.state.width  && group_id_map[y][x + 1] !== gr.id) {
                    gr.addNeighborGroup(groups[group_id_map[y][x + 1]]);
                }
                if (y - 1 >= 0 && group_id_map[y - 1][x] !== gr.id) {
                    gr.addNeighborGroup(groups[group_id_map[y - 1][x]]);
                }
                if (y + 1 < this.state.height && group_id_map[y + 1][x] !== gr.id) {
                    gr.addNeighborGroup(groups[group_id_map[y + 1][x]]);
                }
                for (let Y = -1; Y <= 1; ++Y) {
                    for (let X = -1; X <= 1; ++X) {
                        if (x + X >= 0 && x + X < this.state.width && y + Y >= 0 && y + Y < this.state.height) {
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
    } 
    public foreachGroup(fn) { 
        for (let i = 1; i < this.groups.length; ++i) {
            fn(this.groups[i]);
        }
    } 
    //private getGroup(x, y) { 
    //    return this.groups[this.group_id_map[y][x]];
    //}; 

    public static makeMatrix(width:number, height:number, initialValue:number = 0):Array<Array<number>> { 


        let ret = [];
        for (let y = 0; y < height; ++y) {
            ret.push([]);
            for (let x = 0; x < width; ++x) {
                ret[y].push(initialValue);
            }
        }
        return ret;
    } 
    public static makeObjectMatrix<T>(width:number, height:number):Array<Array<T>> { 
        let ret = new Array<Array<T>>(height);
        for (let y = 0; y < height; ++y) {
            let row = new Array<T>(width);
            for (let x = 0; x < width; ++x) {
                row[x] = {} as T;
            }
            ret[y] = row;
        }
        return ret;
    } 
    public static makeEmptyObjectMatrix<T>(width:number, height:number):Array<Array<T>> { 
        let ret = new Array<Array<T>>(height);
        for (let y = 0; y < height; ++y) {
            let row = new Array<T>(width);
            ret[y] = row;
        }
        return ret;
    } 
    public static prettyCoords(x:number, y:number, board_height:number):string { 
        if (x >= 0) {
            return ("ABCDEFGHJKLMNOPQRSTUVWXYZ"[x]) + ("" + (board_height - y));
        }
        return "";
    } 
    private static convertMoveStringToArrayFormat(move_string:string, width:number, height:number):Array<MoveArray> { 
        let moves = GoMath.decodeMoves(move_string, width, height);
        let ret = [];
        for (let i = 0; i < moves.length; ++i) {
            let mv = moves[i];
            ret.push(GoMath.encodeMoveToArray(mv));
        }
        return ret;
    } 
    public static decodeMoves(move_obj:MoveArray | string, width?:number, height?:number): Array<Move> { 
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
                    let mv:any = move_obj[i];
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
    } 
    private static char2num(ch:string):number { 
        if (ch === ".") { return -1; }
        return "abcdefghijklmnopqrstuvwxyz".indexOf(ch);
    } 
    private static pretty_char2num(ch:string):number { 
        if (ch === ".") { return -1; }
        return "abcdefghjklmnopqrstuvwxyz".indexOf(ch.toLowerCase());
    } 
    public static num2char(num:number):string { 
        if (num === -1) { return "."; }
        return "abcdefghijklmnopqrstuvwxyz"[num];
    } 
    public static encodeMove(x, y?):string { 
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
    } 
    public static encodePrettyCoord(coord: string, height: number) { // "C12" with no "I"
        const x = GoMath.num2char(GoMath.pretty_char2num(coord.charAt(0).toLowerCase()));
        const y = GoMath.num2char(height - parseInt(coord.substring(1)));
        return x + y;
    }
    public static encodeMoves(lst:Array<Move>):string { 
        let ret = "";
        for (let i = 0; i < lst.length; ++i) {
            ret += GoMath.encodeMove(lst[i]);
        }
        return ret;
    } 
    public static encodeMoveToArray(mv:Move):MoveArray { 
        let arr:MoveArray = [mv.x, mv.y, mv.timedelta ? mv.timedelta : -1, undefined];
        if (mv.edited) {
            arr[3] = mv.color;
        } else {
            arr.pop();
        }
        return arr;
    } 
    public static encodeMovesToArray(moves):Array<MoveArray> { 
        let ret:Array<MoveArray> = [];
        for (let i = 0; i < moves.length; ++i) {
            ret.push(GoMath.encodeMoveToArray(moves[i]));
        }
        return ret;
    } 

    /* Returns a sorted move string, this is used in our stone removal logic */
    public static sortMoves(move_string:string):string { 
        let moves = GoMath.decodeMoves(move_string);
        moves.sort((a, b) => {
            let av = (a.edited ? 1 : 0) * 10000 + a.x + a.y * 100;
            let bv = (b.edited ? 1 : 0) * 10000 + b.x + b.y * 100;
            return av - bv;
        });
        return GoMath.encodeMoves(moves);
    } 
}
