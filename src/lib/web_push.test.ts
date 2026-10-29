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

import * as data from "@/lib/data";
import { post } from "@/lib/requests";
import { refreshWebPush, webPushState } from "./web_push";

jest.mock("@/lib/requests", () => ({
    post: jest.fn(),
    del: jest.fn(),
}));

const ENDPOINT = "https://fcm.googleapis.com/fcm/send/abc123";
const IPHONE_SAFARI =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const original_user_agent = navigator.userAgent;

let subscription: {
    endpoint: string;
    unsubscribe: jest.Mock;
    toJSON: () => { endpoint: string; keys: { p256dh: string; auth: string } };
} | null;

function defineGlobal(target: object, name: string, value: unknown) {
    Object.defineProperty(target, name, { configurable: true, writable: true, value });
}

function installPushSupport() {
    subscription = {
        endpoint: ENDPOINT,
        unsubscribe: jest.fn(async () => {
            subscription = null;
            return true;
        }),
        toJSON: () => ({ endpoint: ENDPOINT, keys: { p256dh: "p256dh-key", auth: "auth-key" } }),
    };
    const registration = {
        pushManager: { getSubscription: jest.fn(async () => subscription) },
    };
    defineGlobal(navigator, "serviceWorker", {
        getRegistration: jest.fn(async () => registration),
    });
    defineGlobal(window, "PushManager", function PushManager() {});
    defineGlobal(window, "Notification", { permission: "granted" });
}

function installMatchMedia(matches: boolean) {
    defineGlobal(
        window,
        "matchMedia",
        jest.fn((query: string) => ({ matches, media: query })),
    );
}

function signInAs(id: number) {
    data.set("config.user", {
        id,
        anonymous: false,
        username: `player${id}`,
    } as rest_api.UserConfig);
}

function rememberPlayers(ids: number[]) {
    localStorage.setItem("web-push-players", JSON.stringify(ids));
}

beforeEach(() => {
    jest.mocked(post).mockReset();
    localStorage.clear();
    data.set(
        "config.vapid_public_key",
        "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
    );
    installPushSupport();
    installMatchMedia(false);
});

afterEach(() => {
    defineGlobal(navigator, "userAgent", original_user_agent);
    delete (navigator as { serviceWorker?: unknown }).serviceWorker;
    delete (window as { PushManager?: unknown }).PushManager;
    delete (window as { Notification?: unknown }).Notification;
    delete (window as { matchMedia?: unknown }).matchMedia;
});

test("refresh of a browser the server no longer holds turns push off", async () => {
    signInAs(1);
    rememberPlayers([1]);
    const unsubscribe = subscription!.unsubscribe;
    jest.mocked(post).mockRejectedValueOnce({ error: "not registered" });

    await refreshWebPush();

    expect(post).toHaveBeenCalledWith(
        "me/push_devices",
        expect.objectContaining({ provider: "webpush", token: ENDPOINT, opt_in: false }),
    );
    expect(unsubscribe).toHaveBeenCalled();
    expect(await webPushState()).toBe("off");
});

test("another player on the same browser does not inherit push", async () => {
    signInAs(2);
    rememberPlayers([1]);

    await refreshWebPush();

    expect(post).not.toHaveBeenCalled();
    expect(await webPushState()).toBe("off");
});

test("iOS Safari outside the home screen needs the home screen", async () => {
    signInAs(1);
    defineGlobal(navigator, "userAgent", IPHONE_SAFARI);
    delete (window as { PushManager?: unknown }).PushManager;

    expect(await webPushState()).toBe("needs-home-screen");
});
