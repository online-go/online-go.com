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

import type { Challenge } from "./Play";
import { alert } from "swal_config";
import { put } from "requests";
import { errorAlerter } from "misc";
import { _ } from "translate";

// This is used by the SeekGraph to perform this function as well as this page...
export function nominateForRengoChallenge(C: Challenge) {
    void alert.fire({
        text: _("Joining..."), // translator: the server is processing their request to join a rengo game
        icon: "info",
        showCancelButton: false,
        showConfirmButton: false,
        allowEscapeKey: false,
    });

    put("challenges/%%/join", C.challenge_id, {})
        .then(() => {
            alert.close();
        })
        .catch((err: any) => {
            alert.close();
            errorAlerter(err);
        });
}
