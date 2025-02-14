/*
 * Copyright (C)  Online-Go.com
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
import * as data from "@/lib/data";
import { _ } from "@/lib/translate";
import { GobanRenderer } from "goban";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { MiniGoban } from "@/components/MiniGoban";
import { challenge } from "@/components/ChallengeModal";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { ModalContext } from "@/components/ModalProvider";

interface ForkModalProperties {
    goban: GobanRenderer;
}

export function ForkModal({ goban }: ForkModalProperties): React.ReactElement {
    const [currPlayer, setCurrPlayer] = React.useState(null as PlayerCacheEntry | null);
    const { hideModal } = React.useContext(ModalContext);

    const forkPreview = {
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
    };

    const openChallengeModal = () => {
        hideModal();
        if (currPlayer) {
            challenge(currPlayer.id, forkPreview);
        }
    };

    const setPlayer = (player: PlayerCacheEntry | null) => {
        setCurrPlayer(player);
    };

    return (
        <div className="Modal ForkModal">
            <div className="header space-around">
                <h2>{_("Player to challenge")}:</h2> <PlayerAutocomplete onComplete={setPlayer} />
            </div>
            <div className="body space-around">
                <MiniGoban
                    game_id={0}
                    black={undefined}
                    white={undefined}
                    json={forkPreview}
                    noLink
                />
            </div>
            <div className="buttons">
                <button onClick={hideModal}>{_("Cancel")}</button>
                <button
                    className="primary"
                    disabled={currPlayer == null || currPlayer.id === data.get("user").id}
                    onClick={openChallengeModal}
                >
                    {_("Game settings")} &rarr;
                </button>
            </div>
        </div>
    );
}
