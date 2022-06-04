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

import * as dynamic_help from "dynamic_help_config";

import { _ /*pgettext*/ } from "translate";

export function SettingsButtonHelp(): JSX.Element {
    return (
        <>
            {(dynamic_help.isVisible("guest-password-help-set", "settings-button-help") ||
                null) && (
                <div className="settings-button-help">
                    <i className="fa fa-arrow-up" />
                    <span>{_("To set your password, click here")}</span>
                </div>
            )}
        </>
    );
}
