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
import { Link } from "react-router-dom";
import { Player } from "Player";
import { _ } from "translate";
import * as moment from "moment";
import { PaginatedTable } from "PaginatedTable";
import * as data from "data";
//import swal from "sweetalert2";

export function AppealsCenter(): JSX.Element {
    const user = data.get("user");
    const [hide_resolved, set_hide_resolved] = React.useState(true);

    React.useEffect(() => {}, []);

    if (!user.is_moderator) {
        return null;
    }

    return (
        <div id="AppealsCenter">
            <h1>
                Appeals Center
                <span>
                    <label htmlFor="hide_resolved">Hide Resolved</label>
                    <input
                        type="checkbox"
                        id="hide_resolved"
                        checked={hide_resolved}
                        onChange={(e) => set_hide_resolved(e.target.checked)}
                    />
                </span>
            </h1>
            <PaginatedTable
                className="appeals"
                name="appeals"
                source={`appeals`}
                filter={{ hide_resolved }}
                orderBy={["-updated"]}
                columns={[
                    {
                        header: _("Updated"),
                        className: () => "updated",
                        render: (X) => moment(new Date(X.updated)).format("YYYY-MM-DD HH:mm"),
                    },
                    {
                        header: _("Player"),
                        className: () => "state",
                        render: (X) => <Player user={X.banned_user} />,
                    },
                    {
                        header: _("State"),
                        className: () => "state",
                        render: (X) => X.state,
                    },
                    {
                        header: _("Ban Expiration"),
                        className: () => "ban_Expiration",
                        render: (X) => X.ban_expiration && moment(X.ban_expiration).fromNow(),
                    },
                    {
                        header: _(""),
                        className: () => "view",
                        render: (X) => <Link to={`/appeal/${X.banned_user.id}`}>{_("View")}</Link>,
                    },
                ]}
            />
        </div>
    );
}
