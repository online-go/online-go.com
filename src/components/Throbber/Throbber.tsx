/*
 * Copyright (C) 2012-2017  Online-Go.com
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

 /* From https://loading.io/css/ */

import * as React from "react";


interface ThrobberProps {
    throb: boolean;
}

export class Throbber extends React.PureComponent<ThrobberProps, any> {

    throb_delay_timer: any;

    constructor(props) {
        super(props);
        this.state = {
            throbbing: this.props.throb
        };
    }

    turnOnThrob = () => {
        // console.log("turning on throb");
        this.setState({throbbing: true});
    }

    componentDidUpdate = (prevProps, prevState) => {
        // console.log("throb request", this.props.throb);
        if (this.props.throb) {
            if (!prevState.throbbing) {
                this.throb_delay_timer = setTimeout(this.turnOnThrob , 150);
            }
        }
        else {
            clearTimeout(this.throb_delay_timer);
            this.setState({throbbing: false});
        }
    }

    render = () => {
        return (
            <div className={"throbber" + (this.state.throbbing ? "" :" throbber-off")}>
                <div className="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
          </div>
        );
    }
}

