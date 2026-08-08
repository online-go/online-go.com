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

import { mockWebPushApi, WebPushSubscription } from "@/lib/web_push_api";

const notification_channel_name = "ogs-notifications";

interface ForegroundCheckMessage {
    type: "foreground-check";
}

function isForegroundCheckMessage(message: unknown): message is ForegroundCheckMessage {
    if (typeof message !== "object" || message === null) {
        return false;
    }

    return (message as Partial<ForegroundCheckMessage>).type === "foreground-check";
}

export function initializeWebPush(): void {
    if (!("serviceWorker" in navigator) || typeof BroadcastChannel === "undefined") {
        return;
    }

    const notification_channel = new BroadcastChannel(notification_channel_name);
    notification_channel.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (!isForegroundCheckMessage(event.data)) {
            return;
        }

        notification_channel.postMessage({
            type: "foreground-response",
            visible: document.visibilityState === "visible" && document.hasFocus(),
        });
    });

    void navigator.serviceWorker.register("/service-worker.js").catch((error: unknown) => {
        console.error("Unable to register the Web Push service worker", error);
    });
}

export function isWebPushSupported(): boolean {
    return (
        typeof navigator !== "undefined" &&
        "serviceWorker" in navigator &&
        typeof window !== "undefined" &&
        "PushManager" in window
    );
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
    return Notification.requestPermission();
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
    if (!isWebPushSupported()) {
        return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
}

function publicKeyToUint8Array(publicKey: string): Uint8Array<ArrayBuffer> {
    const base64 = publicKey.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const rawData = window.atob(paddedBase64);
    const output: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(rawData.length));

    for (let index = 0; index < rawData.length; index++) {
        output[index] = rawData.charCodeAt(index);
    }

    return output;
}

function serializeSubscription(subscription: PushSubscription): WebPushSubscription {
    const serialized = subscription.toJSON();

    if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) {
        throw new Error("The browser returned an incomplete Web Push subscription");
    }

    return {
        endpoint: serialized.endpoint,
        keys: {
            p256dh: serialized.keys.p256dh,
            auth: serialized.keys.auth,
        },
    };
}

export async function subscribeToPush(): Promise<PushSubscription> {
    if (!isWebPushSupported()) {
        throw new Error("Web Push is not supported by this browser");
    }

    const existingSubscription = await getPushSubscription();
    if (existingSubscription) {
        return existingSubscription;
    }

    const { vapid_public_key } = await mockWebPushApi.getConfig();
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        applicationServerKey: publicKeyToUint8Array(vapid_public_key),
        userVisibleOnly: true,
    });

    await mockWebPushApi.saveSubscription(serializeSubscription(subscription));
    return subscription;
}

export async function unsubscribeFromPush(): Promise<boolean> {
    const subscription = await getPushSubscription();
    if (!subscription) {
        return false;
    }

    const unsubscribed = await subscription.unsubscribe();
    if (unsubscribed) {
        await mockWebPushApi.deleteSubscription();
    }

    return unsubscribed;
}
