/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import swal from "sweetalert2";
import { post } from "requests";
import { errorAlerter } from "misc";

export function BlockedVPN(): JSX.Element {
    const [vpn, setVPN] = React.useState("");

    function submit() {
        post("/firewall/report_vpn", { vpn_name: vpn })
            .then(() =>
                swal(
                    "Thank you",
                    `Thank you for letting us know! You can sign up by disabling your VPN. Once you've signed up, you can turn your VPN back on to play on the site.`,
                ).catch(swal.noop),
            )
            .catch(errorAlerter);
    }

    return (
        <div className="BlockedVPN">
            Hello!
            <p>
                Thank you for registering an account with online-go.com. Unfortunately, there has
                been a problem with your VPN in recent days.
            </p>
            <p>
                Due to abuse linked with your VPN, the VPN has been temporarily disabled, and the
                user registration will not be completed. We are currently working to obtain logs
                from the VPN company to isolate the abuse and re-enable use of this VPN. You can
                help speed up this process by letting us know what VPN service you are using:
            </p>
            <p className="collect">
                <input
                    value={vpn}
                    placeholder={"VPN Provider name"}
                    onChange={(ev) => setVPN(ev.target.value)}
                />
                <button onClick={submit}>Submit</button>
            </p>
            <p>Thank you in advance for your cooperation in helping us resolve this issue.</p>
            <p>
                If you still cannot access online-go.com after disabling your VPN, please contact us
                at <a href="mailto:contact@online-go.com">contact@online-go.com</a>
            </p>
        </div>
    );
}
