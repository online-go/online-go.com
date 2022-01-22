/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { pgettext, _ } from "translate";
import { openModal, Modal } from "Modal";
import { Goban } from "goban";
import { Player } from "Player";

interface Events {}

interface GameLinkModalProperties {
    goban: Goban;
}

export class GameLinkModal extends Modal<Events, GameLinkModalProperties, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        const goban = this.props.goban;
        let png_url: string;
        let sgf_url: string;
        if (goban.game_id) {
            sgf_url = `${window.location.protocol}//${window.location.hostname}/api/v1/games/${goban.game_id}/sgf`;
            png_url = `${window.location.protocol}//${window.location.hostname}/api/v1/games/${goban.game_id}/png`;
        } else {
            sgf_url = `${window.location.protocol}//${window.location.hostname}/api/v1/reviews/${goban.review_id}/sgf`;
            png_url = `${window.location.protocol}//${window.location.hostname}/api/v1/reviews/${goban.review_id}/png`;
        }

        return (
            <div className="Modal GameLinkModal" ref="modal">
                <div className="header">
                    <div>
                        <h2>{goban.engine.config.game_name}</h2>
                        <h3>
                            <Player
                                disableCacheUpdate
                                icon
                                rank
                                user={goban.engine.config.players.black}
                            />{" "}
                            {_("vs.")}{" "}
                            <Player
                                disableCacheUpdate
                                icon
                                rank
                                user={goban.engine.config.players.white}
                            />
                        </h3>
                    </div>
                </div>
                <div className="body">
                    <div className="GameLink-kv">
                        <a href={"" + window.location} target="_blank">
                            <i className="fa fa-link" />
                        </a>
                        <span>
                            {
                                goban.game_id
                                    ? _("Game") /* Translators: Link to game */
                                    : _("Review") /* Translators: Link to review */
                            }
                            :{" "}
                        </span>
                        <input
                            type="text"
                            value={"" + window.location}
                            onClick={(ev) => (ev.target as HTMLInputElement).select()}
                            readOnly
                        />
                    </div>

                    <div className="GameLink-kv">
                        <a href={sgf_url} target="_blank">
                            <i className="fa fa-link" />
                        </a>
                        <span>{_("SGF")}: </span>
                        <input
                            type="text"
                            value={sgf_url}
                            onClick={(ev) => (ev.target as HTMLInputElement).select()}
                            readOnly
                        />
                    </div>

                    <div className="GameLink-kv">
                        <a href={png_url} target="_blank">
                            <i className="fa fa-link" />
                        </a>
                        <span>{_("PNG")}: </span>
                        <input
                            type="text"
                            value={png_url}
                            onClick={(ev) => (ev.target as HTMLInputElement).select()}
                            readOnly
                        />
                    </div>

                    {goban.game_id && <AnimatedGifCreator goban={goban} />}
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                </div>
            </div>
        );
    }
}

function AnimatedGifCreator({ goban }: { goban: Goban }): JSX.Element {
    const engine = goban.engine;
    const [from_move, setFromMove] = React.useState(Math.max(engine?.getMoveNumber() - 10, 1));
    const [to_move, setToMove] = React.useState(Math.max(engine?.getMoveNumber(), 1));
    const [frame_delay, setFrameDelay] = React.useState(1500);
    const [preview_url, setPreviewUrl] = React.useState("");

    const url =
        `${window.location.protocol}//${window.location.hostname}` +
        `/api/v1/games/${goban.game_id}/gif?from=${from_move}&to=${to_move}&frame_delay=${frame_delay}`;

    return (
        <div className="AnimatedGifCreator">
            <div className="GameLink-kv">
                <a href={url} target="_blank">
                    <i className="fa fa-link" />
                </a>
                <span style={{ textAlign: "right" }}>{_("Animated GIF")}: </span>
                <input
                    type="text"
                    value={url}
                    onClick={(ev) => (ev.target as HTMLInputElement).select()}
                    readOnly
                />
            </div>

            <div className="range-row">
                <label htmlFor="from">
                    {pgettext("The starting move number of an animated gif", "From move")}
                </label>
                <input
                    id="from"
                    name="from"
                    type="range"
                    min={1}
                    max={engine.getMoveNumber()}
                    value={from_move}
                    onChange={(ev) => setFromMove(parseInt(ev.target.value))}
                />
                <span>{from_move}</span>
            </div>

            <div className="range-row">
                <label htmlFor="to">
                    {pgettext("The ending move number of an animated gif", "To move")}
                </label>
                <input
                    id="to"
                    name="to"
                    type="range"
                    min={1}
                    max={engine.getMoveNumber()}
                    value={to_move}
                    onChange={(ev) => setToMove(parseInt(ev.target.value))}
                />
                <span>{to_move}</span>
            </div>
            <div className="range-row">
                <label htmlFor="frame_delay">
                    {pgettext("The delay between frames in an animated gif", "Frame delay")}
                </label>
                <input
                    id="frame_delay"
                    name="frame_delay"
                    type="range"
                    min={100}
                    max={5000}
                    step={100}
                    value={frame_delay}
                    onChange={(ev) => setFrameDelay(parseInt(ev.target.value))}
                />
                <span>
                    {(frame_delay / 1000).toFixed(1)} {_("seconds")}
                </span>
            </div>

            <button onClick={() => setPreviewUrl(url)}>{_("Preview")}</button>
            <div>
                <img src={preview_url} />
            </div>
        </div>
    );
}

export function openGameLinkModal(goban): void {
    openModal(<GameLinkModal goban={goban} fastDismiss />);
}
