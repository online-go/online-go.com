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
import {Link} from "react-router-dom";
import {post} from "requests";
import {_, pgettext, interpolate} from "translate";
import * as data from "data";
import { parse } from 'query-string';

interface VerifyEmailProps {
    params: any;
    location: any;
}

interface VerifyEmailState {
    verifying: boolean;
    message: string;
}

export class VerifyEmail extends React.PureComponent<VerifyEmailProps, VerifyEmailState> {
    constructor(props) {
        super(props);
        this.state = {
            verifying: true,
            message: null,
        };
    }

    componentDidMount() {
        const q = parse(this.props.location.search);

        post("me/validateEmail", {
            id: q['id'],
            verification: q['v'],
        })
        .then(() => {
            this.setState({verifying: false, message: _("Great, your email address has been verified!")});
            const user = data.get('user');
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
