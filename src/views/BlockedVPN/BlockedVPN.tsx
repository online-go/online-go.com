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
                Unfortunately there has been a problem with a particularly abusive user using the
                same VPN as you.
            </p>
            <p>
                We have isolated the VPN to a small handful of datacenters that they use, and are
                working towards isolating the VPN company from that so that we may begin the process
                of obtaining logs to track down the user, however that process can be expedited if
                you help us by letting us know what VPN service you are using.
            </p>
            <p className="collect">
                <input
                    value={vpn}
                    placeholder={"VPN Provider name"}
                    onChange={(ev) => setVPN(ev.target.value)}
                />
                <button onClick={submit}>Submit</button>
            </p>
            <p>
                Thank you in advance for your cooperation in helping us take action against this
                vile individual.
            </p>
            <p>
                If you have futher trouble accessing the site after you've disabled your VPN, you
                can contact us at <a href="mailto:contact@online-go.com">contact@online-go.com</a>
            </p>
        </div>
    );
}
