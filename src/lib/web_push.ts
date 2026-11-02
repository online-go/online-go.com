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
 *
 * A player who signs out, or who loses the browser to another player, stays
 * opted in. localStorage remembers them as paused, and their push starts again
 * when they next sign in here. Only turning push off, or removing this browser
 * from the device list, ends it.
 */

import * as data from "@/lib/data";
import { del, post } from "@/lib/requests";
import { device_info } from "@/lib/sockets";
import { current_language, interpolate, pgettext } from "@/lib/translate";

export type WebPushState = "on" | "off" | "blocked" | "unsupported" | "needs-home-screen";

const PLAYERS_KEY = "web-push-players";
const ENDPOINT_KEY = "web-push-endpoint";
const PAUSED_PLAYERS_KEY = "web-push-paused-players";
const PUSH_NOTIFICATION_WORKER_URL = "/push-notification-worker.js";
const SCOPE = "/";
/* Signing out gives the server this long to stop pushing before unsubscribing */
const SIGN_OUT_SERVER_WAIT_MS = 3000;

function storedPlayers(key: string): number[] {
    try {
        const players = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(players) ? players : [];
    } catch {
        return [];
    }
}

function rememberedPlayers(): number[] {
    return storedPlayers(PLAYERS_KEY);
}

function pausedPlayers(): number[] {
    return storedPlayers(PAUSED_PLAYERS_KEY);
}

/* The endpoint belongs to the last player who opted in, so that is the only
 * player remembered as holding it. Any earlier holder is paused. */
function rememberPlayer(player_id: number, endpoint: string): void {
    try {
        const paused = new Set([...pausedPlayers(), ...rememberedPlayers()]);
        paused.delete(player_id);
        localStorage.setItem(PAUSED_PLAYERS_KEY, JSON.stringify([...paused]));
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
        const paused = pausedPlayers().filter((id) => id !== player_id);
        localStorage.setItem(PAUSED_PLAYERS_KEY, JSON.stringify(paused));
    } catch (e) {
        console.warn(e);
    }
}

/* Moves every player remembered as holding the endpoint to the paused list */
function pauseRememberedPlayers(): void {
    try {
        const paused = new Set([...pausedPlayers(), ...rememberedPlayers()]);
        localStorage.setItem(PAUSED_PLAYERS_KEY, JSON.stringify([...paused]));
        localStorage.setItem(PLAYERS_KEY, "[]");
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

    const subscription = await subscribeBrowser(vapid_public_key);
    await post("me/push_devices", subscriptionBody(subscription, true));
    rememberPlayer(player_id, subscription.endpoint);
}

async function subscribeBrowser(vapid_public_key: string): Promise<PushSubscription> {
    const registration = await navigator.serviceWorker.ready;
    const options = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid_public_key),
    };
    try {
        return await registration.pushManager.subscribe(options);
    } catch (e) {
        /* A subscription made with an older VAPID key has to go first */
        const stale = await registration.pushManager.getSubscription();
        if (!stale || (e as Error | null)?.name !== "InvalidStateError") {
            throw e;
        }
        await stale.unsubscribe();
        return registration.pushManager.subscribe(options);
    }
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
    /* Unsubscribe here first: clearing local data may leave the page before the server answers */
    const endpoint = subscription.endpoint;
    try {
        await subscription.unsubscribe();
    } finally {
        await del(`me/push_devices?token=${encodeURIComponent(endpoint)}`);
    }
}

/** Stops pushes to this browser for a sign out, and remembers to start them
 * again when the player next signs in here. The browser keeps its subscription
 * when it can, because some browsers only subscribe in response to a click. */
export async function pauseWebPush(): Promise<void> {
    const player_id = signedInPlayerId();
    if (player_id === null || !rememberedPlayers().includes(player_id)) {
        return;
    }
    const subscription = await currentSubscription();
    if (subscription) {
        const server_stopped = await Promise.race([
            del(`me/push_devices?token=${encodeURIComponent(subscription.endpoint)}`).then(
                () => true,
                () => false,
            ),
            new Promise<boolean>((resolve) =>
                setTimeout(() => resolve(false), SIGN_OUT_SERVER_WAIT_MS),
            ),
        ]);
        if (!server_stopped) {
            await subscription.unsubscribe();
        }
    }
    /* Only now: until pushes have stopped, the next player to sign in must unsubscribe */
    pauseRememberedPlayers();
}

/* Gives the endpoint back to a paused player. If that can't happen yet the
 * player stays paused, so a later page load or a click on the turn on button
 * can still do it. */
async function resumeWebPush(player_id: number): Promise<void> {
    const vapid_public_key = data.get("config.vapid_public_key");
    if (!vapid_public_key || Notification.permission !== "granted") {
        return;
    }
    let subscription = await currentSubscription();
    if (!subscription) {
        await navigator.serviceWorker.register(PUSH_NOTIFICATION_WORKER_URL, { scope: SCOPE });
        try {
            subscription = await subscribeBrowser(vapid_public_key);
        } catch (e) {
            console.warn("Could not start web push again without a click: ", e);
            return;
        }
    }
    await post("me/push_devices", subscriptionBody(subscription, true));
    rememberPlayer(player_id, subscription.endpoint);
}

/** Keeps the server's copy of this browser's subscription fresh, starts push
 * again for a player who was paused here, and turns push off here if the server
 * no longer gives it to this player. */
export async function refreshWebPush(): Promise<void> {
    const player_id = signedInPlayerId();
    if (player_id === null || !pushSupported()) {
        return;
    }
    if (pausedPlayers().includes(player_id)) {
        await resumeWebPush(player_id);
        return;
    }
    const remembered = rememberedPlayers();
    if (!remembered.includes(player_id)) {
        /* Another player opted in here: stop showing their notifications to this one */
        if (remembered.length > 0) {
            await (await currentSubscription())?.unsubscribe();
            pauseRememberedPlayers();
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
