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
import * as moment from "moment";
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {openModal, Modal} from "Modal";
import {timeControlDescription} from "TimeControl";
import {GoEngine} from "goban";
import {Player} from "Player";
import {errorAlerter, rulesText} from "misc";
import {handicapText} from "GameAcceptModal";

interface GameInfoModalProperties {
    game: GoEngine;
    creatorId: number;
}


export class GameInfoModal extends Modal<GameInfoModalProperties, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        const game = this.props.game;

        if (game.config && game.config.pause_on_weekends) {
            /* There was a bug in our tournament creation code that didn't
             * stick this value in the time_control object, so this helps with
             * display on those games. */
            game.time_control.pause_on_weekends = game.config.pause_on_weekends;
        }
        let time_control_description = timeControlDescription(game.time_control);

        return (
          <div className="Modal GameInfoModal" ref="modal">
              <div className="header">
                  <div>
                      <h2>
                          {game.config.game_name}
                      </h2>
                      <h3>
                          <Player disableCacheUpdate icon rank user={game.config.players.black} /> {
                              _("vs.")
                          } <Player disableCacheUpdate icon rank user={game.config.players.white} />
                      </h3>
                  </div>
              </div>
              <div className="body">
                <dl className="horizontal">
                    <dt>{_("Game")}</dt><dd>{game.config.game_name}</dd>
                    {this.props.creatorId && <dt>{_("Creator")}</dt>}
                    {this.props.creatorId && <dd><Player icon rank user={this.props.creatorId} /></dd>}
                    <dt>{_("Black")}</dt><dd><Player disableCacheUpdate icon rank user={game.config.players.black} /></dd>
                    <dt>{_("White")}</dt><dd><Player disableCacheUpdate icon rank user={game.config.players.white} /></dd>
                    <dt>{_("Time")}</dt>
                        <dd>
                            {game.config.start_time ? moment(new Date(game.config.start_time * 1000)).format("LLL") : ""}
                            {game.config.end_time ? " - " + moment(new Date(game.config.end_time * 1000)).format("LLL") : ""}
                        </dd>
                    <dt>{_("Rules")}</dt><dd>{rulesText(game.config.rules)}</dd>
                    <dt>{_("Ranked")}</dt><dd>{yesno(game.config.ranked)}</dd>
                    <dt>{_("Annulled")}</dt><dd>{yesno(game.config.annulled)}</dd>
                    <dt>{_("Board Size")}</dt><dd>{game.config.width}x{game.config.height}</dd>
                    <dt>{_("Handicap")}</dt><dd>{handicapText(game.config.handicap)}</dd>
                    <dt>{_("Komi")}</dt><dd>{parseFloat(game.config.komi).toFixed(1)}</dd>
                    <dt>{_("Analysis")}</dt><dd>{(game.config.original_disable_analysis ? _("Analysis and conditional moves disabled") : _("Analysis and conditional moves enabled"))}</dd>
                    <dt>{_("Time Control")}</dt><dd>{time_control_description}</dd>
                </dl>
              </div>
              <div className="buttons">
                  <button onClick={this.close}>{_("Close")}</button>
              </div>
          </div>
        );
    }
}


export function openGameInfoModal(game:GoEngine, creator_id: number): void {
    openModal(<GameInfoModal game={game} creatorId={creator_id} fastDismiss />);
}

function yesno(tf: boolean) {{{
    return tf ? _("Yes") : _("No");
}}}
