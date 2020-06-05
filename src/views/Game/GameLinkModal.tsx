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
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {openModal, Modal} from "Modal";
import {timeControlDescription} from "TimeControl";
import {Goban} from "goban";
import {Player} from "Player";
import {errorAlerter, rulesText} from "misc";
import {handicapText} from "GameAcceptModal";

interface Events {
}

interface GameLinkModalProperties {
    goban: Goban;
}


export class GameLinkModal extends Modal<Events, GameLinkModalProperties, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        const goban = this.props.goban;
        let sgf_url;
        if (goban.game_id) {
            sgf_url = window.location.protocol + "//" + window.location.hostname + `/api/v1/games/${goban.game_id}/sgf`;
        } else {
            sgf_url = window.location.protocol + "//" + window.location.hostname + `/api/v1/reviews/${goban.review_id}/sgf`;
        }

        return (
          <div className="Modal GameLinkModal" ref="modal">
              <div className="header">
                  <div>
                      <h2>
                          {goban.engine.config.game_name}
                      </h2>
                      <h3>
                          <Player disableCacheUpdate icon rank user={goban.engine.config.players.black} /> {
                              _("vs.")
                          } <Player disableCacheUpdate icon rank user={goban.engine.config.players.white} />
                      </h3>
                  </div>
              </div>
              <div className="body">
                  <div className="GameLink-kv">
                      <a href={"" + window.location} target="_blank"><i className="fa fa-link"/></a>
                      <span>{goban.game_id
                          ?  _("Game") /* Translators: Link to game */
                          :  _("Review") /* Translators: Link to review */
                      }: </span>
                      <input type="text" value={"" + window.location} onClick={(ev) => (ev.target as HTMLInputElement).select()} readOnly/>
                  </div>

                  <div className="GameLink-kv">
                      <a href={sgf_url} target="_blank"><i className="fa fa-link"/></a>
                      <span>{_("SGF")}: </span>
                      <input type="text" value={sgf_url} onClick={(ev) => (ev.target as HTMLInputElement).select()} readOnly/>
                  </div>
              </div>
              <div className="buttons">
                  <button onClick={this.close}>{_("Close")}</button>
              </div>
          </div>
        );
    }
}


export function openGameLinkModal(goban): void {
    openModal(<GameLinkModal goban={goban} fastDismiss />);
}

function yesno(tf: boolean) {
    return tf ? _("Yes") : _("No");
}
