/*
 * Copyright (C) 2012-2020  Online-Go.com
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
export namespace SWEvent {
    export interface BaseEvent extends Event {
        waitUntil(fn: Promise<any>): void;
    }
    export interface FetchEvent extends BaseEvent {
        request: Request;
        respondWith: (res: Promise<Response> | Response ) => void;
    }
    export interface InstallEvent extends BaseEvent {
    }
    export interface ActivateEvent extends BaseEvent {

    }
    export type Rule = string | RegExp | Function;
}

