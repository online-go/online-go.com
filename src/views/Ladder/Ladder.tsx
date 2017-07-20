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
import {del, get, post} from "requests";
import {errorAlerter} from "misc";
import {_, pgettext, interpolate} from "translate";
import {LadderComponent} from "LadderComponent";
import {Card} from "material";
import {AdUnit} from "AdUnit";
import * as data from "data";
import {is_registered} from "data/Player";

declare var swal;

interface LadderProperties {
    params: any;
}

export class Ladder extends React.PureComponent<LadderProperties, any> {
    refs: {
        ladder_component
    };

    constructor(props) {
        super(props);
        this.state = {
            ladder: null
        };
    }

    componentDidMount() {
        this.resolve(this.props.params.ladder_id);
    }

    componentWillReceiveProps(next_props) {
        if (this.props.params.ladder_id !== next_props.params.ladder_id) {
            this.resolve(next_props.params.ladder_id);
        }
    }

    resolve(ladder_id) {
        get("ladders/%%", ladder_id)
        .then((ladder) => this.setState({ladder: ladder}))
        .catch(errorAlerter);
    }

    join = () => {
        post("ladders/%%/players", this.props.params.ladder_id, {})
        .then(() => {
            this.resolve(this.props.params.ladder_id);
            this.refs.ladder_component.updatePlayers();
        })
        .catch(errorAlerter);
    }

    leave = () => {
        swal({
            "text": _("Are you sure you want to withdraw from the ladder? If you decide to rejoin the ladder in the future you will have to start from the bottom!"),
            "showCancelButton": true,
            "confirmButtonText": _("Yes"),
            "cancelButtonText": _("No"),
            "focusCancel": true
        })
        .then(() => {
            del("ladders/%%/players", this.props.params.ladder_id)
            .then(() => {
                this.resolve(this.props.params.ladder_id);
                this.refs.ladder_component.updatePlayers();
            })
            .catch(errorAlerter);
        })
        .catch(() => 0);
    }


    render() {
        let user = data.get("user");

        return (
        <div>
            <AdUnit unit="cdm-zone-01" nag/>
            <div className="Ladder">
                <Card>
                    <h2>{this.state.ladder && this.state.ladder.name}</h2>
                    <div className="actions">
                        {(this.state.ladder && this.state.ladder.player_rank > 0)
                          ? <button onClick={this.leave}>{_("Drop out from ladder")}</button>
                          : <button className="primary" disabled={!is_registered(user)} onClick={this.join}>{_("Join Ladder")}</button>
                        }
                    </div>

                    <LadderComponent
                        ref="ladder_component"
                        ladderId={this.props.params.ladder_id}
                        fullView
                        />
                </Card>
            </div>
        </div>
        );
    }
}
