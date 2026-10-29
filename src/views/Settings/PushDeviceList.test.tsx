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

import * as React from "react";
import { fireEvent, render } from "@testing-library/react";
import * as requests from "@/lib/requests";
import * as webPush from "@/lib/web_push";

jest.mock("@/lib/requests", () => ({
    get: jest.fn(),
    del: jest.fn(() => Promise.resolve()),
}));
jest.mock("@/lib/web_push", () => ({
    webPushState: jest.fn(),
    currentWebPushEndpoint: jest.fn(),
    enableWebPush: jest.fn(() => Promise.resolve()),
    disableWebPush: jest.fn(() => Promise.resolve()),
    formFactor: jest.fn(() => "desktop"),
}));
jest.mock("@/lib/misc", () => ({ errorAlerter: jest.fn() }));

import { PushDeviceList } from "./PushDeviceList";

const ENDPOINT = "https://fcm.googleapis.com/fcm/send/abc123";
const mockedRequests = requests as jest.Mocked<typeof requests>;
const mockedWebPush = webPush as jest.Mocked<typeof webPush>;

test("removing this browser from the list turns push off here", async () => {
    let devices = [
        {
            id: 3,
            application: null,
            provider: "webpush",
            token: ENDPOINT,
            label: "Chrome on Linux",
            form_factor: "desktop",
            apns_environment: null,
            created_at: "2026-10-01T00:00:00Z",
            last_seen_at: "2026-10-29T00:00:00Z",
        },
    ];
    let on = true;
    mockedRequests.get.mockImplementation(() => Promise.resolve({ results: devices }));
    mockedRequests.del.mockImplementation(() => {
        devices = [];
        return Promise.resolve();
    });
    mockedWebPush.currentWebPushEndpoint.mockResolvedValue(ENDPOINT);
    mockedWebPush.webPushState.mockImplementation(() => Promise.resolve(on ? "on" : "off"));
    mockedWebPush.disableWebPush.mockImplementation(() => {
        on = false;
        return Promise.resolve();
    });

    const view = render(<PushDeviceList />);
    await view.findByText(/Push notifications are on in this browser/);
    fireEvent.click(await view.findByText("Remove"));

    await view.findByRole("button", { name: "Turn on push notifications in this browser" });
    expect(mockedRequests.del).toHaveBeenCalledWith("me/push_devices/3");
});
