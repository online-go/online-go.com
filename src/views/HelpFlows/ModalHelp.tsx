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

/* cspell: words groupadmin cotsen */

import * as React from "react";

import { HelpFlow, HelpItem } from "react-dynamic-help";

export function ModalHelp(): JSX.Element {
    return (
        <HelpFlow debug={true} id="modal-help" showInitially={true}>
            <HelpItem target="modal-help-intro" position="bottom-left">
                <div>test</div>
            </HelpItem>
        </HelpFlow>
    );
}
