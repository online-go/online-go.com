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

import {GoMath} from "./GoMath";
import {GoEngine, GoEngineState} from "./GoEngine";
import {resizeDeviceScaledCanvas} from "./GoUtil";
import {encodeMove} from "./GoEngine";

export interface MarkInterface {
    triangle?         : boolean;
    square?           : boolean;
    circle?           : boolean;
    cross?            : boolean;
    letter?           : string;
    transient_letter? : string;
    score?            : string | boolean;
    chat_triangle?    : boolean;
    sub_triangle?     : boolean;
    remove?           : boolean;
    stone_removed?    : boolean;
    mark_x?           : boolean;
    hint?             : boolean;
    black?            : boolean;
    white?            : boolean;
    color?            : string;
}

export interface MoveTreeJson {
    x               : number;
    y               : number;
    pen_marks?      : Array<number>;
    marks?          : Array<{x: number, y: number, marks: MarkInterface}>;
    text?           : string;
    trunk_next?     : MoveTreeJson;
    branches?       : Array<MoveTreeJson>;
    correct_answer? : boolean;
    wrong_answer?   : boolean;
}

interface ViewPortInterface {
    minx: number;
    miny: number;
    maxx: number;
    maxy: number;
}

interface BoardInterface {
    theme_board: any;
    theme_black: any;
    theme_white: any;
    theme_black_text_color: string;
    theme_white_text_color: string;
    themes: {
        black: string;
        white: string;
        board: string;
    };
}

let __move_tree_id = 0;
let __isobranches_state_hash = {}; /* used while finding isobranches */

/* TODO: If we're on the server side, we shouldn't be doing anything with marks */
export class MoveTree {
    private static theme_cache = {"black": {}, "white": {}};
    private static layout_vector = [];
    private static stone_radius = 11;
    private static stone_padding = 3;
    private static stone_square_size = (MoveTree.stone_radius + MoveTree.stone_padding) * 2;

    private static layout_hash: {[coords:string]:MoveTree} = {};
    private static theme_black_stones: any;
    private static theme_white_stones: any;
    private static theme_line_color: any;
    public static layout_dirty: boolean;
    private static labeling: "move-coordinates" | "none" | "move-number";
    private static last_cur_move: any;
    private static last_review_move: any;

    private layout_cx: number;
    private layout_cy: number;
    private layout_x: number;
    private layout_y: number;
    private label_metrics: TextMetrics;
    private label: string;
    public move_number: number;
    private pretty_coordinates: string;
    public parent: MoveTree;
    public readonly id: number;
    public trunk_next: MoveTree;
    public branches: Array<MoveTree>;
    public correct_answer: boolean;
    public wrong_answer: boolean;
    private hint_next: MoveTree;
    public player: number;
    private line_color: any;
    public trunk: boolean;
    public text: string;
    private active_path_number: number;
    private engine: GoEngine;
    public x: number;
    public y: number;
    public edited: boolean;
    private active_node_number: number;
    public state: GoEngineState;
    private redraw_on_scroll: any;
    public pen_marks: Array<any> = [];

    /* These need to be protected by accessor methods now that we're not
     * initializing them on construction */
    private chatlog: Array<any>;
    private marks: Array<Array<MarkInterface>>;
    private isobranches: any;
    private isobranch_hash : string;

    constructor(engine:GoEngine, trunk:boolean, x:number, y:number, edited:boolean, player:number, move_number:number, parent:MoveTree, state:GoEngineState) {
        this.id = ++__move_tree_id;
        this.x = x;
        this.y = y;
        this.pretty_coordinates = engine.prettyCoords(x, y);
        this.label = null;
        this.label_metrics = null;
        this.layout_x = 0;
        this.layout_y = 0;
        this.engine = engine;
        this.trunk = trunk;
        this.edited = edited;
        this.player = player;
        this.parent = parent;
        this.move_number = move_number;
        this.state = state;
        this.trunk_next = null;
        this.branches = [];
        this.active_path_number = 0;
        this.active_node_number = 0;
        //this.clearMarks();
        this.line_color = -1;

        this.text = "";

        this.correct_answer = null;
        this.wrong_answer = null;
    }


    toJson():MoveTreeJson { /* {{{ */
        let ret: MoveTreeJson = {
            x: this.x,
            y: this.y,
        };

        if (this.pen_marks && this.pen_marks.length) {
            ret.pen_marks = this.pen_marks;
        }
        if (this.hasMarks()) {
            ret.marks = [];
            this.foreachMarkedPosition((x, y) => {
                ret.marks.push({"x": x, "y": y, "marks": this.getMarks(x, y)});
            });
        }
        if (this.text) {
            ret.text = this.text;
        }

        if (this.trunk_next) {
            ret.trunk_next = this.trunk_next.toJson();
        }
        if (this.branches.length) {
            ret.branches = [];
            for (let i = 0; i < this.branches.length; ++i) {
                ret.branches.push(this.branches[i].toJson());
            }
        }
        if (this.correct_answer) {
            ret.correct_answer = this.correct_answer;
        }
        if (this.wrong_answer) {
            ret.wrong_answer = this.wrong_answer;
        }

        return ret;
    } /* }}} */
    loadJsonForThisNode(json:MoveTreeJson):void { /* {{{ */
        /* Unlike toJson, restoring from the json blob is a collaborative effort between
         * MoveTree and the GoEngine because of all the state we capture along the way..
         * so during restoration GoEngine will form the tree, and for each node call this
         * method with the json that was captured with toJson for this node */

        if (json.x !== this.x || json.y !== this.y) {
            throw new Error("Node mismatch when unpacking json object in MoveTree.fromJson");
        }

        this.correct_answer = json.correct_answer;
        this.wrong_answer = json.wrong_answer;
        this.text = json.text ? json.text : "";

        if (json.marks) {
            for (let i = 0; i < json.marks.length; ++i) {
                let m = json.marks[i];
                for (let k in m.marks) {
                    this.getMarks(m.x, m.y)[k] = m.marks[k];
                }
            }
        }
        if (json.pen_marks) {
            this.pen_marks = json.pen_marks;
        }
    } /* }}} */

    recomputeIsobranches():void { /* {{{ */
        if (this.parent) {
            throw new Error("MoveTree.recomputeIsobranches needs to be called from the root node");
        }

        __isobranches_state_hash = {};

        let buildHashes = (node:MoveTree):void => {
            let hash = JSON.stringify(node.state.board) + node.player;
            node.isobranch_hash = hash;

            if (!(hash in __isobranches_state_hash)) {
                __isobranches_state_hash[hash] = [];
            }

            __isobranches_state_hash[hash].push(node);

            if (node.trunk_next) {
                buildHashes(node.trunk_next);
            }

            for (let i = 0; i < node.branches.length; ++i) {
                buildHashes(node.branches[i]);
            }
        };

        let recompute = (node:MoveTree):void => {
            node.isobranches = [];

            for (let i = 0; i < __isobranches_state_hash[node.isobranch_hash].length; ++i) {
                let n = __isobranches_state_hash[node.isobranch_hash][i];

                if (node.id !== n.id) {
                    if (node.isAncestorOf(n) || n.isAncestorOf(node)) {
                        continue;
                    }
                    node.isobranches.push(n);
                }
            }

            if (node.trunk_next) {
                recompute(node.trunk_next);
            }

            for (let i = 0; i < node.branches.length; ++i) {
                recompute(node.branches[i]);
            }
        };

        buildHashes(this);
        recompute(this);
    } /* }}} */

    lookupMove(x:number, y:number, player:number, edited:boolean):MoveTree { /* {{{ */
        if (this.trunk_next &&
            this.trunk_next.x === x &&
                this.trunk_next.y === y &&
                    this.trunk_next.edited === edited &&
                        (!edited || this.trunk_next.player)
            ) {
                return this.trunk_next;
            }

            for (let i = 0; i < this.branches.length; ++i) {
                if (this.branches[i].x === x && this.branches[i].y === y && (!edited || this.branches[i].player === player) && this.branches[i].edited === edited) {
                    return this.branches[i];
                }
            }

            return null;
    } /* }}} */
    move(x:number, y:number, trunk:boolean, edited:boolean, player:number, move_number:number, state:any):MoveTree { /* {{{ */
        if (typeof(player) === "undefined") {
            throw new Error("Invalid player");
        }

        let m = this.lookupMove(x, y, player, edited);
        //if (!m || m.trunk !== trunk) {
        if (!m || (!m.trunk && trunk)) {
            //if (!m) {
            m = new MoveTree(this.engine, trunk, x, y, edited, player, move_number, this, state);
        } else {
            m.state = state;
            m.move_number = move_number;
            return m;
        }

        MoveTree.layout_dirty = true;

        if (trunk) {
            if (!this.trunk) {
                console.log("Attempted trunk move made on ", this);
                throw new Error("Attempted trunk move made on non-trunk");
            }


            if (this.trunk_next) {
                m = this.trunk_next;
                m.edited = edited;
                m.move_number = move_number;
                m.state = state;
                m.x = x;
                m.y = y;
                m.player = player;
            } else {
                this.trunk_next = m;
            }


            /* Join any branches that may have already been describing this move */
            for (let i = 0; i < this.branches.length; ++i) {
                if (this.branches[i].x === x &&
                    this.branches[i].y === y &&
                    this.branches[i].player === player
                ) {
                    let brs = this.branches[i].branches;
                    for (let j = 0; j < brs.length; ++j) {
                        brs[j].parent = this.trunk_next;
                        this.trunk_next.branches.push(brs[j]);
                    }
                    this.branches.splice(i, 1);
                    break;
                }
            }
        } else {
            let found = false;

            /* TODO: I think we can remove this, we have the lookupMove up above now */
            for (let i = 0; i < this.branches.length; ++i) {
                if (this.branches[i].x === x && this.branches[i].y === y && this.branches[i].player === player) {
                    found = true;
                    m = this.branches[i];
                    m.edited = edited;
                    m.move_number = move_number;
                    m.state = state;
                }
            }
            if (!found) {
                this.branches.push(m);
            }
        }

        return m;
    } /* }}} */
    next(dont_follow_hints?:boolean):MoveTree { /* {{{ */
        if (this.trunk_next) {
            /* always follow a trunk first if it's available */
            return this.trunk_next;
        }

        /* Remember what branch we were on and follow that by default.. but
         * because we sometimes delete things, we're gonna check to make sure it's
         * still in our list of branches before blindly following it */
        if (this.hint_next && !dont_follow_hints) {
            if (this.trunk_next && this.hint_next.id === this.trunk_next.id) {
                return this.hint_next;
            }
            for (let i = 0; i < this.branches.length; ++i) {
                if (this.branches[i].id === this.hint_next.id) {
                    return this.hint_next;
                }
            }
        }

        /* If nothing else, follow the first branch we find */
        if (this.branches.length) {
            return this.branches[0];
        }
        return null;
    } /* }}} */
    prev():MoveTree { /* {{{ */
        if (this.parent) {
            this.parent.hint_next = this;
        }
        return this.parent;
    } /* }}} */
    index(idx):MoveTree { /* {{{ */
        let cur:MoveTree = this;
        while (cur.prev() && idx < 0) { cur = cur.prev(); ++idx; }
        while (cur.next(true) && idx > 0) { cur = cur.next(true); --idx; }
        return cur;
    } /* }}} */
    is(other:MoveTree):boolean { /* {{{ */
        return other && this.id === other.id;
    } /* }}} */
    remove():MoveTree { /* {{{ */
        if (this.is(this.parent.trunk_next)) {
            this.parent.trunk_next = null;
        } else {
            for (let i = 0; i < this.parent.branches.length; ++i) {
                if (this.parent.branches[i].is(this)) {
                    this.parent.branches.splice(i, 1);
                    return this.parent;
                }
            }
        }
        return this.parent;
    } /* }}} */
    getRoot():MoveTree { /* {{{ */
        let ret:MoveTree = this;
        while (ret.parent) {
            ret = ret.parent;
        }
        return ret;
    } /* }}} */
    removeIfNoChildren():void { /* {{{ */
        if (this.trunk_next == null && this.branches.length === 0) {
            this.remove();
        }
    } /* }}} */
    getChatLog():Array<any> {
        if (!this.chatlog) {
            this.chatlog = [];
        }
        return this.chatlog;
    }
    getAllMarks():Array<Array<MarkInterface>> {
        if (!this.marks) {
            this.clearMarks();
        }
        return this.marks;
    }
    setAllMarks(marks:Array<Array<MarkInterface>>):void {
        this.marks = marks;
    }
    clearMarks():void { /* {{{ */
        this.marks = GoMath.makeObjectMatrix<MarkInterface>(this.engine.width, this.engine.height);
    } /* }}} */
    hasMarks():boolean { /* {{{ */
        if (!this.marks) {
            return false;
        }
        for (let j = 0; j < this.marks.length; ++j) {
            for (let i = 0; i < this.marks[j].length; ++i) {
                for (let k in this.marks[j][i]) {
                    return true;
                }
            }
        }
        return false;
    } /* }}} */
    foreachMarkedPosition(fn:(i:number, j:number) => void):boolean { /* {{{ */
        if (!this.marks) {
            return;
        }

        for (let j = 0; j < this.marks.length; ++j) {
            for (let i = 0; i < this.marks[j].length; ++i) {
                for (let k in this.marks[j][i]) {
                    fn(i, j);
                    break;
                }
            }
        }
    } /* }}} */
    isAncestorOf(other:MoveTree):boolean { /* {{{ */
        do {
            if (other.id === this.id) { return true; }
            other = other.parent;
        } while (other);
        return false;
    } /* }}} */
    passed():boolean { /* {{{ */
        return this.x === -1;
    } /* }}} */
    debug(depth:number):string { /* {{{ */
        let str = "";
        for (let i = 0; i < depth; ++i) {
            str += " ";
        }
        str += "+ " + this.id;
        console.log(str);
        if (this.trunk_next) {
            this.trunk_next.debug(depth);
        }
        for (let i = 0; i < this.branches.length; ++i) {
            this.branches[i].debug(depth + 2);
        }
        return str;
    } /* }}} */
    toSGF():string { /* {{{ */
        let ret = "";

        try {
            let txt = "";
            if (this.parent != null) {
                ret += ";";
                if (this.edited) {
                    ret += "A";
                }
                ret += this.player === 1 ? "B" : (this.player === 2 ? "W" : "E");

                ret += "[";
                if (this.x === -1) {
                    ret += "";
                } else {
                    ret += "abcdefghijklmnopqrstuvwxyz"[this.x];
                    ret += "abcdefghijklmnopqrstuvwxyz"[this.y];
                }
                ret += "]";
                txt = this.text;
            }

            if (this.chatlog && this.chatlog.length) {
                txt += "\n\n-- chat --\n";
                for (let i = 0; i < this.chatlog.length; ++i) {
                    txt += this.chatlog[i].username + ": " + MoveTree.markupSGFChatMessage(this.chatlog[i].body, this.engine.width, this.engine.height) + "\n";
                }
            }

            if (this.marks) {
                for (let y = 0; y < this.marks.length; ++y) {
                    for (let x = 0; x < this.marks[0].length; ++x) {
                        let m = this.marks[y][x];
                        let pos = "abcdefghijklmnopqrstuvwxyz"[x] + "abcdefghijklmnopqrstuvwxyz"[y];
                        if (m.triangle) { ret += "TR[" + pos + "]"; }
                        if (m.square) { ret += "SQ[" + pos + "]"; }
                        if (m.cross) { ret += "XX[" + pos + "]"; }
                        if (m.circle) { ret += "CR[" + pos + "]"; }
                        if (m.letter) { ret += "LB[" + pos + ":" + (m.letter).replace(/[\\]/, "\\\\").replace(/\]/g, "\\]").replace(/[[]/g, "\\[") + "]"; }
                    }
                }
            }

            if (txt !== "") {
                ret += "C[" + (txt).replace(/[\\]/, "\\\\").replace(/\]/g, "\\]").replace(/[[]/g, "\\[") + "\n]\n";
            }
            ret += "\n";

            let brct = (this.trunk_next != null ? 1 : 0) + this.branches.length;
            let A = brct > 1 ? "(" : "";
            let B = brct > 1 ? ")" : "";

            if (this.trunk_next) {
                ret += A + this.trunk_next.toSGF() + B;
            }
            for (let i = 0; i < this.branches.length; ++i) {
                ret += A + this.branches[i].toSGF() + B;
            }
        } catch (e) {
            console.log(e);
            throw e;
        }

        return ret;
    } /* }}} */

    /* Returns the node in the main trunk which is our ancestor. May be this node. */
    getBranchPoint():MoveTree { /* {{{ */
        let cur:MoveTree = this;
        while (!cur.trunk && cur.parent) {
            cur = cur.parent;
        }
        return cur;
    } /* }}} */

    /* Returns the index of the node from root. This is only really meaningful as
     * an index on trunk nodes, but will give the distance of the node from the
     * root for any node. */
    getMoveIndex():number { /* {{{ */
        let ct = 0;
        let cur:MoveTree = this;
        while (cur.parent) {
            ++ct;
            cur = cur.parent;
        }
        return ct;
    } /* }}} */

    /* Returns the distance to the given node, or -1 if the node is not a descendent */
    getDistance(node:MoveTree):number { /* {{{ */
        let ct = 0;
        let cur:MoveTree = this;
        while (cur.parent && cur.id !== node.id) {
            ++ct;
            cur = cur.parent;
        }
        return ct;
    } /* }}} */

    /* Returns the difference between this move_number and the move number at our branch point */
    getMoveNumberDifferenceFromTrunk():number { /* {{{ */
        return this.move_number - this.getBranchPoint().move_number;
    } /* }}} */

    getMarks(x:number, y:number):MarkInterface { /* {{{ */
        if (!this.marks) {
            this.clearMarks();
        }

        if (y < this.marks.length && x < this.marks[y].length) {
            return this.marks[y][x];
        } else {
            console.warn('getMarks called with invalid x,y = ', x, y, ' engine width/height = ', this.engine.width, this.engine.height);
            return {};
        }
    } /* }}} */
    setActivePath(path_number:number):void { /* {{{ */
        this.active_path_number = path_number;
        let parent = this.parent;
        while (parent) {
            parent.active_path_number = path_number;
            parent = parent.parent;
        }
        let next = this.next();
        while (next) {
            next.active_path_number = path_number;
            next = next.next();
        }
    } /* }}} */
    getMoveStringToThisPoint():string { /* {{{ */
        let move_stack = [];
        let cur:MoveTree = this;
        let ret = "";
        while (cur) {
            move_stack.push(cur);
            cur = cur.parent;
        }
        move_stack = move_stack.reverse();
        for (let i = 1; i < move_stack.length; ++i) {
            ret += encodeMove(move_stack[i]);
        }
        return ret;
    } /* }}} */



    /**** Layout & Rendering ****/
    static active_path_number:number = 0;
    static current_line_color:number = 0;

    static line_colors:Array<string> = [
        "#ff0000",
        "#00ff00",
        "#0000ff",
        "#00ffff",
        "#ffff00",
        "#FF9A00",
        "#9200FF"
        //"#ff00ff"
    ];

    static isobranch_colors = {
        "strong": "#C100FF",
        "weak": "#A582A3",
        //"strong": "#ff0000",
        //"weak": "#0000ff",
    };


    layout(x:number, min_y:number, layout_hash:{[coords:string]:MoveTree}, line_color:number):number { /* {{{ */
        if (!MoveTree.layout_vector[x]) {
            MoveTree.layout_vector[x] = 0;
        }

        if (x === 0 && min_y === 0) {
            MoveTree.current_line_color = 0;
        }

        min_y = Math.max(MoveTree.layout_vector[x] + 1, min_y);

        if (this.trunk_next) {
            this.trunk_next.layout(x + 1, 0, layout_hash, (this.move_number + 1) % MoveTree.line_colors.length);
        }

        if (this.line_color === -1) {
            this.line_color = line_color;
        }

        let next_line_color = this.line_color + this.move_number;
        for (let i = 0; i < this.branches.length; ++i) {
            next_line_color %= MoveTree.line_colors.length;
            if (i && next_line_color === this.line_color) {
                next_line_color += 2; /* prevents neighboring line colors from being the same */
                next_line_color %= MoveTree.line_colors.length;
            }

            let by = this.branches[i].layout(x + 1, min_y, layout_hash, i === 0 ? this.line_color : next_line_color++);
            if (i === 0) {
                min_y = Math.max(min_y, by - 1);
            }

            next_line_color++;
        }

        if (this.trunk) {
            min_y = 0;
        }

        this.layout_x = x;
        this.layout_y = min_y;
        layout_hash[x + "," + min_y] = this;

        this.layout_cx = Math.floor((this.layout_x + 0.5) * MoveTree.stone_square_size) + 0.5;
        this.layout_cy = Math.floor((this.layout_y + 0.5) * MoveTree.stone_square_size) + 0.5;

        MoveTree.layout_vector[x] = Math.max(min_y, MoveTree.layout_vector[x]);
        if (x) { /* allocate space for our branch lines */
            MoveTree.layout_vector[x - 1] = Math.max(min_y - 1, MoveTree.layout_vector[x - 1]);
        }

        return min_y;
    } /* }}} */
    getNodeAtLayoutPosition(layout_x:number, layout_y:number):MoveTree { /* {{{ */
        let key = layout_x  + "," + layout_y;
        if (key in MoveTree.layout_hash) {
            return MoveTree.layout_hash[key];
        }
        return null;
    } /* }}} */
    _drawPath(ctx:CanvasRenderingContext2D):void { /* {{{ */
        if (this.parent) {
            ctx.beginPath();
            ctx.strokeStyle = this.trunk ? "#000000" : MoveTree.line_colors[this.line_color];
            ctx.moveTo(this.parent.layout_cx, this.parent.layout_cy);
            ctx.quadraticCurveTo(
                this.layout_cx - MoveTree.stone_square_size * 0.5, this.layout_cy,
                this.layout_cx, this.layout_cy
            );
            ctx.stroke();
        }
    } /* }}} */
    drawIsoBranchTo(ctx:CanvasRenderingContext2D, node:MoveTree):void { /* {{{ */
        let A:MoveTree = this;
        let B:MoveTree = node;

        let isStrong = (a, b):boolean => {
            return a.trunk_next == null && a.branches.length === 0 && (b.trunk_next != null || b.branches.length !== 0);
        };

        if (isStrong(B, A)) {
            let t = A;
            A = B;
            B = t;
        }

        let strong = isStrong(A, B);

        ctx.beginPath();
        ctx.strokeStyle = MoveTree.isobranch_colors[strong ? "strong" : "weak"];
        let cur_line_width = ctx.lineWidth;
        ctx.lineWidth = 2;
        ctx.moveTo(B.layout_cx, B.layout_cy);
        let my = strong ? B.layout_cy : (A.layout_cy + B.layout_cy) / 2;
        let mx = (A.layout_cx + B.layout_cx) / 2 + MoveTree.stone_square_size * 0.5;
        ctx.quadraticCurveTo(
            mx, my,
            A.layout_cx, A.layout_cy
        );
        ctx.stroke();
        ctx.lineWidth = cur_line_width;
    } /* }}} */
    recursiveDrawPath(ctx:CanvasRenderingContext2D, viewport:ViewPortInterface):void { /* {{{ */
        if (this.trunk_next) {
            this.trunk_next.recursiveDrawPath(ctx, viewport);
        }
        for (let i = 0; i < this.branches.length; ++i) {
            this.branches[i].recursiveDrawPath(ctx, viewport);
        }

        if (this.isobranches) {
            for (let i = 0; i < this.isobranches.length; ++i) {
                this.drawIsoBranchTo(ctx, this.isobranches[i]);
            }
        }

        /* only consider x, since lines can extend awhile on the y */
        if (viewport == null || (this.layout_cx >= viewport.minx && this.layout_cx <= viewport.maxx)) {
            this._drawPath(ctx);
        }
    } /* }}} */
    findStrongIsobranches():Array<MoveTree> { /* {{{ */
        let c:MoveTree = this;
        while (c.parent) {
            c = c.parent;
        }

        c.recomputeIsobranches();

        let ret:Array<MoveTree> = [];
        if (this.isobranches) {
            for (let i = 0; i < this.isobranches.length; ++i) {
                if (this.isobranches[i].trunk_next || this.isobranches[i].branches.length) {
                    ret.push(this.isobranches[i]);
                }
            }
        }

        return ret;
    } /* }}} */
    /* draws path from children to node, and from node to parent */
    drawPath(ctx:CanvasRenderingContext2D):void { /* {{{ */
        if (this.trunk_next) {
            this.trunk_next._drawPath(ctx);
        }
        for (let i = 0; i < this.branches.length; ++i) {
            this.branches[i]._drawPath(ctx);
        }

        this._drawPath(ctx);
    } /* }}} */
    reverseDrawPath(ctx:CanvasRenderingContext2D):void { /* {{{ */
        this._drawPath(ctx);
        if (this.parent) {
            this.parent.reverseDrawPath(ctx);
        }
    } /* }}} */
    drawStone(ctx:CanvasRenderingContext2D, board:BoardInterface, active_path_number:number):void { /* {{{ */
        let stone_idx = this.move_number * 31;
        let cx = this.layout_cx;
        let cy = this.layout_cy;
        let color = this.player;
        let on_path = this.active_path_number === active_path_number;

        if (!on_path) {
            ctx.save();
            ctx.globalAlpha = 0.4;
        }

        if (color === 1) {
            let stone = MoveTree.theme_black_stones[stone_idx % MoveTree.theme_black_stones.length];
            board.theme_black.placeBlackStone(ctx, null, stone, cx, cy, MoveTree.stone_radius);
        } else if (color === 2) {
            let stone = MoveTree.theme_white_stones[stone_idx % MoveTree.theme_white_stones.length];
            board.theme_white.placeWhiteStone(ctx, null, stone, cx, cy, MoveTree.stone_radius);
        } else {
            return;
        }

        let text_color = color === 1 ? board.theme_black_text_color : board.theme_white_text_color;
        //var text_outline_color = color === 2 ? board.theme_black_text_color : board.theme_white_text_color;


        let label = "";
        switch (MoveTree.labeling) {
            case "move-coordinates": label = this.pretty_coordinates; break;
            case "none": label = ""; break;
            case "move-number": label = String(this.move_number); break;
            default: label = String(this.move_number); break;
        }

        if (this.label !== label) {
            this.label = label;
            this.label_metrics = null;
        }


        ctx.fillStyle = text_color;
        //ctx.strokeStyle=text_outline_color;
        if (this.label_metrics == null) {
            this.label_metrics = ctx.measureText(this.label);
        }
        let metrics = this.label_metrics;
        let xx = cx - metrics.width / 2;
        let yy = cy + (/WebKit|Trident/.test(navigator.userAgent) ? MoveTree.stone_radius * -0.01 : 1); /* middle centering is different on firefox */
        //ctx.strokeText(this.label, xx, yy);
        ctx.fillText(this.label, xx, yy);

        if (!on_path) {
            ctx.restore();
        }

        let ring_color = null;

        if (this.text) {
            ring_color = "#3333ff";
        }
        if (this.correct_answer) {
            ring_color = "#33ff33";
        }
        if (this.wrong_answer) {
            ring_color = "#ff3333";
        }
        if (ring_color) {
            ctx.beginPath();
            ctx.strokeStyle = ring_color;
            ctx.lineWidth = 2.0;
            ctx.arc(cx, cy, MoveTree.stone_radius, 0, 2 * Math.PI, true);
            ctx.stroke();
        }
    } /* }}} */
    recursiveDrawStones(ctx:CanvasRenderingContext2D, board:BoardInterface, active_path_number:number, viewport:ViewPortInterface):void { /* {{{ */
        if (this.trunk_next) {
            this.trunk_next.recursiveDrawStones(ctx, board, active_path_number, viewport);
        }
        for (let i = 0; i < this.branches.length; ++i) {
            this.branches[i].recursiveDrawStones(ctx, board, active_path_number, viewport);
        }

        if (viewport == null || (this.layout_cx >= viewport.minx && this.layout_cx <= viewport.maxx && this.layout_cy >= viewport.miny && this.layout_cy <= viewport.maxy)) {
            this.drawStone(ctx, board, active_path_number);
        }
    } /* }}} */
    highlight(ctx:CanvasRenderingContext2D, color:string):void { /* {{{ */
        ctx.beginPath();
        let sx = Math.round(this.layout_cx - MoveTree.stone_square_size * 0.5);
        let sy = Math.round(this.layout_cy - MoveTree.stone_square_size * 0.5);
        ctx.rect(sx, sy, MoveTree.stone_square_size, MoveTree.stone_square_size);
        ctx.fillStyle = color;
        ctx.fill();
    } /* }}} */
    updateDrawing(config:any):void { /* {{{ */
        this.redraw(config);
    } /* }}} */

    static redraw_root = null;
    static redraw_config = null;
    redraw(config:any, no_warp?:boolean):void { /* {{{ */
        this.recomputeIsobranches();

        MoveTree.redraw_root = this;
        MoveTree.redraw_config = config;

        MoveTree.layout_dirty = false;
        this.updateTheme(config.board);
        MoveTree.labeling = 'move-number';

        config.active_path_end.setActivePath(++MoveTree.active_path_number);

        if (!config.div.data("move-tree-redraw-on-scroll")) {
            let debounce = false;
            this.redraw_on_scroll = () => {
                //if (!debounce) {
                //    debounce = true;
                //    setTimeout(function() { MoveTree.redraw_root.redraw(config, true); debounce = false; }, 1);
                //}
                MoveTree.redraw_root.redraw(MoveTree.redraw_config, true);
            };
            config.div.data("move-tree-redraw-on-scroll", this.redraw_on_scroll);
            config.div.scroll(this.redraw_on_scroll);
        }

        let board = config.board;
        let canvas = config.canvas;
        let engine = board.engine;
        let stone_radius = MoveTree.stone_radius;
        this.addBindings(canvas);

        let dimensions = {"x": 1, "y": 1};
        MoveTree.layout_vector = [];
        let layout_hash = {};
        this.layout(0, 0, layout_hash, 0);
        MoveTree.layout_hash = layout_hash;
        let max_height = 0;
        for (let i = 0; i < MoveTree.layout_vector.length; ++i) {
            max_height = Math.max(MoveTree.layout_vector[i] + 1, max_height);
        }
        //canvas.data("movetree-layout", layout_hash);
        canvas.data("movetree-goengine", engine);
        canvas.data("movetree-goban", board);

        let div_width = config.div.width();
        let div_height = config.div.height();
        let width = Math.max(div_width - 15, MoveTree.layout_vector.length * MoveTree.stone_square_size);
        let height = Math.max(div_height - 15, max_height * MoveTree.stone_square_size);
        //canvas.attr("width", width).attr("height", height);
        resizeDeviceScaledCanvas(canvas, width, height);
        //canvas.attr("width", width).attr("height", height);

        let div_scroll_left = config.div.scrollLeft();
        let div_scroll_top = config.div.scrollTop();
        if (!no_warp) {
            /* make sure our active stone is visible, but don't scroll around unnecessarily */
            if (div_scroll_left > config.active_path_end.layout_cx || div_scroll_left + div_width - 20 < config.active_path_end.layout_cx
                || div_scroll_top > config.active_path_end.layout_cy || div_scroll_top + div_height - 20 < config.active_path_end.layout_cy
            ) {
                config.div.scrollLeft(config.active_path_end.layout_cx - div_width / 2);
                config.div.scrollTop(config.active_path_end.layout_cy - div_height / 2);
            }
        }


        let viewport = {"minx": div_scroll_left - MoveTree.stone_square_size, "miny": div_scroll_top - MoveTree.stone_square_size,
            "maxx": div_scroll_left + div_width + MoveTree.stone_square_size, "maxy": div_scroll_top + div_height + MoveTree.stone_square_size};

        let ctx = canvas[0].getContext("2d");
        ctx.clearRect(div_scroll_left, div_scroll_top, div_width, div_height);

        config.active_path_end.highlight(ctx, "#6BAADA");
        MoveTree.last_cur_move = config.active_path_end;

        if (engine.cur_review_move && engine.cur_review_move.id !== config.active_path_end.id) {
            engine.cur_review_move.highlight(ctx, "#6BDA6B");
            MoveTree.last_review_move = config.cur_review_move;
        }


        ctx.save();
        //ctx.beginPath();
        ctx.lineWidth = 1.0;
        //ctx.globalAlpha = 0.8;
        ctx.strokeStyle = MoveTree.theme_line_color;
        this.recursiveDrawPath(ctx, viewport);
        //ctx.stroke();
        ctx.restore();

        /*
           ctx.save();
           ctx.beginPath();
           ctx.lineWidth=2.0;
           ctx.globalAlpha = 1.0;
           ctx.strokeStyle=MoveTree.theme_line_color;
           config.active_path_end.reverseDrawPath(ctx);
           ctx.stroke();
           ctx.restore();
         */

        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        let text_size = 10;
        ctx.font = `bold ${text_size}px Verdana,Arial,sans-serif`;
        ctx.textBaseline = "middle";
        this.recursiveDrawStones(ctx, board, MoveTree.active_path_number, viewport);
        ctx.restore();
    } /* }}} */
    updateTheme(board:BoardInterface):void { /* {{{ */
        let white_theme = board.themes.white;
        let black_theme = board.themes.black;
        let radius = MoveTree.stone_radius;

        if (!(white_theme in MoveTree.theme_cache.white)) { MoveTree.theme_cache.white[white_theme] = {}; }
        if (!(black_theme in MoveTree.theme_cache.black)) { MoveTree.theme_cache.black[black_theme] = {}; }
        if (!(radius in MoveTree.theme_cache.white[white_theme])) {
            MoveTree.theme_cache.white[white_theme][radius] = board.theme_white.preRenderWhite(radius, 23434);
        }
        if (!(radius in MoveTree.theme_cache.black[black_theme])) {
            MoveTree.theme_cache.black[black_theme][radius] = board.theme_black.preRenderBlack(radius, 2081);
        }

        MoveTree.theme_line_color = board.theme_board.getLineColor();
        MoveTree.theme_white_stones = MoveTree.theme_cache.white[white_theme][radius];
        MoveTree.theme_black_stones = MoveTree.theme_cache.black[black_theme][radius];
    } /* }}} */
    addBindings(canvas):void { /* {{{ */
        let mt = canvas.data("movetree-bindings");
        if (!mt) {
            canvas.bind("touchstart mousedown", (event) => {
                //var layout = canvas.data("movetree-layout");
                let offs = canvas.offset();
                let x = Math.round((event.touches ? event.touches[0].pageX : event.pageX) - offs.left);
                let y = Math.round((event.touches ? event.touches[0].pageY : event.pageY) - offs.top);
                let i = Math.floor(x / MoveTree.stone_square_size);
                let j = Math.floor(y / MoveTree.stone_square_size);
                let node = this.getNodeAtLayoutPosition(i, j);
                if (node) {
                    let board = canvas.data("movetree-goban");
                    if (board.engine.cur_move.id !== node.id) {
                        board.engine.jumpTo(node);
                        board.setLabelCharacterFromMarks();
                        board.updateTitleAndStonePlacement();
                        board.emit("update");
                        board.syncReviewMove();
                        board.redraw();
                    }
                }
                /*
                   var key = i + "," + j;
                   if (key in layout) {
                   var board = canvas.data("movetree-goban");
                   if (board.engine.cur_move.id !== layout[key].id) {
                   board.engine.jumpTo(layout[key]);
                   board.setLabelCharacterFromMarks();
                   board.updateTitleAndStonePlacement();
                   board.onUpdate();
                   board.redraw();
                   }
                   }
                 */
            });

            canvas.data("movetree-bindings", true);
        }
    } /* }}} */

    nextSibling():MoveTree { /* {{{ */
        let ret = null;
        for (let i = 1; i < 30 && ret == null; ++i) {
            ret = this.getNodeAtLayoutPosition(this.layout_x, this.layout_y + i);
        }
        return  ret;
    } /* }}} */
    prevSibling():MoveTree { /* {{{ */
        let ret = null;
        for (let i = 1; i < 30 && ret == null; ++i) {
            ret = this.getNodeAtLayoutPosition(this.layout_x, this.layout_y - i);
        }
        return  ret;
        //return  this.getNodeAtLayoutPosition(this.layout_x, this.layout_y-1);
    } /* }}} */

    getPositionInParent():number { /* {{{ */
        if (this.parent == null) {
            return -5;
        }

        if (this.parent.trunk_next && this.id === this.parent.trunk_next.id) {
            return -1;
        }

        for (let i = 0; i < this.parent.branches.length; ++i) {
            if (this.id === this.parent.branches[i].id) {
                return i;
            }
        }

        return -5;
    } /* }}} */

    private isBranchWithCorrectAnswer(branch: MoveTree): boolean {
        if (branch.correct_answer) {
            return true;
        }
        if (!branch.branches || branch.branches.length === 0) {
            return false;
        }

        return branch.branches.some( item => this.isBranchWithCorrectAnswer(item));
    }

    public hoistFirstBranchToTrunk():void {
        if (this.trunk_next) {
            this.trunk_next.hoistFirstBranchToTrunk();
            return;
        }

        this.trunk = true;
        if (this.branches.length > 0) {
            this.trunk_next = this.branches.shift();
            this.trunk_next.hoistFirstBranchToTrunk();
        }
    }

    /**
     * Find branches containing node with correct_answer === true
     */
    findBranchesWithCorrectAnswer(): Array<MoveTree> {
        return this.branches.filter( branch => this.isBranchWithCorrectAnswer(branch));
    }

    static markupSGFChatMessage(message, width, height) { /* {{{ */
        try {
            if (typeof(message) === "object") {
                if (message.type === "analysis") {
                    let moves = GoMath.decodeMoves(message.moves, width, height);
                    let movestr = "";
                    for (let i = 0; i < moves.length; ++i) {
                        movestr += GoMath.prettyCoords(moves[i].x, moves[i].y, height) + " ";
                    }

                    return message.name + ". From move " + message.from + ": " + movestr;
                }
            }
        } catch (e) {
            console.log(e);
        }

        return message;
    } /* }}} */
    static markupSGFChat(username, message, width, height) { /* {{{ */
        return "C[" + ((username ? (username + ": ") : "") + MoveTree.markupSGFChatMessage(message, width, height)).replace(/[\\]/, "\\\\").replace(/\]/g, "\\]").replace(/[[]/g, "\\[") + "\n]\n";
    } /* }}} */
    static markupSGFChatWithoutNode(username, message, width, height) { /* {{{ */
        return ((username ? (username + ": ") : "") + MoveTree.markupSGFChatMessage(message, width, height)).replace(/[\\]/, "\\\\").replace(/\]/g, "\\]").replace(/[[]/g, "\\[") + "\n";
    } /* }}} */
}
