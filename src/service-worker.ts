/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/// <reference lib="webworker" />

const service_worker = globalThis as unknown as ServiceWorkerGlobalScope;

const notification_channel = new BroadcastChannel("ogs-notifications");
const foreground_check_timeout_ms = 100;

interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data: {
        url: string;
    };
}

interface ForegroundCheckResponse {
    type: "foreground-response";
    visible: boolean;
}

function isForegroundResponse(message: unknown): message is ForegroundCheckResponse {
    if (typeof message !== "object" || message === null) {
        return false;
    }

    const response = message as Partial<ForegroundCheckResponse>;
    return response.type === "foreground-response" && response.visible === true;
}

function has_foreground_client(): Promise<boolean> {
    return new Promise((resolve) => {
        let foreground_client_found = false;

        const handle_response = (event: MessageEvent<unknown>) => {
            if (isForegroundResponse(event.data)) {
                foreground_client_found = true;
            }
        };

        notification_channel.addEventListener("message", handle_response);
        notification_channel.postMessage({ type: "foreground-check" });

        setTimeout(() => {
            notification_channel.removeEventListener("message", handle_response);
            resolve(foreground_client_found);
        }, foreground_check_timeout_ms);
    });
}

service_worker.addEventListener("push", (event: Event) => {
    const push_event = event as PushEvent;

    push_event.waitUntil(
        (async () => {
            const payload = push_event.data?.json() as PushPayload;

            if (await has_foreground_client()) {
                return;
            }

            await service_worker.registration.showNotification(payload.title, {
                body: payload.body,
                icon: payload.icon,
                tag: payload.tag,
                data: payload.data,
            });
        })(),
    );
});

service_worker.addEventListener("notificationclick", (event: Event) => {
    const notification_event = event as NotificationEvent;
    notification_event.notification.close();

    notification_event.waitUntil(
        (async () => {
            const data = notification_event.notification.data as { url?: unknown } | undefined;
            const url = typeof data?.url === "string" ? data.url : "/";
            const target = new URL(url, service_worker.location.origin).href;
            const windows = await service_worker.clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            });
            const ogs_window = windows.find(
                (client) => new URL(client.url).origin === service_worker.location.origin,
            );

            if (ogs_window) {
                await ogs_window.navigate(target);
                await ogs_window.focus();
            } else {
                await service_worker.clients.openWindow(target);
            }
        })(),
    );
});
