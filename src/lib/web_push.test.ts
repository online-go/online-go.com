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
import { del, post } from "@/lib/requests";
import { current_language } from "@/lib/translate";
import {
    disableWebPush,
    enableWebPush,
    formFactor,
    pauseWebPush,
    refreshWebPush,
    webPushState,
} from "./web_push";

jest.mock("@/lib/requests", () => ({
    post: jest.fn(),
    del: jest.fn(),
}));

const ENDPOINT = "https://fcm.googleapis.com/fcm/send/abc123";
const NEW_ENDPOINT = "https://fcm.googleapis.com/fcm/send/def456";
const IPHONE_SAFARI =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPADOS_SAFARI =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const original_user_agent = navigator.userAgent;

let subscription: {
    endpoint: string;
    unsubscribe: jest.Mock;
    toJSON: () => { endpoint: string; keys: { p256dh: string; auth: string } };
} | null;

let subscribe: jest.Mock;

function defineGlobal(target: object, name: string, value: unknown) {
    Object.defineProperty(target, name, { configurable: true, writable: true, value });
}

function makeSubscription(endpoint: string) {
    return {
        endpoint,
        unsubscribe: jest.fn(async () => {
            subscription = null;
            return true;
        }),
        toJSON: () => ({ endpoint, keys: { p256dh: "p256dh-key", auth: "auth-key" } }),
    };
}

function installPushSupport() {
    subscription = makeSubscription(ENDPOINT);
    subscribe = jest.fn(async () => {
        subscription = makeSubscription(NEW_ENDPOINT);
        return subscription;
    });
    const registration = {
        pushManager: { getSubscription: jest.fn(async () => subscription), subscribe },
    };
    defineGlobal(navigator, "serviceWorker", {
        getRegistration: jest.fn(async () => registration),
        register: jest.fn(async () => registration),
        ready: Promise.resolve(registration),
    });
    defineGlobal(window, "PushManager", function PushManager() {});
    defineGlobal(window, "Notification", {
        permission: "granted",
        requestPermission: jest.fn(async () => "granted"),
    });
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

function rememberPlayers(ids: number[], endpoint = ENDPOINT) {
    localStorage.setItem("web-push-players", JSON.stringify(ids));
    localStorage.setItem("web-push-endpoint", endpoint);
}

beforeEach(() => {
    jest.mocked(post).mockReset();
    jest.mocked(del).mockReset();
    jest.mocked(del).mockResolvedValue(undefined);
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
    delete (navigator as { maxTouchPoints?: unknown }).maxTouchPoints;
    delete (navigator as { userAgentData?: unknown }).userAgentData;
    delete (navigator as { serviceWorker?: unknown }).serviceWorker;
    delete (navigator as { language?: unknown }).language;
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
    const unsubscribe = subscription!.unsubscribe;

    await refreshWebPush();

    expect(post).not.toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalled();
    expect(await webPushState()).toBe("off");
});

test("turning push off unsubscribes this browser before the server has answered", async () => {
    signInAs(1);
    rememberPlayers([1]);
    const unsubscribe = subscription!.unsubscribe;
    jest.mocked(del).mockReturnValueOnce(new Promise(() => {}));

    void disableWebPush();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(unsubscribe).toHaveBeenCalled();
    expect(del).toHaveBeenCalledWith(`me/push_devices?token=${encodeURIComponent(ENDPOINT)}`);
});

test("signing out stops the server pushing here, and signing back in starts it again without a click", async () => {
    signInAs(1);
    rememberPlayers([1]);
    const unsubscribe = subscription!.unsubscribe;

    await pauseWebPush();

    expect(del).toHaveBeenCalledWith(`me/push_devices?token=${encodeURIComponent(ENDPOINT)}`);
    expect(unsubscribe).not.toHaveBeenCalled();

    await refreshWebPush();

    expect(subscribe).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledWith(
        "me/push_devices",
        expect.objectContaining({ token: ENDPOINT, opt_in: true }),
    );
    expect(await webPushState()).toBe("on");

    /* The pause ended with that sign in, so later page loads only refresh */
    await refreshWebPush();
    expect(post).toHaveBeenLastCalledWith(
        "me/push_devices",
        expect.objectContaining({ opt_in: false }),
    );
});

test("a sign out the server does not answer still stops pushes here, and signing in subscribes again", async () => {
    signInAs(1);
    rememberPlayers([1]);
    const unsubscribe = subscription!.unsubscribe;
    jest.mocked(del).mockRejectedValueOnce(new Error("offline"));

    await pauseWebPush();

    expect(unsubscribe).toHaveBeenCalled();

    await refreshWebPush();

    expect(subscribe).toHaveBeenCalled();
    expect(post).toHaveBeenCalledWith(
        "me/push_devices",
        expect.objectContaining({ token: NEW_ENDPOINT, opt_in: true }),
    );
    expect(await webPushState()).toBe("on");
});

test("a sign out the server never answers still stops pushes here", async () => {
    jest.useFakeTimers();
    try {
        signInAs(1);
        rememberPlayers([1]);
        const unsubscribe = subscription!.unsubscribe;
        jest.mocked(del).mockReturnValueOnce(new Promise(() => {}));

        const pause = pauseWebPush();
        await jest.advanceTimersByTimeAsync(10000);
        await pause;

        expect(unsubscribe).toHaveBeenCalled();
    } finally {
        jest.useRealTimers();
    }
});

test("a sign out that never finishes leaves the next player unable to inherit push", async () => {
    signInAs(1);
    rememberPlayers([1]);
    const unsubscribe = subscription!.unsubscribe;
    jest.mocked(del).mockReturnValueOnce(new Promise(() => {}));

    void pauseWebPush();
    await new Promise((resolve) => setTimeout(resolve, 0));

    signInAs(2);
    await refreshWebPush();

    expect(unsubscribe).toHaveBeenCalled();
});

test("a player who never opted in has nothing to pause or resume", async () => {
    signInAs(1);

    await pauseWebPush();
    await refreshWebPush();

    expect(del).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
    expect(await webPushState()).toBe("off");
});

test("turning push off stays off after signing out and back in", async () => {
    signInAs(1);
    rememberPlayers([1]);
    await pauseWebPush();
    await refreshWebPush();

    await disableWebPush();
    await pauseWebPush();
    await refreshWebPush();

    expect(subscribe).not.toHaveBeenCalled();
    expect(await webPushState()).toBe("off");
});

test("a player's push comes back after another player signed in on the same browser", async () => {
    signInAs(1);
    rememberPlayers([1]);
    signInAs(2);
    await refreshWebPush();
    expect(await webPushState()).toBe("off");
    expect(post).not.toHaveBeenCalled();

    signInAs(1);
    await refreshWebPush();

    expect(subscribe).toHaveBeenCalled();
    expect(post).toHaveBeenCalledWith(
        "me/push_devices",
        expect.objectContaining({ token: NEW_ENDPOINT, opt_in: true }),
    );
    expect(await webPushState()).toBe("on");
});

test("two players who both opted in get push on the browser while they are signed in", async () => {
    signInAs(1);
    rememberPlayers([1]);
    await pauseWebPush();

    signInAs(2);
    await refreshWebPush();
    expect(post).not.toHaveBeenCalled();
    await enableWebPush();
    expect(await webPushState()).toBe("on");
    await pauseWebPush();

    signInAs(1);
    await refreshWebPush();
    expect(post).toHaveBeenLastCalledWith(
        "me/push_devices",
        expect.objectContaining({ opt_in: true }),
    );
    expect(await webPushState()).toBe("on");

    signInAs(2);
    expect(await webPushState()).toBe("off");
    await refreshWebPush();
    expect(post).toHaveBeenLastCalledWith(
        "me/push_devices",
        expect.objectContaining({ opt_in: true }),
    );
    expect(await webPushState()).toBe("on");
});

test("push that cannot restart without a click waits for the player to turn it on", async () => {
    signInAs(1);
    rememberPlayers([1]);
    jest.mocked(del).mockRejectedValueOnce(new Error("offline"));
    await pauseWebPush();
    subscribe.mockRejectedValueOnce(new DOMException("needs a gesture", "NotAllowedError"));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    await refreshWebPush();

    expect(post).not.toHaveBeenCalled();
    expect(await webPushState()).toBe("off");

    await enableWebPush();

    expect(await webPushState()).toBe("on");
    warn.mockRestore();
});

test("a browser that has lost notification permission does not restart push", async () => {
    signInAs(1);
    rememberPlayers([1]);
    jest.mocked(del).mockRejectedValueOnce(new Error("offline"));
    await pauseWebPush();
    defineGlobal(window, "Notification", { permission: "default" });

    await refreshWebPush();

    expect(subscribe).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
});

test("a subscription the browser rotated is registered again as opted in", async () => {
    signInAs(1);
    rememberPlayers([1], "https://fcm.googleapis.com/fcm/send/old");

    await refreshWebPush();
    await refreshWebPush();

    expect(jest.mocked(post).mock.calls.map((call) => call[1])).toEqual([
        expect.objectContaining({ token: ENDPOINT, opt_in: true }),
        expect.objectContaining({ token: ENDPOINT, opt_in: false }),
    ]);
});

test("a browser's subscription carries the language the site is shown in, so its pushes can be written in it", async () => {
    signInAs(1);
    rememberPlayers([1], "https://fcm.googleapis.com/fcm/send/old");
    defineGlobal(navigator, "language", "de-DE");

    await refreshWebPush();
    await refreshWebPush();

    expect(jest.mocked(post).mock.calls.map((call) => call[1])).toEqual([
        expect.objectContaining({ opt_in: true, language: current_language }),
        expect.objectContaining({ opt_in: false, language: current_language }),
    ]);
});

test("iOS Safari outside the home screen needs the home screen", async () => {
    signInAs(1);
    defineGlobal(navigator, "userAgent", IPHONE_SAFARI);
    delete (window as { PushManager?: unknown }).PushManager;

    expect(await webPushState()).toBe("needs-home-screen");
});

test("an Android tablet is a mobile device though it reports itself as not mobile", () => {
    defineGlobal(navigator, "userAgentData", { mobile: false, platform: "Android" });

    expect(formFactor()).toBe("mobile");
});

test("an iPad is a mobile device though it reports a Mac user agent", () => {
    defineGlobal(navigator, "userAgent", IPADOS_SAFARI);
    defineGlobal(navigator, "maxTouchPoints", 5);

    expect(formFactor()).toBe("mobile");
});
