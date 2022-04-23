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

import * as data from "data";
import { parse } from "query-string";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { post } from "requests";
import { _ } from "translate";

export function VerifyEmail() {
    const location = useLocation();
    const [verifying, setVerifying] = React.useState(true);
    const [message, setMessage] = React.useState<string>();

    React.useEffect(() => {
        const q = parse(location.search);

        post("me/validateEmail", {
            id: q["id"],
            verification: q["v"],
        })
            .then(() => {
                setVerifying(false);
                setMessage(_("Great, your email address has been verified!"));
                const user = data.get("user");
                user.email_validated = new Date().toString();
                data.set("user", user);
            })
            .catch((err) => {
                setVerifying(false);
                setMessage(JSON.parse(err.responseText).error);
            });
    }, [location.search]);

    return (
        <div className="VerifyEmail">
            <h3>
                {verifying && <div>{_("Verifying...")}</div>}
                {message && <div>{message}</div>}
            </h3>
        </div>
    );
}
