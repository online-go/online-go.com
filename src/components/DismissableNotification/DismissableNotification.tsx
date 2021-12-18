/*
 * Copyright (C) 2012-2020  Online-Go.com
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


interface DismissableNotificationProperties {
    dismissedKey: string;
    className?: string;
}

interface DismissableNotificationState {
    dismissed: boolean;
}

export class DismissableNotification extends React.Component<DismissableNotificationProperties, DismissableNotificationState> {
    constructor(props: DismissableNotificationProperties) {
        super(props);
        this.state = {
            dismissed: data.get(`dismissed.${props.dismissedKey}`, false)
        };
    }

    dismiss = () => {
        data.set(`dismissed.${this.props.dismissedKey}`, true);
        this.setState({ dismissed: true });
    };

    render() {
        if (this.state.dismissed) {
            return null;
        }

        return (
            <div className={"DismissableNotification " + (this.props.className || "")}>
                <i className='fa fa-times' onClick={this.dismiss} />
                {this.props.children}
            </div>
        );
    }
}
