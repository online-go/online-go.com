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

export class GoConditionalMove {
    children: any;
    parent: GoConditionalMove;
    move: string;

    constructor(move, parent) {
        this.move = move;
        this.parent = parent;
        this.children = {};
    }

    encode() {
        let ret = {};
        for (let ch in this.children) {
            ret[ch] = this.children[ch].encode();
        }
        return [this.move, ret];
    }
    static decode(data) {
        let move = data[0];
        let children = data[1];
        let ret = new GoConditionalMove(move, null);
        for (let ch in children) {
            let child = GoConditionalMove.decode(children[ch]);
            child.parent = ret;
            ret.children[ch] = child;
        }
        return ret;
    }
    getChild(mv) {
        if (mv in this.children) {
            return this.children[mv];
        }
        //console.log("Didn't have child " + mv);
        //console.log(this.children);
        return new GoConditionalMove(null, this);
    }
    duplicate():GoConditionalMove {
        return GoConditionalMove.decode(this.encode());
    }
}
