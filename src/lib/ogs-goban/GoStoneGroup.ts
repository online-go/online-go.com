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

export class GoStoneGroup {
    probable_color: any;
    dame: any;
    __added_neighbors: any;
    corner_groups: any;
    points: any;
    neighbors: any;
    is_territory: any;
    color: any;
    is_probably_dead: any;
    is_probably_dame: any;
    engine: any;
    id: any;
    is_strong_eye: any;
    adjacent_white: any;
    adjacent_black: any;
    is_eye: any;
    is_strong_string: any;
    territory_color: any;
    is_territory_in_seki: any;


    constructor(engine, id, color, dame) { /* {{{ */
        this.engine = engine;
        this.points = [];
        this.neighbors = [];
        this.id = id;
        this.color = color;
        this.is_strong_eye = false;
        this.adjacent_black = 0;
        this.adjacent_white = 0;
        this.probable_color = 0;
        this.dame = dame;

        this.__added_neighbors = {};
        this.corner_groups = {};
    } /* }}} */
    addStone(x, y) { /* {{{ */
        this.points.push({"x": x, "y": y});
    }; /* }}} */
    addNeighborGroup(group) { /* {{{ */
        if (!(group.id in this.__added_neighbors)) {
            this.neighbors.push(group);
            this.__added_neighbors[group.id] = true;
        }
    }; /* }}} */
    addCornerGroup(x, y, group) { /* {{{ */
        if (!(y in this.corner_groups)) { this.corner_groups[y]  = {}; }
        this.corner_groups[y][x] = group;
    }; /* }}} */
    foreachStone(fn) { /* {{{ */
        for (let i = 0; i < this.points.length; ++i) {
            fn(this.points[i]);
        }
    }; /* }}} */
    foreachNeighborGroup(fn) { /* {{{ */
        for (let i = 0; i < this.neighbors.length; ++i) {
            fn(this.neighbors[i]);
        }
    }; /* }}} */
    computeIsEye() { /* {{{ */
        this.is_eye = false;

        if (this.points.length > 1) { return; }
        this.is_eye = this.is_territory;
    }; /* }}} */
    size() { /* {{{ */
        return this.points.length;
    }; /* }}} */
    computeIsStrongEye() { /* {{{ */
        /* If a single eye is surrounded by 7+ stones of the same color, 5 stones
         * for edges, and 3 stones for corners, or if any of those spots are
         * territory owned by the same color, it is considered strong. */
        this.is_strong_eye = false;
        let color;
        let engine = this.engine;
        if (this.is_eye) {
            let x = this.points[0].x;
            let y = this.points[0].y;
            color = engine.board[y][x === 0 ? x + 1 : x - 1];
            let not_color = 0;

            let chk = (x, y) => {
                /* If there is a stone on the board and it's not our color,
                 * or if the spot is part of some territory which is not our color,
                 * then return true, else false. */
                return (color !== engine.board[y][x] && (!this.corner_groups[y][x].is_territory || this.corner_groups[y][x].territory_color !== color)) ? 1 : 0;
            };

            not_color =
                (x - 1 >= 0           && y - 1 >= 0            ? chk(x - 1, y - 1) : 0) +
                (x + 1 < engine.width && y - 1 >= 0            ? chk(x + 1, y - 1) : 0) +
                (x - 1 >= 0           && y + 1 < engine.height ? chk(x - 1, y + 1) : 0) +
                (x + 1 < engine.width && y + 1 < engine.height ? chk(x + 1, y + 1) : 0);

            if (x - 1 >= 0 && x + 1 < engine.width && y - 1 >= 0 && y + 1 < engine.height) {
                this.is_strong_eye = not_color <= 1;
            } else {
                this.is_strong_eye = not_color === 0;
            }
        }

    }; /* }}} */
    computeIsStrongString() { /* {{{ */
        /* A group is considered a strong string if it is adjacent to two strong eyes */
        let strong_eye_count = 0;
        this.foreachNeighborGroup((gr) => {
            strong_eye_count += gr.is_strong_eye;
        });
        this.is_strong_string = strong_eye_count >= 2;
    }; /* }}} */
    computeIsTerritory() { /* {{{ */
        /* An empty group is considered territory if all of it's neighbors are of
         * the same color */
        this.is_territory = false;
        this.territory_color = 0;
        if (this.color) {
            return;
        }

        let color = 0;
        for (let i = 0; i < this.neighbors.length; ++i) {
            if (this.neighbors[i].color !== 0) {
                color = this.neighbors[i].color;
                break;
            }
        }

        this.foreachNeighborGroup((gr) => {
            if (gr.color !== 0 && color !== gr.color) {
                color = 0;
            }
        });

        if (color) {
            this.is_territory = true;
            this.territory_color = color;
        }
    }; /* }}} */
    computeIsTerritoryInSeki() { /* {{{ */
        /* An empty group is considered territory if all of it's neighbors are of
         * the same color */
        this.is_territory_in_seki = false;
        if (this.is_territory) {
            this.foreachNeighborGroup((border_stones) => {
                border_stones.foreachNeighborGroup((border_of_border) => {
                    if (border_of_border.color === 0 && !border_of_border.is_territory) {
                        /* only mark in seki if the neighboring would-be-blocking
                         * territory hasn't been negated. */
                        let is_not_negated = true;
                        for (let i = 0; i < border_of_border.points.length; ++i) {
                            let x = border_of_border.points[i].x;
                            let y = border_of_border.points[i].y;
                            if (!this.engine.removal[y][x]) {
                                is_not_negated = false;
                            }
                        }
                        if (!is_not_negated) {
                            this.is_territory_in_seki = true;
                        }
                    }
                });
            });
        }
    }; /* }}} */
    computeProbableColor() { /* {{{ */
        /* For open area that has no definitive owner, compute the weight
         * of how much of who is touching the area */
        this.adjacent_black = 0;
        this.adjacent_white = 0;
        this.probable_color = 0;
        this.engine.foreachNeighbor(this.points, (x, y) => {
            let color = this.engine.board[y][x];
            if (color === 1) { this.adjacent_black++; }
            if (color === 2) { this.adjacent_white++; }
        });
        if (this.adjacent_white >= this.adjacent_black * 3) { this.probable_color = 2; }
        if (this.adjacent_black >= this.adjacent_white * 3) { this.probable_color = 1; }
    }; /* }}} */
    computeProbablyDead() { /* {{{ */
        this.is_probably_dead = false;

        if (this.color) {
            let probably_alive = false;
            let open_areas = [];

            this.foreachNeighborGroup((gr) => {
                if (gr.is_territory && gr.territory_color === this.color) {
                    probably_alive = true;
                }
                if (!gr.is_territory && gr.probable_color === this.color) {
                    probably_alive = true;
                }
                if (gr.color === 0) {
                    open_areas.push(gr);
                }
            });

            this.is_probably_dead = !probably_alive;
        }

    }; /* }}} */
    computeProbablyDame() { /* {{{ */
        this.is_probably_dame = false;
        if (!this.is_territory && this.color === 0 && this.size() < 2) {
            this.is_probably_dame = true;
        }
    }; /* }}} */

}
