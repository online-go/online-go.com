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

import { _ } from "translate";

import { browserHistory } from "ogsHistory";
// import { useUser } from "hooks";

import { Card } from "material";

const HELP_SET = "new-user-help-set";
const ITEM = "new-user-welcome";

export function NewUserWelcome(): JSX.Element {
    //const user = useUser();

    const visibility = dynamic_help.isVisible(HELP_SET, ITEM); // eventually: && !user.email_validated;

    const [show_self, setShowSelf] = React.useState<boolean>(visibility);

    const close = (e) => {
        dynamic_help.hideHelpSetItem(HELP_SET, ITEM);
        setShowSelf(false);
        e.stopPropagation();
    };

    const viewSettings = () => {
        browserHistory.push("/user/settings");
    };

    // we have to allow for the settings changing while we are mounted, yet also be able to
    // turn ourselves off...
    if (show_self !== visibility) {
        setShowSelf(visibility);
    }

    return (
        <>
            {(show_self || null) && (
                <div className="EmailBanner-container">
                    <Card className="EmailBanner">
                        <i className="fa fa-times" onClick={close} />
                        {_(
                            "Welcome to OGS! Feel free to start playing games. In an effort to reduce spam and limit trolls, chat is disabled for all users until their email address has been validated. To validate your email address, simply click the activation link that has been sent to you.",
                        )}
                        <br />
                        <br />
                        {_(
                            "You can visit the settings page to update your email address or resend the validation email.",
                        )}
                        <button className="primary" onClick={viewSettings}>
                            {_("Go to settings")} &rarr;
                        </button>
                    </Card>
                </div>
            )}
        </>
    );
}
