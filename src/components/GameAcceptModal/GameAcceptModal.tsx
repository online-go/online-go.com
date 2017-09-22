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
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {openModal, Modal} from "Modal";
import {timeControlDescription} from "TimeControl";
import {Player} from "Player";
import {errorAlerter} from "misc";

declare var swal;

interface Events {
}

interface GameAcceptModalProperties {
    challenge: any;
    onAccept: (challenge) => void;
    // id?: any,
    // user?: any,
    // callback?: ()=>any,
}


export class GameAcceptModal extends Modal<Events, GameAcceptModalProperties, {}> {
    constructor(props) {
        super(props);
    }

    accept = () => {{{
        swal({
            text: "Accepting...",
            type: "info",
            showCancelButton: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        });

        post("challenges/%%/accept", this.props.challenge.challenge_id, {})
        .then(() => {
            swal.close();
            this.close();
            this.props.onAccept(this.props.challenge);
        })
        .catch((err) => {
            swal.close();
            errorAlerter(err);
        });
    }}}

    render() {
        let challenge = this.props.challenge;
        let time_control_description = timeControlDescription(challenge.time_control_parameters);
        let player_color = _(challenge.challenger_color);

        console.log(challenge);

        if (challenge.challenger_color === "black")          { player_color = _("White");     }
        else if (challenge.challenger_color === "white")     { player_color = _("Black");     }
        else if (challenge.challenger_color === "automatic") { player_color = _("Automatic"); }
        else if (challenge.challenger_color === "random")    { player_color = _("Random");    }

        return (
          <div className="Modal GameAcceptModal" ref="modal">
              <div className="header">
                  <div>
                      <h2>
                          <Player icon iconSize={32} user={challenge} using_cache/>
                      </h2>
                      <h4>
                          {challenge.name}
                      </h4>
                  </div>
              </div>
              <div className="body">
                <p>{time_control_description}</p>
                <hr/>
                <dl className="horizontal">
                  <dt>{_("Your color")}</dt><dd>{player_color}</dd>
                  <dt>{_("Ranked")}</dt><dd>{challenge.ranked ? _("Yes") : _("No")}</dd>
                  <dt>{_("Handicap")}</dt><dd>{handicapText(challenge.handicap)}</dd>
                  <dt>{_("Komi")}</dt><dd>{challenge.komi || _("Automatic")}</dd>
                  <dt>{_("Board Size")}</dt><dd>{challenge.width}x{challenge.height}</dd>
                  <dt>{_("In-game analysis")}</dt><dd>{yesno(!challenge.disable_analysis)}</dd>
                      {(challenge.time_per_move > 3600 || null) && <dt>{_("Pause on weekends")}</dt>}
                      {(challenge.time_per_move > 3600 || null) && <dd>{yesno(challenge.time_control_parameters.pause_on_weekends)}</dd>}
                </dl>
              </div>
              <div className="buttons">
                  <button onClick={this.close}>{_("Close")}</button>
                  <button onClick={this.accept} className="primary">{_("Accept Game")}</button>
              </div>
          </div>
        );
    }
}


export function openGameAcceptModal(challenge): Promise<any> {
    console.log(challenge);

    return new Promise((resolve, reject) => {
        openModal(<GameAcceptModal challenge={challenge} onAccept={resolve} fastDismiss />);
    });
}

export function handicapText(handicap) { /* {{{ */
    if (handicap < 0)   { return _("Auto"); }
    if (handicap === 0) { return _("None"); }
    return handicap;
} /* }}} */
function yesno(tf: boolean) {{{
    return tf ? _("Yes") : _("No");
}}}

