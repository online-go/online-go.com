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

import {dup} from "./GoUtil";
import {GoMath} from "./GoMath";
import {GoEngine, encodeMove, encodeMoves} from "./GoEngine";
import {_} from "./translate";

declare const CLIENT;
declare const SERVER;


/* This script is used on both the front end and back end, and the way the
 * OGSScoreEstimator module is loaded is quite differente between the two.
 *
 * On the server, the OGSScoreEsimtator module is loaded by score-estimator.ts
 * and teh set_OGSScoreEstimator function is called with the module.
 *
 * On the client, the OGSScoreEstimator script is loaded in an async fashion,
 * so at some point that global variable becomes not null and can be used.
 *
 */

declare var OGSScoreEstimator;
let OGSScoreEstimator_initialized = false;
let OGSScoreEstimatorModule;


/* This is used on the server side */
export function set_OGSScoreEstimator(mod) {
    OGSScoreEstimatorModule = mod;
    init_score_estimator().then((tf) => console.info('Score estimator intialized'));
}

let init_promise:Promise<boolean> = null;

export function init_score_estimator():Promise<boolean> {
    if (CLIENT) {
        if (OGSScoreEstimator_initialized) {
            //console.log("Already initialized");
            return Promise.resolve(true);
        }

        if (init_promise) {
            //console.log("An existing promise");
            return init_promise;
        }

        try {
            if (!OGSScoreEstimatorModule && 'OGSScoreEstimator' in window && window['OGSScoreEstimator']) {
                OGSScoreEstimatorModule = window['OGSScoreEstimator'];
            }
        } catch (e) {
            console.error(e);
        }

        if (OGSScoreEstimatorModule) {
            //console.log("Already loaded");
            OGSScoreEstimatorModule = OGSScoreEstimatorModule();
            OGSScoreEstimator_initialized = true;
            return Promise.resolve(true);
        }

        //console.log("Sync script");
        let script:HTMLScriptElement = document.getElementById('ogs_score_estimator_script') as HTMLScriptElement;
        let resolve;
        let reject;
        init_promise = new Promise<boolean>((_resolve, _reject) => {
            resolve = _resolve;
            reject  = _reject;
        });

        script.onload = () => {
            OGSScoreEstimatorModule = OGSScoreEstimator;
            OGSScoreEstimatorModule = OGSScoreEstimatorModule();
            OGSScoreEstimator_initialized = true;
            resolve(true);
        };

        return init_promise;
    }


    if (SERVER) {
        OGSScoreEstimatorModule = OGSScoreEstimatorModule();
        OGSScoreEstimator_initialized = true;
        return Promise.resolve(true);
    }
}

if (CLIENT) {
    init_score_estimator().then((tf) => {
        console.log('SE Initialized');
    });
}


class SEGroup {
    points;
    neighboring_enemy;
    neighboring_space;
    se;
    id;
    color;
    removed;
    estimated_score;
    estimated_hard_score;
    neighbors;
    neighbor_map;
    liberties;


    constructor(se, color, id) { /* {{{ */
        this.points = [];
        this.se = se;
        this.id = id;
        this.color = color;
        this.neighbors = [];
        this.neighboring_space = [];
        this.neighboring_enemy = [];
        this.neighbor_map = {};
        this.liberties = null; /* This is set by ScoreEstimator.resetGroups */
        this.removed = false;
        this.estimated_score = 0.0;
        this.estimated_hard_score = 0.0;
    } /* }}} */
    add(i, j, color) { /* {{{ */
        this.points.push({x: i, y: j, color: color});
    } /* }}} */
    foreachPoint(fn) { /* {{{ */
        for (let i = 0; i < this.points.length; ++i) {
            fn(this.points[i]);
        }
    } /* }}} */
    foreachNeighboringPoint(fn) { /* {{{ */
        let self = this;
        let points = this.points;
        let done_array = new Array(this.se.height * this.se.width);
        for (let i = 0; i < points.length; ++i) {
            done_array[points[i].x + points[i].y * this.se.width] = true;
        }

        function checkAndDo(x, y) {
            let idx = x + y * self.se.width;
            if (done_array[idx]) {
                return;
            }
            done_array[idx] = true;

            fn({"x": x, "y": y});
        }

        for (let i = 0; i < points.length; ++i) {
            let pt = points[i];
            if (pt.x - 1 >= 0)               { checkAndDo(pt.x - 1, pt.y); }
            if (pt.x + 1 !== this.se.width)  { checkAndDo(pt.x + 1, pt.y); }
            if (pt.y - 1 >= 0)               { checkAndDo(pt.x, pt.y - 1); }
            if (pt.y + 1 !== this.se.height) { checkAndDo(pt.x, pt.y + 1); }
        }
    } /* }}} */
    addNeighbor(group) { /* {{{ */
        if (!(group.id in this.neighbor_map)) {
            this.neighbors.push(group);
            this.neighbor_map[group.id] = true;

            if (group.color === 0) {
                this.neighboring_space.push(group);
            } else {
                this.neighboring_enemy.push(group);
            }
        }
    } /* }}} */
    foreachNeighborGroup(fn) { /* {{{ */
        for (let i = 0; i < this.neighbors.length; ++i) {
            //if (!this.neighbors[i].removed) {
                fn(this.neighbors[i]);
            //}
        }
    } /* }}} */
    foreachNeighborSpaceGroup(fn) { /* {{{ */
        for (let i = 0; i < this.neighboring_space.length; ++i) {
            //if (!this.neighboring_space[i].removed) {
                fn(this.neighboring_space[i]);
            //}
        }
    } /* }}} */
    foreachNeighborEnemyGroup(fn) { /* {{{ */
        for (let i = 0; i < this.neighboring_enemy.length; ++i) {
            //if (!this.neighboring_enemy[i].removed) {
                fn(this.neighboring_enemy[i]);
            //}
        }
    } /* }}} */
    setRemoved(removed) { /* {{{ */
        this.removed = removed;
        for (let i = 0; i < this.points.length; ++i) {
            let pt = this.points[i];
            this.se.setRemoved(pt.x, pt.y, removed);
        }
    } /* }}} */
}

export class ScoreEstimator {
    width;
    height;
    board;
    white_prisoners;
    black_prisoners;
    score_stones;
    score_prisoners;
    score_territory;
    score_territory_in_seki;
    removed;
    black;
    white;
    engine;
    groups;
    currentMarker;
    removal;
    cb;
    tolerance;
    group_list;
    marks;
    amount;
    amount_fractional;
    area;
    territory;
    trials;
    estimated_area;
    winner;
    heat;
    color_to_move;
    estimated_score;
    estimated_hard_score;



    constructor(cb) { /* {{{ */
        this.cb = cb;
    } /* }}} */

    init(engine, trials, tolerance) { /* {{{ */
        this.currentMarker = 1;
        this.engine = engine;
        this.width = engine.width;
        this.height = engine.height;
        this.color_to_move = engine.colorToMove();
        this.board = dup(engine.board);
        this.removal = this.removed = GoMath.makeMatrix(this.width, this.height, 0);
        this.marks = GoMath.makeMatrix(this.width, this.height, 0);
        this.area = GoMath.makeMatrix(this.width, this.height, 0);
        this.heat = GoMath.makeMatrix(this.width, this.height, 0.0);
        this.estimated_area = GoMath.makeMatrix(this.width, this.height, 0.0);
        this.groups = GoMath.makeMatrix(this.width, this.height, 0);
        this.territory = GoMath.makeMatrix(this.width, this.height, 0);
        this.estimated_score = 0.0;
        this.estimated_hard_score = 0.0;
        this.group_list = [];
        this.trials = trials;
        this.tolerance = tolerance;

        this.resetGroups();
        this.estimateScore(this.trials, this.tolerance);
        //this.sealDame();
    } /* }}} */
    estimateScore(trials, tolerance) { /* {{{ */
        if (!OGSScoreEstimator_initialized) {
            throw new Error("Score estimator not intialized yet");
        }

        /* NEW STUFF */
        if (!trials) {
            trials = 1000;
        }
        if (!tolerance) {
            tolerance = 0.25;
        }

        /* Call our score estimator code to do the estimation. We do this assignment here
         * because it's likely that the module isn't done loading on the client
         * when the top of this script (where score estimator is first assigned) is
         * executing. (it's loaded async)
         */
        let nbytes = 4 * this.engine.width * this.engine.height;
        let ptr = OGSScoreEstimatorModule._malloc(nbytes);
        let ints = new Int32Array(OGSScoreEstimatorModule.HEAP32.buffer,  ptr, nbytes);
        let i = 0;
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                ints[i] = this.board[y][x] === 2 ? -1 : this.board[y][x];
                if (this.removal[y][x]) {
                    ints[i] = 0;
                }
                ++i;
            }
        }
        let _estimate = OGSScoreEstimatorModule.cwrap("estimate", "number", ["number", "number", "number", "number", "number", "number"]);
        let estimate = _estimate as (w, h, p, c, tr, to) => number;
        let st = Date.now();
        let estimated_score = estimate(
                    this.width, this.height, ptr,
                    this.engine.colorToMove() === "black" ? 1 : -1,
                    trials, tolerance);
        console.log("Score estimation time: ", Date.now() - st);
        let result = GoMath.makeMatrix(this.width, this.height, 0);
        i = 0;
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                //result[y][x] = ints[i] < 0 ? 2 : ints[i];
                result[y][x] = ints[i];
                ++i;
            }
        }
        OGSScoreEstimatorModule._free(ptr);


        /* Build up our heat map and result */
        /* negative for black, 0 for neutral, positive for white */
        //this.heat = GoMath.makeMatrix(this.width, this.height, 0.0);
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                this.heat[y][x] = result[y][x];
                this.area[y][x] = result[y][x] < 0 ? 2 : result[y][x];
                //this.area[y][x] = result[y][x];
                this.estimated_area[y][x] = this.area[y][x];
            }
        }
        this.estimated_score = estimated_score - this.engine.komi;
        this.estimated_hard_score = estimated_score - this.engine.komi;

        this.winner = this.estimated_hard_score > 0 ? _("Black") : _("White");
        this.amount = Math.abs(this.estimated_hard_score);
        this.amount_fractional = Math.abs(this.estimated_score).toFixed(1);

        if (this.cb && this.cb.heatmapUpdated) {
            this.cb.heatmapUpdated();
        }
        if (this.cb && this.cb.updateScoreEstimation) {
            this.cb.updateScoreEstimation();
        }
    } /* }}} */
    getProbablyDead() { /* {{{ */
        let ret = "";
        let arr = [];
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                if (
                  //(this.board[y][x] === 0 && this.area[y][x] === 0) /* dame */
                  //||
                  //(this.board[y][x] !== 0 && this.area[y][x] !== this.board[y][x]) /* captured */
                  (this.area[y][x] === 0 || (this.board[y][x] !== 0 && this.area[y][x] !== this.board[y][x]))
                ) {
                    arr.push(encodeMove(x, y));
                }
            }
        }
        arr.sort();
        for (let i = 0; i < arr.length; ++i) {
            ret += arr[i];
        }
        return ret;
    } /* }}} */
    resetGroups() { /* {{{ */
        let self = this;
        console.log("resetting groups");
        this.territory = GoMath.makeMatrix(this.width, this.height, 0);
        this.groups = GoMath.makeMatrix(this.width, this.height, 0);
        this.group_list = [];
        let stack = null;

        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                if (!this.groups[y][x]) {
                    this.incrementCurrentMarker(); /* clear marks */
                    let color = this.board[y][x];
                    let g = new SEGroup(this, color, this.currentMarker);
                    this.group_list.push(g);
                    stack = [x, y];
                    while (stack.length) {
                        let yy = stack.pop();
                        let xx = stack.pop();
                        if (this.marks[yy][xx] === this.currentMarker) {
                            continue;
                        }
                        this.marks[yy][xx] = this.currentMarker;
                        if (this.board[yy][xx] === color || (color === 0 && this.removed[yy][xx])) {
                            this.groups[yy][xx] = g;
                            g.add(xx, yy, color);
                            //this.foreachNeighbor({"x": xx, "y": yy}, function(x,y) { stack.push(x); stack.push(y); });
                            this.foreachNeighbor({"x": xx, "y": yy}, push_on_stack);
                        }
                    }
                }
            }
        }

        function push_on_stack(x, y) {
            stack.push(x);
            stack.push(y);
        }

        /* compute group neighborhoodship */
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                this.foreachNeighbor({"x": x, "y": y}, (xx, yy) => {
                    if (this.groups[y][x].id !== this.groups[yy][xx].id) {
                        this.groups[y][x].addNeighbor(this.groups[yy][xx]);
                        this.groups[yy][xx].addNeighbor(this.groups[y][x]);
                    }
                });
            }
        }

        /* compute liberties */
        this.foreachGroup((g) => {
            if (g.color) {
                let liberties = 0;
                g.foreachNeighboringPoint((pt) => {
                    if (this.board[pt.y][pt.x] === 0 || this.removed[pt.y][pt.x]) {
                        ++liberties;
                    }
                });
                g.liberties = liberties;
            }
        });
    } /* }}} */
    foreachGroup(fn) { /* {{{ */
        for (let i = 0; i < this.group_list.length; ++i) {
            fn(this.group_list[i]);
        }
    } /* }}} */
    handleClick(i, j, modkey) { /* {{{ */
        if (modkey) {
            this.setRemoved(i, j, !this.removal[j][i]);
        } else {
            this.toggleMetaGroupRemoval(i, j);
        }

        this.estimateScore(this.trials, this.tolerance);
        //this.resetGroups();
    } /* }}} */
    toggleMetaGroupRemoval(x, y) { /* {{{ */
        let self = this;
        let len = 0;
        let already_done = {};
        let space_groups = [];
        let group_color = null;

        try {
            if (x >= 0 && y >= 0) {
                let removing = !this.removal[y][x];
                let group = this.getGroup(x, y);
                group.setRemoved(removing);

                group_color = this.board[y][x];
                if (group_color === 0) {
                    /* just toggle open area */
                } else {
                    /* for stones though, toggle the selected stone group any any stone
                    * groups which are adjacent to it through open area */

                    group.foreachNeighborSpaceGroup((g) => {
                        if (!already_done[g.id]) {
                            space_groups.push(g);
                            already_done[g.id] = true;
                        }
                    });

                    while (space_groups.length) {
                        let cur_space_group = space_groups.pop();
                        cur_space_group.foreachNeighborEnemyGroup((g) => {
                            if (!already_done[g.id]) {
                                already_done[g.id] = true;
                                if (g.color === group_color) {
                                    g.setRemoved(removing);
                                    g.foreachNeighborSpaceGroup((gspace) => {
                                        if (!already_done[gspace.id]) {
                                            space_groups.push(gspace);
                                            already_done[gspace.id] = true;
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.log(e.stack);
        }

    } /* }}} */
    setRemoved(x, y, removed) { /* {{{ */
        this.removal[y][x] = removed;
        if (this.cb) {
            this.cb.setForRemoval(x, y, this.removal[y][x]);
        }
    } /* }}} */
    clearRemoved() { /* {{{ */
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                if (this.removal[y][x]) {
                    this.setRemoved(x, y, 0);
                }
            }
        }
    } /* }}} */
    getStoneRemovalString() { /* {{{ */
        let ret = "";
        let arr = [];
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                if (this.removal[y][x]) {
                    arr.push(encodeMove(x, y));
                }
            }
        }
        arr.sort();
        for (let i = 0; i < arr.length; ++i) {
            ret += arr[i];
        }
        return ret;
    } /* }}} */
    getGroup(x, y) { /* {{{ */
        return this.groups[y][x];
    } /* }}} */
    incrementCurrentMarker() { /* {{{ */
        ++this.currentMarker;
    } /* }}} */

    /** Returns an array of groups connected to the given group */
    markGroup(group) { /* {{{ */
        for (let i = 0; i < group.length; ++i) {
            this.marks[group[i].y][group[i].x] = this.currentMarker;
        }
    } /* }}} */
    /**
     * This gets run after we've instructed the estimator how/when to fill dame,
     * manually mark removed/dame, etc..  it does an official scoring from the
     * remaining territory.
     */
    score() { /* {{{ */
        this.white = {
                "total": 0,
                "stones": 0,
                "territory": 0,
                "prisoners": 0,
                "scoring_positions": "",
                "handicap": this.engine.handicap,
                "komi": this.engine.komi
            };
        this.black = {
                "total": 0,
                "stones": 0,
                "territory": 0,
                "prisoners": 0,
                "scoring_positions": "",
                "handicap": 0,
                "komi": 0
            };

        let removed_black = 0;
        let removed_white = 0;

        /* clear removed */
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                if (this.removed[y][x]) {
                    if (this.board[y][x] === 1) {
                        ++removed_black;
                    }
                    if (this.board[y][x] === 2) {
                        ++removed_white;
                    }
                    this.board[y][x] = 0;
                }
            }
        }

        //if (this.phase !== "play") {
        if (this.score_territory) {
            let gm = new GoMath(this);
            //console.log(gm);

            gm.foreachGroup((gr) => {
                if (gr.is_territory) {
                    //console.log(gr);
                    if (!this.score_territory_in_seki && gr.is_territory_in_seki) {
                        return;
                    }
                    let color = gr.territory_color === 1 ? "black" : "white";
                    this[color].scoring_positions += encodeMoves(gr.points);
                    console.warn("What should be unreached code is running, should probably be running "
                                 + "this[color].territory += markScored(gr.points, false);");
                    //this[color].territory += markScored(gr.points, false);
                }
            });
        }

        if (this.score_stones) {
            for (let y = 0; y < this.height; ++y) {
                for (let x = 0; x < this.width; ++x) {
                    if (this.board[y][x]) {
                        let color = this.board[y][x] === 1 ? "black" : "white";
                        ++this[color].stones;
                        this[color].scoring_positions += encodeMove(x, y);
                    }
                }
            }
        }
        //}

        if (this.score_prisoners) {
            this["black"].prisoners = this.black_prisoners + removed_white;
            this["white"].prisoners = this.white_prisoners + removed_black;
        }

        for (let color in {"black": "black", "white": "white"}) {
            this[color].total = this[color].stones + this[color].territory + this[color].prisoners + this[color].komi;
            if (this.score_stones) {
                this[color].total += this[color].handicap;
            }
        }

        return this;
    } /* }}} */
    foreachNeighbor(pt_or_group, fn_of_neighbor_pt) { /* {{{ */
        let self = this;
        let group;
        let done_array;

        if (pt_or_group.constructor === Array) {
            group = pt_or_group;
            done_array = new Array(this.height * this.width);
            for (let i = 0; i < group.length; ++i) {
                done_array[group[i].x + group[i].y * this.width] = true;
            }
            for (let i = 0; i < group.length; ++i) {
                let pt = group[i];
                if (pt.x - 1 >= 0)            { checkAndDo(pt.x - 1, pt.y); }
                if (pt.x + 1 !== this.width)  { checkAndDo(pt.x + 1, pt.y); }
                if (pt.y - 1 >= 0)            { checkAndDo(pt.x, pt.y - 1); }
                if (pt.y + 1 !== this.height) { checkAndDo(pt.x, pt.y + 1); }
            }
        } else {
            let pt = pt_or_group;
            if (pt.x - 1 >= 0)            { fn_of_neighbor_pt(pt.x - 1, pt.y); }
            if (pt.x + 1 !== this.width)  { fn_of_neighbor_pt(pt.x + 1, pt.y); }
            if (pt.y - 1 >= 0)            { fn_of_neighbor_pt(pt.x, pt.y - 1); }
            if (pt.y + 1 !== this.height) { fn_of_neighbor_pt(pt.x, pt.y + 1); }
        }

        function checkAndDo(x, y) {
            let idx = x + y * self.width;
            if (done_array[idx]) {
                return;
            }
            done_array[idx] = true;

            fn_of_neighbor_pt(x, y);
        }
    } /* }}} */
}
