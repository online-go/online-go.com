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
import { Goban, GobanTheme, GobanThemeBackgroundCSS } from "goban";
import { getSelectedThemes } from "preferences";
import * as preferences from "preferences";
import { PersistentElement } from "PersistentElement";
import * as data from "data";
import { CustomGobanThemeSchema } from "data_schema";
import { Toggle } from "Toggle";
import { Experiment, Variant, Default } from "../Experiment";

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
    black_stone_urlCustom: string;
    white_stone_urlCustom: string;
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
            black_stone_urlCustom: this.getCustom("black_stone_url"),
            white_stone_urlCustom: this.getCustom("white_stone_url"),
            //show_customize: false,
            show_customize:
                selected.board === "Custom" ||
                selected.black === "Custom" ||
                selected.white === "Custom",
        };

        for (const k in Goban.THEMES_SORTED) {
            this.canvases[k] = [];
            this.selectTheme[k] = {};
            for (const theme of Goban.THEMES_SORTED[k]) {
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
        try {
            this.renderPickers();
        } catch (e) {
            console.error(e);
        }

        if (key === "url") {
            // Changing the custom image should update the board theme
            key = "board";
        }

        if (key === "line") {
            // Changing the line color should update the board theme
            key = "board";
        }

        // If it's a color code, set to Custom
        if (this.state[`${key}Custom`][0] === "#") {
            preferences.set(`goban-theme-${key}`, "Custom");
        } else {
            preferences.set(`goban-theme-${key}`, this.state[`${key}Custom`]);
        }
    }

    render() {
        const inputStyle = { height: `${this.state.size}px`, width: `${this.state.size * 1.5}px` };
        const {
            boardCustom,
            lineCustom,
            whiteCustom,
            blackCustom,
            urlCustom,
            white_stone_urlCustom,
            black_stone_urlCustom,
        } = this.state;

        const standard_themes = {
            board: Goban.THEMES_SORTED.board.filter((x) => x.theme_name !== "Custom"),
            white: Goban.THEMES_SORTED.white.filter((x) => x.theme_name !== "Custom"),
            black: Goban.THEMES_SORTED.black.filter((x) => x.theme_name !== "Custom"),
        };

        const custom_board = Goban.THEMES_SORTED.board.filter((x) => x.theme_name === "Custom")[0];
        const custom_black = Goban.THEMES_SORTED.black.filter((x) => x.theme_name === "Custom")[0];
        const custom_white = Goban.THEMES_SORTED.white.filter((x) => x.theme_name === "Custom")[0];

        const active_standard_board_theme = Goban.THEMES_SORTED.board.filter(
            (x) => x.theme_name === this.state.board,
        )[0];

        const board_styles =
            this.state.board === custom_board.theme_name
                ? {
                      backgroundColor: this.state.boardCustom,
                      backgroundImage: `url(${this.state.urlCustom})`,
                  }
                : {
                      backgroundColor: active_standard_board_theme.styles["backgroundColor"],
                      backgroundImage: active_standard_board_theme.styles["backgroundImage"],
                  };

        // If the user has selected a custom theme, we need to show the customisation options
        const force_custom_themes_toggle =
            this.state.board === "Custom" ||
            this.state.white === "Custom" ||
            this.state.black === "Custom";

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

                <Experiment name="svg">
                    <Variant value="enabled">
                        <div className="theme-set">
                            {standard_themes.white.map((theme) => (
                                <div
                                    key={theme.theme_name}
                                    title={_(theme.theme_name)}
                                    className={
                                        "selector" +
                                        (this.state.white === theme.theme_name ? " active" : "")
                                    }
                                    style={{
                                        ...theme.styles,
                                        ...board_styles,
                                    }}
                                    onClick={this.selectTheme["white"][theme.theme_name]}
                                >
                                    <ThemeSample
                                        theme={theme}
                                        size={this.state.size}
                                        color={"white"}
                                    />
                                </div>
                            ))}
                        </div>
                    </Variant>
                    <Default>
                        <div className="theme-set">
                            {standard_themes.white.map((theme, idx) => (
                                <div
                                    key={theme.theme_name}
                                    title={_(theme.theme_name)}
                                    className={
                                        "selector" +
                                        (this.state.white === theme.theme_name ? " active" : "")
                                    }
                                    style={{
                                        ...theme.styles,
                                        ...board_styles,
                                    }}
                                    onClick={this.selectTheme["white"][theme.theme_name]}
                                >
                                    <PersistentElement elt={this.canvases.white[idx]} />
                                </div>
                            ))}
                        </div>
                    </Default>
                </Experiment>

                <Experiment name="svg">
                    <Variant value="enabled">
                        <div className="theme-set">
                            {standard_themes.black.map((theme) => (
                                <div
                                    key={theme.theme_name}
                                    title={_(theme.theme_name)}
                                    className={
                                        "selector" +
                                        (this.state.black === theme.theme_name ? " active" : "")
                                    }
                                    style={{
                                        ...theme.styles,
                                        ...board_styles,
                                    }}
                                    onClick={this.selectTheme["black"][theme.theme_name]}
                                >
                                    <ThemeSample
                                        theme={theme}
                                        size={this.state.size}
                                        color={"black"}
                                    />
                                </div>
                            ))}
                        </div>
                    </Variant>
                    <Default>
                        <div className="theme-set">
                            {standard_themes.black.map((theme, idx) => (
                                <div
                                    key={theme.theme_name}
                                    title={_(theme.theme_name)}
                                    className={
                                        "selector" +
                                        (this.state.black === theme.theme_name ? " active" : "")
                                    }
                                    style={{
                                        ...theme.styles,
                                        ...board_styles,
                                    }}
                                    onClick={this.selectTheme["black"][theme.theme_name]}
                                >
                                    <PersistentElement elt={this.canvases.black[idx]} />
                                </div>
                            ))}
                        </div>
                    </Default>
                </Experiment>

                <div className="show-customize-selector">
                    <span>{pgettext("Label for a button to show custom stones", "Customize")}</span>
                    <Toggle
                        className="show-customize-toggle"
                        height={14}
                        width={30}
                        checked={this.state.show_customize || force_custom_themes_toggle}
                        id="show-customize"
                        onChange={(checked) => {
                            this.setState({ show_customize: checked });
                        }}
                        disabled={force_custom_themes_toggle}
                    />
                </div>

                {(force_custom_themes_toggle || this.state.show_customize) && (
                    <>
                        <div className="custom-theme-set">
                            <div
                                title={_(custom_board.theme_name)}
                                className={
                                    "selector" +
                                    (this.state.board === custom_board.theme_name ? " active" : "")
                                }
                                style={{
                                    ...custom_board.styles,
                                    ...css2react(custom_board.getBackgroundCSS()),
                                }}
                                onClick={this.selectTheme["board"][custom_board.theme_name]}
                            >
                                <PersistentElement
                                    elt={this.canvases.board[this.canvases.board.length - 1]}
                                />
                            </div>

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
                            <div
                                title={_(custom_white.theme_name)}
                                className={
                                    "selector" +
                                    (this.state.white === custom_white.theme_name ? " active" : "")
                                }
                                style={{
                                    ...custom_white.styles,
                                    ...board_styles,
                                }}
                                onClick={this.selectTheme["white"][custom_white.theme_name]}
                            >
                                <PersistentElement
                                    elt={this.canvases.white[this.canvases.white.length - 1]}
                                />
                            </div>

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
                            <div className="custom-url-selection">
                                <input
                                    className="customUrlSelector"
                                    type="text"
                                    value={white_stone_urlCustom}
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
                            <div
                                title={_(custom_black.theme_name)}
                                className={
                                    "selector" +
                                    (this.state.black === custom_black.theme_name ? " active" : "")
                                }
                                style={{
                                    ...custom_black.styles,
                                    ...board_styles,
                                }}
                                onClick={this.selectTheme["black"][custom_black.theme_name]}
                            >
                                <PersistentElement
                                    elt={this.canvases.black[this.canvases.black.length - 1]}
                                />
                            </div>

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
                            <div className="custom-url-selection">
                                <input
                                    className="customUrlSelector"
                                    type="text"
                                    value={black_stone_urlCustom}
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

        for (let i = 0; i < Goban.THEMES_SORTED.board.length; ++i) {
            const theme = Goban.THEMES_SORTED.board[i];
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

        for (let i = 0; i < Goban.THEMES_SORTED.white.length; ++i) {
            const theme = Goban.THEMES_SORTED.white[i];
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

        for (let i = 0; i < Goban.THEMES_SORTED.black.length; ++i) {
            const theme = Goban.THEMES_SORTED.black[i];
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

function css2react(style: GobanThemeBackgroundCSS): { [k: string]: string } {
    const react_style = {};
    for (const k in style) {
        const react_key = k.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        (react_style as any)[react_key] = style[k as keyof GobanThemeBackgroundCSS];
    }

    return react_style;
}

function ThemeSample({
    theme,
    color,
    size,
}: {
    theme: GobanTheme;
    color: "black" | "white";
    size: number;
}) {
    const div = React.useRef(null);

    React.useEffect(() => {
        if (!div.current) {
            return;
        }

        const cx = size / 2;
        const cy = size / 2;
        const radius = (size / 2) * 0.95;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", size.toFixed(0));
        svg.setAttribute("height", size.toFixed(0));
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.appendChild(defs);

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        svg.appendChild(g);

        if (color === "black") {
            const black_stones = theme.preRenderBlackSVG(defs, radius, 123, () => {});
            theme.placeBlackStoneSVG(g, undefined, black_stones[0], cx, cy, radius);
        }
        if (color === "white") {
            const white_stones = theme.preRenderWhiteSVG(defs, radius, 123, () => {});
            theme.placeWhiteStoneSVG(g, undefined, white_stones[0], cx, cy, radius);
        }

        (div.current as any)?.appendChild(svg);
    }, [div.current]);

    return <div ref={div} />;
}
