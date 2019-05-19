/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import {errorAlerter} from "misc";
import {GoThemes} from "goban";
import {getSelectedThemes} from "preferences";
import * as preferences from "preferences";
import {PersistentElement} from "PersistentElement";
import * as data from "data";

interface GobanThemePickerProperties {
    // id?: any,
    // user?: any,
    // callback?: ()=>any,
    size?: number;
}



export class GobanThemePicker extends React.PureComponent<GobanThemePickerProperties, any> {
    canvases: any = {};
    selectTheme: any = {};

    constructor(props) {
        super(props);

        let selected = getSelectedThemes();

        this.state = {
            size: props.size || 44,
            board: selected.board,
            white: selected.white,
            black: selected.black,
            boardCustom: this.getCustom("board"),
            lineCustom: this.getCustom("line"),
            whiteCustom: this.getCustom("white"),
            blackCustom: this.getCustom("black")
        };

        for (let k in GoThemes) {
            this.canvases[k] = [];
            this.selectTheme[k] = {};
            for (let theme of GoThemes[k].sorted) {
                this.canvases[k].push($("<canvas>").attr("width", this.state.size).attr("height", this.state.size));
                theme.styles = Object.assign({height: this.state.size + "px", width: this.state.size + "px"}, new theme().getReactStyles());

                this.selectTheme[k][theme.theme_name] = () => {
                    preferences.set(`goban-theme-${k}`, theme.theme_name);
                    let up = {};
                    up[k] = theme.theme_name;
                    this.setState(up);
                };
            }
        }

    }

    componentDidMount() {
        setTimeout(() => this.renderPickers(), 50);
    }
    //componentWillReceiveProps(next_props) { }
    //componentDidUpdate(old_props, old_state) { }
    componentWillUnmount() {
    }

    getCustom(key) {
        return data.get(`custom.${key}`);
    }
    setCustom(key, event) {
        if (event.target.value) {
            data.set(`custom.${key}`, event.target.value);
        } else {
            data.remove(`custom.${key}`);
        }
        let up = {};
        up[`${key}Custom`] = this.getCustom(key);
        this.setState(up);
        this.renderPickers();

        if (key === "line") { // Changing the line color should update the board theme
            key = "board";
        }
        preferences.set(`goban-theme-${key}`, this.state[key]);
    }

    render() {
        let inputStyle = {height: `${this.state.size}px`, width: `${this.state.size * 1.5}px`};
        let {boardCustom, lineCustom, whiteCustom, blackCustom} = this.state;

        return (
            <div className="GobanThemePicker">
                <div className="theme-set">
                    {GoThemes.board.sorted.map((theme, idx) => (
                        <div key={theme.theme_name}
                            className={"selector" + (this.state.board === theme.theme_name ? " active" : "")}
                            style={{
                                ...theme.styles,
                                ...(theme.theme_name === "Plain" ? {backgroundColor: boardCustom} : {})
                            }}
                            onClick={this.selectTheme["board"][theme.theme_name]}
                            >
                            <PersistentElement elt={this.canvases.board[idx]} />
                        </div>
                    ))}
                    {this.state.board === "Plain" &&
                        <div>
                            <input type="color" style={inputStyle} value={boardCustom} onChange={this.setCustom.bind(this, "board")} />
                            <button className="color-reset" onClick={this.setCustom.bind(this, "board")}><i className="fa fa-undo"/></button>
                            <input type="color" style={inputStyle} value={lineCustom} onChange={this.setCustom.bind(this, "line")} />
                            <button className="color-reset" onClick={this.setCustom.bind(this, "line")}><i className="fa fa-undo"/></button>
                        </div>
                    }
                </div>

                <div className="theme-set">
                    {GoThemes.white.sorted.map((theme, idx) => (
                        <div key={theme.theme_name}
                            className={"selector" + (this.state.white === theme.theme_name ? " active" : "")}
                            style={theme.styles}
                            onClick={this.selectTheme["white"][theme.theme_name]}
                            >
                            <PersistentElement elt={this.canvases.white[idx]} />
                        </div>
                    ))}
                    {this.state.white === "Plain" &&
                        <div>
                            <input type="color" style={inputStyle} value={whiteCustom} onChange={this.setCustom.bind(this, "white")} />
                            <button className="color-reset" onClick={this.setCustom.bind(this, "white")}><i className="fa fa-undo"/></button>
                        </div>
                    }
                </div>

                <div className="theme-set">
                    {GoThemes.black.sorted.map((theme, idx) => (
                        <div key={theme.theme_name}
                            className={"selector" + (this.state.black === theme.theme_name ? " active" : "")}
                            style={theme.styles}
                            onClick={this.selectTheme["black"][theme.theme_name]}
                            >
                            <PersistentElement elt={this.canvases.black[idx]} />
                        </div>
                    ))}
                    {this.state.black === "Plain" &&
                        <div>
                            <input type="color" style={inputStyle} value={blackCustom} onChange={this.setCustom.bind(this, "black")} />
                            <button className="color-reset" onClick={this.setCustom.bind(this, "black")}><i className="fa fa-undo"/></button>
                        </div>
                    }
                </div>
            </div>
        );
    }

    renderPickers() {{{
        let start = new Date();
        let square_size = this.state.size;

        for (let i = 0; i < GoThemes.board.sorted.length; ++i) {
            let Theme = GoThemes.board.sorted[i];
            let theme = new Theme();
            let canvas = this.canvases.board[i];
            let ctx = canvas[0].getContext("2d");
            ctx.clearRect(0, 0, square_size, square_size);

            ctx.beginPath();
            ctx.strokeStyle = theme.getLineColor();
            ctx.moveTo(square_size / 2 - 0.5, square_size / 2 - 0.5);
            ctx.lineTo(square_size - 0.5, square_size / 2 - 0.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = theme.getLineColor();
            ctx.moveTo(square_size / 2 - 0.5, square_size / 2 - 0.5);
            ctx.lineTo(square_size / 2 - 0.5, square_size - 0.5);
            ctx.stroke();

            ctx.font = "bold " + (square_size / 4) + "px Verdana,Courier,Arial,serif";
            ctx.fillStyle = theme.getLabelTextColor();
            ctx.textBaseline = "middle";
            let metrics = ctx.measureText("A");
            let xx = square_size / 2 - metrics.width / 2;
            let yy = (square_size / 4);
            ctx.fillText("A", xx + 0.5, yy + 0.5);
        }

        let plain_board = new (GoThemes["board"]["Plain"])();
        for (let i = 0; i < GoThemes.white.sorted.length; ++i) {
            let Theme = GoThemes.white.sorted[i];
            let theme = new Theme();
            let canvas = this.canvases.white[i];
            let ctx = canvas[0].getContext("2d");
            let radius = Math.round(square_size / 2.2);
            let stones = theme.preRenderWhite(radius, 23434);
            ctx.clearRect(0, 0, square_size, square_size);
            theme.placeWhiteStone(ctx, ctx, stones[0], square_size / 2, square_size / 2, radius);
        }

        for (let i = 0; i < GoThemes.black.sorted.length; ++i) {
            let Theme = GoThemes.black.sorted[i];
            let theme = new Theme();
            let canvas = this.canvases.black[i];
            let ctx = canvas[0].getContext("2d");
            let radius = Math.round(square_size / 2.2);
            let stones = theme.preRenderBlack(radius, 23434);
            ctx.clearRect(0, 0, square_size, square_size);
            theme.placeBlackStone(ctx, ctx, stones[0], square_size / 2, square_size / 2, radius);
        }

        let end = new Date();
        //console.info("Render time: ", (end.getTime() - start.getTime()))
    }}}
}
