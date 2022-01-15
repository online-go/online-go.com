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
import { browserHistory } from "ogsHistory";
import { Modal, openModal } from "Modal";
import { _ } from "translate";
//import {SiteSupporterText} from "./Supporter";
import { Supporter } from "./Supporter";

export class BecomeASiteSupporterModal extends Modal<{}, {}, any> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="Modal BecomeASiteSupporterModal" ref="modal">
                <div className="header">
                    <h2>{_("Become a site supporter today!")}</h2>
                </div>
                <div className="body">
                    <Supporter inline={true} />
                </div>

                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                </div>
            </div>
        );
    }

    becomeASiteSupporter = () => {
        browserHistory.push("/user/supporter");
        this.close();
    };
}

export function openBecomeASiteSupporterModal() {
    openModal(<BecomeASiteSupporterModal fastDismiss={true} />);
}
