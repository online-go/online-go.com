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

export class GoError {
    engine: any;
    x: any;
    y: any;
    message: any;

    constructor(engine, x, y, msg) {
        this.engine = engine;
        this.x = x;
        this.y = y;
        this.message = msg;
    }
    toString() {
        return this.message + ": (Game " + this.engine.config.game_id + " x: " + this.x + " y: " + this.y + ")";
    }
}
