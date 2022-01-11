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
import { _, pgettext, interpolate } from "translate";
import { Modal, openModal } from "Modal";
import { Goban } from "goban";
import { PlayerAutocomplete } from "PlayerAutocomplete";
import { MiniGoban } from "MiniGoban";
import { challenge } from "ChallengeModal";

interface Events {}

interface ForkModalProperties {
    goban: Goban;
}

export class ForkModal extends Modal<Events, ForkModalProperties, any> {
    constructor(props) {
        super(props);

        const goban = this.props.goban;
        this.state = {
            player: null,
            fork_preview: {
                //"moves": goban.engine.cur_move.getMoveStringToThisPoint(),
                //"initial_state": goban.engine.initial_state,
                //"initial_player": goban.engine.config.initial_player,
                moves: [],
                initial_state: goban.engine.computeInitialStateForForkedGame(),
                initial_player: goban.engine.colorToMove(),
                width: goban.engine.width,
                height: goban.engine.height,
                rules: goban.engine.rules,
                handicap: goban.engine.handicap,
                komi: goban.engine.komi,
                move_number: goban.engine.getMoveNumber(),
                game_name: goban.engine.name,
            },
        };
    }

    openChallengeModal = () => {
        this.close();
        challenge(this.state.player.id, this.state.fork_preview);
    };

    setPlayer = (player) => {
        this.setState({ player: player });
    };

    render() {
        return (
            <div className="Modal ForkModal" ref="modal">
                <div className="header space-around">
                    <h2>{_("Player to challenge")}:</h2> <PlayerAutocomplete onComplete={this.setPlayer} />
                </div>
                <div className="body space-around">
                    <MiniGoban id={null} black={null} white={null} json={this.state.fork_preview} noLink />
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Cancel")}</button>
                    <button
                        className="primary"
                        disabled={this.state.player == null || this.state.player.id === data.get("user").id}
                        onClick={this.openChallengeModal}
                    >
                        {_("Game settings")} &rarr;
                    </button>
                </div>
            </div>
        );
    }
}

export function openForkModal(goban) {
    return openModal(<ForkModal goban={goban} />);
}
