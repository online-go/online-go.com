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

import { _ } from "@/lib/translate";
import { openModal, Modal } from "@/components/Modal";
import { Player } from "@/components/Player";
import { GameMoveMetadata } from "@moderator-ui/GameMoveMetadata";

interface Events {}

interface GameMoveMetadataModalProperties {
    config: any;
    black: any;
    white: any;
}

export class GameMoveMetadataModal extends Modal<Events, GameMoveMetadataModalProperties, {}> {
    constructor(props: GameMoveMetadataModalProperties) {
        super(props);
        this.state = {};
    }

    render() {
        if (!this.props.config) {
            return (
                <div className="Modal GameMoveMetadataModal">
                    <div className="header">
                        <h2>{_("Move Log")}</h2>
                    </div>
                    <div className="body">
                        <div>{_("Loading...")}</div>
                    </div>
                    <div className="buttons">
                        <button onClick={this.close}>{_("Close")}</button>
                    </div>
                </div>
            );
        }

        return (
            <div className="Modal GameMoveMetadataModal">
                <div className="header">
                    <div>
                        <h2>{this.props.config.game_name}</h2>
                        <h3>
                            <Player disableCacheUpdate icon rank user={this.props.black} />{" "}
                            {_("vs.")}{" "}
                            <Player disableCacheUpdate icon rank user={this.props.white} />
                        </h3>
                    </div>
                </div>
                <div className="body">
                    <GameMoveMetadata goban_config={this.props.config} />
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                </div>
            </div>
        );
    }
}

export function openGameMoveMetadataModal(config: any, black: any, white: any): void {
    openModal(<GameMoveMetadataModal config={config} black={black} white={white} fastDismiss />);
}
