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
import * as data from "data";
import { _ } from "translate";
import { Card } from "material";
import { errorAlerter } from "misc";
import { put } from "requests";
import { cached } from "cached";

export function ForceUsernameChange(): JSX.Element {
    const user = data.get("config.user");
    const [username, setUsername] = React.useState("");
    const inputRef = React.useRef();

    React.useEffect(() => {
        const ir: any = inputRef as any;
        if (ir?.current?.focus) {
            ir.current.focus();
        }
    });

    function saveUsername() {
        put("players/%%", user.id, { username })
            .then((res) => {
                cached.refresh.config(() => window.location.reload());
            })
            .catch(errorAlerter);
    }

    return (
        <div id="ForceUsernameChange-container">
            <div id="ForceUsernameChange">
                <div>
                    <Card>
                        <h2>{_("Welcome to Online-Go.com!")}</h2>
                        <h4>
                            {_(
                                "Please enter a username to continue. This name is what other players will know you by.",
                            )}
                        </h4>

                        <input
                            type="text"
                            name="username"
                            placeholder={_("Username")}
                            onChange={(ev) => setUsername(ev.target.value)}
                            ref={inputRef}
                        />
                        <button
                            className="primary"
                            disabled={username.length < 3}
                            onClick={saveUsername}
                        >
                            Continue
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
