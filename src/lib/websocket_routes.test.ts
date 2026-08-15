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

import {
    isValidWebsocketRoute,
    ROUTE_CLOUDFLARE,
    ROUTE_GOOGLE_PREMIUM,
    ROUTE_PUBLIC,
} from "./websocket_routes";

describe("isValidWebsocketRoute", () => {
    test("accepts each official gateway route", () => {
        expect(isValidWebsocketRoute(ROUTE_CLOUDFLARE)).toBe(true);
        expect(isValidWebsocketRoute(ROUTE_GOOGLE_PREMIUM)).toBe(true);
        expect(isValidWebsocketRoute(ROUTE_PUBLIC)).toBe(true);
    });

    test("rejects an arbitrary attacker-controlled host", () => {
        expect(isValidWebsocketRoute("wss://evil.example")).toBe(false);
        expect(isValidWebsocketRoute("https://evil.example")).toBe(false);
        expect(isValidWebsocketRoute("ws://evil.example")).toBe(false);
        expect(isValidWebsocketRoute("evil.example")).toBe(false);
        expect(isValidWebsocketRoute("")).toBe(false);
    });

    test("rejects lookalike hostnames of official routes", () => {
        expect(isValidWebsocketRoute("wss://online-go.com.evil.example")).toBe(false);
        expect(isValidWebsocketRoute("wss://online-go.com@evil.example")).toBe(false);
        expect(isValidWebsocketRoute("wss://online-go.com/")).toBe(false);
        expect(isValidWebsocketRoute("wss://WSS.online-go.com")).toBe(false);
        expect(isValidWebsocketRoute("wss://wsp.online-go.com.evil.example")).toBe(false);
    });

    test("rejects non-route strings", () => {
        expect(isValidWebsocketRoute("null")).toBe(false);
        expect(isValidWebsocketRoute("42")).toBe(false);
    });
});
