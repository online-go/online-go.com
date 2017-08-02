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

import {EventEmitter} from 'eventemitter3';

export class TypedEventEmitter<T> {
    private emitter = new EventEmitter();

    addListener<K extends keyof T>(event: K, listener: (arg?: T[K]) => any): this {
        this.emitter.addListener(event, listener);
        return this;
    }
    on<K extends keyof T>(event: K, listener: (arg?: T[K]) => any): this {
        this.emitter.on(event, listener);
        return this;
    }
    off<K extends keyof T>(event: K, listener: (arg?: T[K]) => any): this {
        this.emitter.off(event, listener);
        return this;
    }
    once<K extends keyof T>(event: K, listener: (arg?: T[K]) => any): this {
        this.emitter.once(event, listener);
        return this;
    }
    removeListener<K extends keyof T>(event: K, listener: (arg?: T[K]) => any): this {
        this.emitter.removeListener(event, listener);
        return this;
    }
    removeAllListeners<K extends keyof T>(event?: K): this {
        this.emitter.removeAllListeners(event);
        return this;
    }
    listeners<K extends keyof T>(event: K): ((arg: T[K]) => any)[] {
        return this.emitter.listeners(event);
    }
    emit<K extends keyof T>(event: K, arg?: T[K]): boolean {
        return this.emitter.emit(event, arg);
    }
}
