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

import * as React from "react";
import {Link} from "react-router";
import {post} from "requests";
import {_, pgettext, interpolate} from "translate";
import data from "data";

declare var swal;

interface VerifyEmailProps {
    params: any;
    location: any;
}

export class VerifyEmail extends React.PureComponent<VerifyEmailProps, any> {
    constructor(props) {
        super(props);
        this.state = {
            verifying: true,
            message: null,
        };
    }

    componentDidMount() {
        post("me/validateEmail", {
            id: this.props.location.query.id,
            verification: this.props.location.query.v,
        })
        .then(() => {
            this.setState({verifying: false, message: _("Great, your email address has been verified!")});
            let user = data.get('user');
            user.email_validated = new Date().toString();
            data.set('user', user);
        })
        .catch((err) => {
            this.setState({verifying: false, message: JSON.parse(err.responseText).error});
        });
    }

    render() {
        return (
            <div className='VerifyEmail'>
                <h3>
                    {this.state.verifying &&
                        <div>
                            {_("Verifying...")}
                        </div>
                    }
                    {this.state.message &&
                        <div>{this.state.message}</div>
                    }
                </h3>
            </div>
        );
    }
}
