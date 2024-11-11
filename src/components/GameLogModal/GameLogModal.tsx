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
import { socket } from "@/lib/sockets";
import { GameLog, LogEntry } from "@/views/Game/GameLog";

interface Events {}

interface GameLogModalProperties {
    config: any;
    markCoords: any;
    black: any;
    white: any;
}

export class GameLogModal extends Modal<Events, GameLogModalProperties, { log: Array<LogEntry> }> {
    config: any;

    constructor(props: GameLogModalProperties) {
        super(props);

        this.state = {
            log: [],
        };
    }

    componentDidMount(): void {
        super.componentDidMount();
        socket.send(`game/log`, { game_id: this.props.config.game_id }, (log) => this.setLog(log));
    }

    setLog(log: Array<LogEntry>) {
        this.setState({ log });
    }

    render() {
        return (
            <div className="Modal GameLogModal">
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
                    <GameLog goban_config={this.props.config} />
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                </div>
            </div>
        );
    }
}

interface DCBProperties {
    markCoords: any;
    stones: string;
}

export class DrawCoordsButton extends React.Component<DCBProperties, {}> {
    constructor(props: DCBProperties) {
        super(props);
        this.handleMarkCoords = this.handleMarkCoords.bind(this);
    }

    handleMarkCoords() {
        this.props.markCoords(this.props.stones);
    }

    render() {
        return (
            <a onClick={this.handleMarkCoords} className="field">
                {this.props.stones}
            </a>
        );
    }
}

export function openGameLogModal(
    config: any,
    markCoords: (stones: string) => void,
    black: any,
    white: any,
): void {
    openModal(
        <GameLogModal
            config={config}
            markCoords={markCoords}
            black={black}
            white={white}
            fastDismiss
        />,
    );
}
