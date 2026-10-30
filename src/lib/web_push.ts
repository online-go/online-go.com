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

/**
 * Web push: subscribing this browser to the player's push notifications.
 *
 * A browser has one push subscription, and the server gives its endpoint to
 * one player at a time. localStorage remembers which player opted in here, so
 * a different player signing in on the same browser does not take it over by
 * just loading a page. It also remembers the endpoint they opted in with, so
 * an endpoint the browser rotated can be told apart from one that was removed.
 */

import * as data from "@/lib/data";
import { del, post } from "@/lib/requests";
import { device_info } from "@/lib/sockets";
import { current_language, interpolate, pgettext } from "@/lib/translate";

export type WebPushState = "on" | "off" | "blocked" | "unsupported" | "needs-home-screen";

const PLAYERS_KEY = "web-push-players";
const ENDPOINT_KEY = "web-push-endpoint";
const PUSH_NOTIFICATION_WORKER_URL = "/push-notification-worker.js";
const SCOPE = "/";

function rememberedPlayers(): number[] {
    try {
        const players = JSON.parse(localStorage.getItem(PLAYERS_KEY) || "[]");
        return Array.isArray(players) ? players : [];
    } catch {
        return [];
    }
}

/* The endpoint belongs to the last player who opted in, so that is the only
 * player remembered. */
function rememberPlayer(player_id: number, endpoint: string): void {
    try {
        localStorage.setItem(PLAYERS_KEY, JSON.stringify([player_id]));
        localStorage.setItem(ENDPOINT_KEY, endpoint);
    } catch (e) {
        console.warn(e);
    }
}

function rememberedEndpoint(): string | null {
    try {
        return localStorage.getItem(ENDPOINT_KEY);
    } catch {
        return null;
    }
}

function forgetPlayer(player_id: number): void {
    try {
        const players = rememberedPlayers().filter((id) => id !== player_id);
        localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
    } catch (e) {
        console.warn(e);
    }
}

function signedInPlayerId(): number | null {
    const user = data.get("config.user");
    return user && !user.anonymous ? user.id : null;
}

function pushSupported(): boolean {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function isStandalone(): boolean {
    return (
        window.matchMedia?.("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

function isIOS(): boolean {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function urlBase64ToUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
    const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4))
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function currentSubscription(): Promise<PushSubscription | null> {
    if (!pushSupported()) {
        return null;
    }
    const registration = await navigator.serviceWorker.getRegistration(SCOPE);
    return registration ? registration.pushManager.getSubscription() : null;
}

function subscriptionBody(subscription: PushSubscription, opt_in: boolean) {
    return {
        provider: "webpush",
        token: subscription.endpoint,
        keys: subscription.toJSON().keys,
        form_factor: formFactor(),
        label: deviceLabel(),
        language: current_language,
        opt_in,
    };
}

export function formFactor(): "mobile" | "desktop" {
    const ua_data = (
        navigator as Navigator & { userAgentData?: { mobile: boolean; platform: string } }
    ).userAgentData;
    if (ua_data) {
        /* Android tablets report mobile: false */
        return ua_data.mobile || ua_data.platform === "Android" ? "mobile" : "desktop";
    }
    return /Mobi|Android|iPhone|iPad/.test(navigator.userAgent) || isIOS() ? "mobile" : "desktop";
}

/** Names this browser for the player's list of devices, e.g. "Chrome on Android". */
export function deviceLabel(): string {
    const label = interpolate(
        pgettext("Names a web browser that gets push notifications", "{{browser}} on {{os}}"),
        {
            browser: device_info.browser_name,
            /* iPadOS claims to be a Mac */
            os:
                isIOS() && /Macintosh/.test(navigator.userAgent)
                    ? pgettext("Operating system name", "iPadOS")
                    : device_info.os_name,
        },
    );
    if (isStandalone()) {
        return (
            label +
            pgettext(
                "Appended to a browser's name when the site was added to the home screen",
                " (home screen app)",
            )
        );
    }
    return label;
}

export async function currentWebPushEndpoint(): Promise<string | null> {
    return (await currentSubscription())?.endpoint ?? null;
}

export async function webPushState(): Promise<WebPushState> {
    if (isIOS() && !isStandalone() && !("PushManager" in window)) {
        return "needs-home-screen";
    }
    if (!pushSupported() || !data.get("config.vapid_public_key")) {
        return "unsupported";
    }
    if (Notification.permission === "denied") {
        return "blocked";
    }
    const player_id = signedInPlayerId();
    if (player_id === null || !rememberedPlayers().includes(player_id)) {
        return "off";
    }
    return (await currentSubscription()) ? "on" : "off";
}

/** Subscribes this browser for the signed in player. Call it from a click
 * handler: the browser only asks for permission in response to the player. */
export async function enableWebPush(): Promise<void> {
    const player_id = signedInPlayerId();
    const vapid_public_key = data.get("config.vapid_public_key");
    if (player_id === null || !vapid_public_key || !pushSupported()) {
        return;
    }

    /* Ask before the first await, while the click still counts as the
     * player's gesture. */
    const permission_request = Notification.requestPermission();
    await navigator.serviceWorker.register(PUSH_NOTIFICATION_WORKER_URL, { scope: SCOPE });
    if ((await permission_request) !== "granted") {
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    const options = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid_public_key),
    };
    let subscription: PushSubscription;
    try {
        subscription = await registration.pushManager.subscribe(options);
    } catch (e) {
        /* A subscription made with an older VAPID key has to go first */
        const stale = await registration.pushManager.getSubscription();
        if (!stale || (e as Error | null)?.name !== "InvalidStateError") {
            throw e;
        }
        await stale.unsubscribe();
        subscription = await registration.pushManager.subscribe(options);
    }

    await post("me/push_devices", subscriptionBody(subscription, true));
    rememberPlayer(player_id, subscription.endpoint);
}

/** Unsubscribes this browser and tells the server to stop pushing to it. */
export async function disableWebPush(): Promise<void> {
    const player_id = signedInPlayerId();
    if (player_id !== null) {
        forgetPlayer(player_id);
    }
    const subscription = await currentSubscription();
    if (!subscription) {
        return;
    }
    /* Unsubscribe here first: signing out may leave the page before the server answers */
    const endpoint = subscription.endpoint;
    try {
        await subscription.unsubscribe();
    } finally {
        await del(`me/push_devices?token=${encodeURIComponent(endpoint)}`);
    }
}

/** Keeps the server's copy of this browser's subscription fresh, and turns
 * push off here if the server no longer gives it to this player. */
export async function refreshWebPush(): Promise<void> {
    const player_id = signedInPlayerId();
    if (player_id === null || !pushSupported()) {
        return;
    }
    const remembered = rememberedPlayers();
    if (!remembered.includes(player_id)) {
        /* Another player opted in here: stop showing their notifications to this one */
        if (remembered.length > 0) {
            await (await currentSubscription())?.unsubscribe();
        }
        return;
    }
    const subscription = await currentSubscription();
    if (!subscription) {
        forgetPlayer(player_id);
        return;
    }
    if (subscription.endpoint !== rememberedEndpoint()) {
        /* The browser replaced the subscription this player opted in with */
        await post("me/push_devices", subscriptionBody(subscription, true));
        rememberPlayer(player_id, subscription.endpoint);
        return;
    }
    try {
        await post("me/push_devices", subscriptionBody(subscription, false));
    } catch (e) {
        /* requests.ts rejects with the response body, so the 404 is known by its error */
        if ((e as { error?: string } | null)?.error !== "not registered") {
            throw e;
        }
        forgetPlayer(player_id);
        await subscription.unsubscribe();
    }
}
