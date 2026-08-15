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

export const ROUTE_CLOUDFLARE = "wss://online-go.com";
export const ROUTE_GOOGLE_PREMIUM = "wss://wsp.online-go.com";
export const ROUTE_PUBLIC = "wss://wss.online-go.com";

const WEBSOCKET_ROUTES: ReadonlySet<string> = new Set([
    ROUTE_CLOUDFLARE,
    ROUTE_GOOGLE_PREMIUM,
    ROUTE_PUBLIC,
]);

/**
 * Returns true when `host` is one of the official WebSocket gateway routes.
 *
 * The session JWT is transmitted to the chosen gateway on connect (see the
 * socket `authenticate` call in main.tsx), so only hosts in this allowlist may
 * be used. The `ogs.websocket_host` localStorage override is validated against
 * it to prevent an attacker-controlled host from receiving the session token.
 */
export function isValidWebsocketRoute(host: string): boolean {
    return WEBSOCKET_ROUTES.has(host);
}

/**
 * Returns true when a localStorage `ogs.websocket_host` override may be used.
 *
 * Besides the official gateway routes, an override equal to the page's own
 * origin is accepted so that same-origin deployments (e.g. beta, self-hosted,
 * and development servers) can keep pointing the socket at themselves. Since
 * that host already serves the page and receives the JWT legitimately, it does
 * not expose the session token to a third party.
 */
export function isValidWebsocketOverride(host: string, origin: string): boolean {
    return host === origin || isValidWebsocketRoute(host);
}
