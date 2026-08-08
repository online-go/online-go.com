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

export interface VapidPublicKeyResponse {
    vapid_public_key: string;
}

export interface WebPushSubscriptionKeys {
    p256dh: string;
    auth: string;
}

export interface WebPushSubscription {
    endpoint: string;
    keys: WebPushSubscriptionKeys;
}

export interface PushPreferences {
    turn: boolean;
    time: boolean;
    challenge: boolean;
}

type PushApiMethod = "GET" | "POST" | "DELETE" | "PUT";
type PushApiPath =
    | "/api/v1/push/config"
    | "/api/v1/push/subscriptions"
    | "/api/v1/push/preferences";
type PushApiPayload = WebPushSubscription | PushPreferences | undefined;
type PushApiResponse = VapidPublicKeyResponse | WebPushSubscription | PushPreferences | undefined;

const MOCK_LATENCY_MS = 100;
const MOCK_VAPID_PUBLIC_KEY = "BMockWebPushVapidPublicKeyForDevelopmentOnly0123456789abcdef";

let mockSubscription: WebPushSubscription | undefined;
let mockPreferences: PushPreferences = {
    turn: false,
    time: false,
    challenge: false,
};

function waitForMockNetwork(): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, MOCK_LATENCY_MS);
    });
}

async function mockRequest(
    method: PushApiMethod,
    path: PushApiPath,
    payload?: PushApiPayload,
): Promise<PushApiResponse> {
    await waitForMockNetwork();

    if (method === "GET" && path === "/api/v1/push/config") {
        return { vapid_public_key: MOCK_VAPID_PUBLIC_KEY };
    }

    if (method === "POST" && path === "/api/v1/push/subscriptions") {
        mockSubscription = payload as WebPushSubscription;
        return mockSubscription;
    }

    if (method === "DELETE" && path === "/api/v1/push/subscriptions") {
        mockSubscription = undefined;
        return undefined;
    }

    if (method === "PUT" && path === "/api/v1/push/preferences") {
        mockPreferences = payload as PushPreferences;
        return mockPreferences;
    }

    throw new Error(`Unsupported Web Push mock endpoint: ${method} ${path}`);
}

export interface WebPushApi {
    getConfig(): Promise<VapidPublicKeyResponse>;
    saveSubscription(subscription: WebPushSubscription): Promise<WebPushSubscription>;
    deleteSubscription(): Promise<void>;
    updatePreferences(preferences: PushPreferences): Promise<PushPreferences>;
}

export const mockWebPushApi: WebPushApi = {
    async getConfig(): Promise<VapidPublicKeyResponse> {
        return (await mockRequest("GET", "/api/v1/push/config")) as VapidPublicKeyResponse;
    },

    async saveSubscription(subscription: WebPushSubscription): Promise<WebPushSubscription> {
        return (await mockRequest(
            "POST",
            "/api/v1/push/subscriptions",
            subscription,
        )) as WebPushSubscription;
    },

    async deleteSubscription(): Promise<void> {
        await mockRequest("DELETE", "/api/v1/push/subscriptions");
    },

    async updatePreferences(preferences: PushPreferences): Promise<PushPreferences> {
        return (await mockRequest(
            "PUT",
            "/api/v1/push/preferences",
            preferences,
        )) as PushPreferences;
    },
};
