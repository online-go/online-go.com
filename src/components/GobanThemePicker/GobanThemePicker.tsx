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
import { _, pgettext } from "translate";
import { GoThemesSorted } from "goban";
import { getSelectedThemes } from "preferences";
import * as preferences from "preferences";
import { PersistentElement } from "PersistentElement";
import * as data from "data";
import { CustomGobanThemeSchema } from "data_schema";
import { Toggle } from "Toggle";

interface GobanThemePickerProperties {
    size?: number;
}

interface GobanThemePickerState {
    size: number;
    board: string;
    white: string;
    black: string;
    boardCustom: string;
    lineCustom: string;
    whiteCustom: string;
    blackCustom: string;
    urlCustom: string;
    black_stone_url: string;
    white_stone_url: string;
    show_customize: boolean;
}
export class GobanThemePicker extends React.PureComponent<
    GobanThemePickerProperties,
    GobanThemePickerState
> {
    canvases: { [k: string]: JQuery[] } = {};
    selectTheme: { [k: string]: { [k: string]: () => void } } = {};

    constructor(props: GobanThemePickerProperties) {
        super(props);

        const selected = getSelectedThemes();

        this.state = {
            size: props.size || 44,
            board: selected.board,
            white: selected.white,
            black: selected.black,
            boardCustom: this.getCustom("board"),
            lineCustom: this.getCustom("line"),
            whiteCustom: this.getCustom("white"),
            blackCustom: this.getCustom("black"),
            urlCustom: this.getCustom("url"),
            black_stone_url: this.getCustom("black_stone_url"),
            white_stone_url: this.getCustom("white_stone_url"),
            show_customize: false,
        };

        for (const k in GoThemesSorted) {
            this.canvases[k] = [];
            this.selectTheme[k] = {};
            for (const theme of GoThemesSorted[k]) {
                this.canvases[k].push(
                    $("<canvas>").attr("width", this.state.size).attr("height", this.state.size),
                );
                theme.styles = Object.assign(
                    {
                        height: this.state.size + "px",
                        width: this.state.size + "px",
                    },
                    theme.getReactStyles(),
                ) as unknown as { [style_name: string]: string };

                this.selectTheme[k][theme.theme_name] = () => {
                    preferences.set(
                        `goban-theme-${k}` as preferences.ValidPreference,
                        theme.theme_name,
                    );
                    const up = {};
                    (up as any)[k] = theme.theme_name;
                    this.setState(up);
                };
            }
        }
    }

    componentDidMount() {
        setTimeout(() => this.renderPickers(), 50);
    }

    getCustom(key: keyof CustomGobanThemeSchema): string {
        return data.get(`custom.${key}`, "");
    }
    setCustom(
        key: keyof CustomGobanThemeSchema,
        event:
            | React.MouseEvent<HTMLButtonElement, MouseEvent>
            | React.ChangeEvent<HTMLInputElement>,
    ) {
        if ("value" in event.target) {
            data.set(`custom.${key}`, event.target.value);
        } else {
            data.remove(`custom.${key}`);
        }
        const up = {};
        (up as any)[`${key}Custom`] = this.getCustom(key);
        this.setState(up);
        this.renderPickers();

        if (key === "url") {
            // Changing the custom image should update the board theme
            key = "board";
        }

        if (key === "line") {
            // Changing the line color should update the board theme
            key = "board";
        }
        preferences.set(`goban-theme-${key}`, this.state[key]);
    }

    render() {
        const inputStyle = { height: `${this.state.size}px`, width: `${this.state.size * 1.5}px` };
        const {
            boardCustom,
            lineCustom,
            whiteCustom,
            blackCustom,
            urlCustom,
            white_stone_url,
            black_stone_url,
        } = this.state;

        console.log(this.state);

        // The layout of this picker is highly tweaked for the specific themes that Goban provides.

        // They are assumed to be, in GoTheme arrays for each of board, black and white:
        // - 5 board like themes for boards
        // - 5 weirder coloured themes for boards
        // - 1 customizable colour board theme called "Plain" (it's a plain board with a single colour)
        // - 1 customizable board theme called "Custom" that needs a URL for the image

        // - 5 standard stone themes for black and white
        // - 1 customizable colour stone theme for white and black called "Plain" (it's a plain stone with a single colour)
        // - 1 customizable stone theme for black and white called "Custom" that needs a URL for the image

        // The assumption for laying this out nicely is that we're making the picker dropdown 5 pickers wide,

        // The magic numbers that follow are determined by the above.

        // These are shown all the time.

        const standard_themes = {
            board: GoThemesSorted.board.slice(0, 5),
            white: GoThemesSorted.white.slice(0, 5),
            black: GoThemesSorted.black.slice(0, 5),
        };

        const extra_themes = {
            board: GoThemesSorted.board.slice(5, 10),
            white: [],
            black: [],
        };

        // ... then these ones are only shown if the person has clicked the customize toggle
        // (either "now", or in the past and chosen one of these)

        const plain_themes = {
            board: [GoThemesSorted.board[10]], // an array just to allow consistent processing below
            white: [GoThemesSorted.white[5]],
            black: [GoThemesSorted.black[5]],
        };

        const url_themes = {
            board: [GoThemesSorted.board[11]],
            white: [GoThemesSorted.white[6]],
            black: [GoThemesSorted.black[6]],
        };

        let custom_theme_active = false;

        if (
            GoThemesSorted["board"].findIndex((t) => t.theme_name === this.state.board) > 9 ||
            GoThemesSorted["white"].findIndex((t) => t.theme_name === this.state.white) > 4 ||
            GoThemesSorted["black"].findIndex((t) => t.theme_name === this.state.black) > 4
        ) {
            custom_theme_active = true;
            // This is so that the custom section stays open if the try out a non-custom theme while it is open due to custom_theme_active
            this.setState({ show_customize: true });
        }

        return (
            <div className="GobanThemePicker">
                <div className="theme-set">
                    {standard_themes.board.map((theme, idx) => (
                        <div
                            key={theme.theme_name}
                            title={_(theme.theme_name)}
                            className={
                                "selector" +
                                (this.state.board === theme.theme_name ? " active" : "")
                            }
                            style={theme.styles}
                            onClick={this.selectTheme["board"][theme.theme_name]}
                        >
                            <PersistentElement elt={this.canvases.board[idx]} />
                        </div>
                    ))}
                </div>
                <div className="theme-set">
                    {extra_themes.board.map((theme, idx) => (
                        <div
                            key={theme.theme_name}
                            title={_(theme.theme_name)}
                            className={
                                "selector" +
                                (this.state.board === theme.theme_name ? " active" : "")
                            }
                            style={theme.styles}
                            onClick={this.selectTheme["board"][theme.theme_name]}
                        >
                            <PersistentElement elt={this.canvases.board[idx]} />
                        </div>
                    ))}
                </div>
                <div className="theme-set">
                    {standard_themes.white.map((theme, idx) => (
                        <div
                            key={theme.theme_name}
                            title={_(theme.theme_name)}
                            className={
                                "selector" +
                                (this.state.white === theme.theme_name ? " active" : "")
                            }
                            style={theme.styles}
                            onClick={this.selectTheme["white"][theme.theme_name]}
                        >
                            <PersistentElement elt={this.canvases.white[idx]} />
                        </div>
                    ))}
                </div>

                <div className="theme-set">
                    {standard_themes.black.map((theme, idx) => (
                        <div
                            key={theme.theme_name}
                            title={_(theme.theme_name)}
                            className={
                                "selector" +
                                (this.state.black === theme.theme_name ? " active" : "")
                            }
                            style={theme.styles}
                            onClick={this.selectTheme["black"][theme.theme_name]}
                        >
                            <PersistentElement elt={this.canvases.black[idx]} />
                        </div>
                    ))}
                </div>

                <div className="show-customize-selector">
                    <span>{pgettext("Label for a button to show custom stones", "Customize")}</span>
                    <Toggle
                        className="show-customize-toggle"
                        height={14}
                        width={30}
                        checked={this.state.show_customize || custom_theme_active}
                        id="show-customize"
                        onChange={(checked) => {
                            this.setState({ show_customize: checked });
                        }}
                        disabled={custom_theme_active}
                    />
                </div>

                {(custom_theme_active || this.state.show_customize) && (
                    <>
                        <div className="custom-theme-set">
                            {plain_themes.board.map((theme, _idx) => (
                                <div
                                    key={theme.theme_name}
                                    title={_(theme.theme_name)}
                                    className={
                                        "selector" +
                                        (this.state.board === theme.theme_name ? " active" : "")
                                    }
                                    style={{
                                        ...theme.styles,
                                        ...(theme.theme_name === "Plain"
                                            ? {
                                                  backgroundImage:
                                                      "linear-gradient(-45deg, orange,yellow,green,blue,indigo,violet)",
                                              }
                                            : {}),
                                    }}
                                    onClick={this.selectTheme["board"][theme.theme_name]}
                                ></div>
                            ))}

                            <div className="board-color-selectors">
                                <input
                                    type="color"
                                    style={inputStyle}
                                    value={boardCustom}
                                    onChange={this.setCustom.bind(this, "board")}
                                />
                                <button
                                    className="color-reset"
                                    onClick={this.setCustom.bind(this, "board")}
                                >
                                    <i className="fa fa-undo" />
                                </button>
                                <input
                                    type="color"
                                    style={inputStyle}
                                    value={lineCustom}
                                    onChange={this.setCustom.bind(this, "line")}
                                />
                                <button
                                    className="color-reset"
                                    onClick={this.setCustom.bind(this, "line")}
                                >
                                    <i className="fa fa-undo" />
                                </button>
                            </div>
                        </div>

                        <div className="custom-theme-set">
                            {url_themes.board.map((theme, idx) => (
                                <div
                                    key={theme.theme_name}
                                    title={_(theme.theme_name)}
                                    className={
                                        "selector" +
                                        (this.state.board === theme.theme_name ? " active" : "")
                                    }
                                    style={{
                                        ...theme.styles,
                                        ...(theme.theme_name === "Plain"
                                            ? {
                                                  backgroundImage:
                                                      "linear-gradient(-45deg, orange,yellow,green,blue,indigo,violet)",
                                              }
                                            : {}),
                                    }}
                                    onClick={this.selectTheme["board"][theme.theme_name]}
                                >
                                    <PersistentElement elt={this.canvases.board[idx + 5]} />
                                </div>
                            ))}

                            <div className="custom-url-selection">
                                <input
                                    className="customUrlSelector"
                                    type="text"
                                    value={urlCustom}
                                    placeholder={pgettext(
                                        "Custom background image url for the goban",
                                        "Custom background URL",
                                    )}
                                    onFocus={(e) => e.target.select()}
                                    onChange={this.setCustom.bind(this, "url")}
                                />
                            </div>
                        </div>

                        <div className="custom-theme-set">
                            {plain_themes.white.map((theme, idx) => (
                                <div
                                    key={theme.theme_name}
                                    title={_(theme.theme_name)}
                                    className={
                                        "selector" +
                                        (this.state.white === theme.theme_name ? " active" : "")
                                    }
                                    style={theme.styles}
                                    onClick={this.selectTheme["white"][theme.theme_name]}
                                >
                                    <PersistentElement elt={this.canvases.white[idx + 5]} />
                                </div>
                            ))}

                            <div>
                                <input
                                    type="color"
                                    style={inputStyle}
                                    value={whiteCustom}
                                    onChange={this.setCustom.bind(this, "white")}
                                />
                                <button
                                    className="color-reset"
                                    onClick={this.setCustom.bind(this, "white")}
                                >
                                    <i className="fa fa-undo" />
                                </button>
                            </div>
                        </div>

                        <div className="custom-theme-set">
                            {url_themes.white.map((theme, idx) => (
                                <div
                                    key={theme.theme_name}
                                    title={_(theme.theme_name)}
                                    className={
                                        "selector" +
                                        (this.state.white === theme.theme_name ? " active" : "")
                                    }
                                    style={theme.styles}
                                    onClick={this.selectTheme["white"][theme.theme_name]}
                                >
                                    <PersistentElement elt={this.canvases.white[idx + 6]} />
                                </div>
                            ))}
                            <div className="custom-url-selection">
                                <input
                                    className="customUrlSelector"
                                    type="text"
                                    value={white_stone_url}
                                    placeholder={pgettext(
                                        "A URL pointing to a custom white stone image",
                                        "Custom white stone URL",
                                    )}
                                    onFocus={(e) => e.target.select()}
                                    onChange={this.setCustom.bind(this, "white_stone_url")}
                                />
                            </div>
                        </div>

                        <div className="custom-theme-set">
                            {plain_themes.black.map((theme, idx) => (
                                <div
                                    key={theme.theme_name}
                                    title={_(theme.theme_name)}
                                    className={
                                        "selector" +
                                        (this.state.black === theme.theme_name ? " active" : "")
                                    }
                                    style={theme.styles}
                                    onClick={this.selectTheme["black"][theme.theme_name]}
                                >
                                    <PersistentElement elt={this.canvases.black[idx + 5]} />
                                </div>
                            ))}
                            <div>
                                <input
                                    type="color"
                                    style={inputStyle}
                                    value={blackCustom}
                                    onChange={this.setCustom.bind(this, "black")}
                                />
                                <button
                                    className="color-reset"
                                    onClick={this.setCustom.bind(this, "black")}
                                >
                                    <i className="fa fa-undo" />
                                </button>
                            </div>
                        </div>

                        <div className="custom-theme-set">
                            {url_themes.black.map((theme, idx) => (
                                <div
                                    key={theme.theme_name}
                                    title={_(theme.theme_name)}
                                    className={
                                        "selector" +
                                        (this.state.black === theme.theme_name ? " active" : "")
                                    }
                                    style={theme.styles}
                                    onClick={this.selectTheme["black"][theme.theme_name]}
                                >
                                    <PersistentElement elt={this.canvases.black[idx + 6]} />
                                </div>
                            ))}

                            <div className="custom-url-selection">
                                <input
                                    className="customUrlSelector"
                                    type="text"
                                    value={black_stone_url}
                                    placeholder={pgettext(
                                        "A URL pointing to a custom black stone image",
                                        "Custom black stone URL",
                                    )}
                                    onFocus={(e) => e.target.select()}
                                    onChange={this.setCustom.bind(this, "black_stone_url")}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    renderPickers() {
        const square_size = this.state.size;

        for (let i = 0; i < GoThemesSorted.board.length; ++i) {
            const theme = GoThemesSorted.board[i];
            const canvas = this.canvases.board[i];
            const ctx = (canvas[0] as HTMLCanvasElement).getContext("2d");
            if (!ctx) {
                continue;
            }
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

            ctx.font = "bold " + square_size / 4 + "px Verdana,Courier,Arial,serif";
            ctx.fillStyle = theme.getLabelTextColor();
            ctx.textBaseline = "middle";
            const metrics = ctx.measureText("A");
            const xx = square_size / 2 - metrics.width / 2;
            const yy = square_size / 4;
            ctx.fillText("A", xx + 0.5, yy + 0.5);
        }

        for (let i = 0; i < GoThemesSorted.white.length; ++i) {
            const theme = GoThemesSorted.white[i];
            const canvas = this.canvases.white[i];
            const ctx = (canvas[0] as HTMLCanvasElement).getContext("2d");
            if (!ctx) {
                continue;
            }
            const radius = Math.round(square_size / 2.2);
            const draw = () => {
                ctx.clearRect(0, 0, square_size, square_size);
                theme.placeWhiteStone(
                    ctx,
                    ctx,
                    stones[0],
                    square_size / 2,
                    square_size / 2,
                    radius,
                );
            };
            const stones = theme.preRenderWhite(radius, 23434, draw);
            draw();
        }

        for (let i = 0; i < GoThemesSorted.black.length; ++i) {
            const theme = GoThemesSorted.black[i];
            const canvas = this.canvases.black[i];
            const ctx = (canvas[0] as HTMLCanvasElement).getContext("2d");
            if (!ctx) {
                continue;
            }
            const radius = Math.round(square_size / 2.2);
            const draw = () => {
                ctx.clearRect(0, 0, square_size, square_size);
                theme.placeBlackStone(
                    ctx,
                    ctx,
                    stones[0],
                    square_size / 2,
                    square_size / 2,
                    radius,
                );
            };
            const stones = theme.preRenderBlack(radius, 23434, draw);
            draw();
        }
    }
}
