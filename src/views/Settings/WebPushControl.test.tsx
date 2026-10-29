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
import { fireEvent, render, waitFor } from "@testing-library/react";
import * as webPush from "@/lib/web_push";

jest.mock("@/lib/web_push", () => ({
    webPushState: jest.fn(),
    enableWebPush: jest.fn(() => Promise.resolve()),
    disableWebPush: jest.fn(() => Promise.resolve()),
    formFactor: jest.fn(() => "desktop"),
}));
jest.mock("@/lib/misc", () => ({ errorAlerter: jest.fn() }));

import { WebPushControl } from "./WebPushControl";

const mocked = webPush as jest.Mocked<typeof webPush>;
const app = (name: string, provider: "apns" | "fcm") => ({
    id: 1,
    provider,
    application: { id: 1, name },
});

beforeEach(() => jest.clearAllMocks());

test.each([
    ["on", /Push notifications are on in this browser/],
    ["off", /Turn on push notifications in this browser/],
    ["blocked", /Your browser is blocking notifications from OGS/],
    ["unsupported", /This browser can't receive push notifications/],
    ["needs-home-screen", /add OGS to your home screen/],
] as const)("each browser state shows its message: %s", async (state, message) => {
    mocked.webPushState.mockResolvedValue(state);
    const view = render(<WebPushControl devices={[]} onChange={() => 0} />);
    await view.findByText(message);
});

test("a phone with a native app is warned before turning on", async () => {
    mocked.webPushState.mockResolvedValue("off");
    mocked.formFactor.mockReturnValue("mobile");
    const view = render(
        <WebPushControl
            devices={[app("Online-Go.com", "apns"), app("OGS Beta", "fcm")] as any}
            onChange={() => 0}
        />,
    );
    await view.findByText(
        "You already get notifications through Online-Go.com, OGS Beta on a mobile device. Turning this on too will double them up.",
    );
});

test("a desktop browser is not warned about native apps", async () => {
    mocked.webPushState.mockResolvedValue("off");
    mocked.formFactor.mockReturnValue("desktop");
    const view = render(
        <WebPushControl devices={[app("Online-Go.com", "apns")] as any} onChange={() => 0} />,
    );
    await view.findByText(/Turn on push notifications in this browser/);
    expect(view.queryByText(/double them up/)).toBeNull();
});

test("turning on refreshes the device list", async () => {
    mocked.webPushState.mockResolvedValue("off");
    const onChange = jest.fn();
    const view = render(<WebPushControl devices={[]} onChange={onChange} />);
    fireEvent.click(await view.findByText(/Turn on push notifications in this browser/));
    expect(mocked.enableWebPush).toHaveBeenCalled();
    await waitFor(() => expect(onChange).toHaveBeenCalled());
});
