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
import { _, pgettext } from "@/lib/translate";
import { Goban, GobanTheme /*, GobanThemeBackgroundCSS */ } from "goban";
import { getSelectedThemes, usePreference } from "@/lib/preferences";
import { PersistentElement } from "@/components/PersistentElement";
import { Experiment, Variant, Default } from "../Experiment";
import { LineText } from "../misc-ui";
import { Link } from "react-router-dom";

interface GobanThemePickerProperties {
    size?: number;
}

function renderSampleBoard(canvas: HTMLCanvasElement, theme: GobanTheme, size: number): void {
    const square_size = size;
    canvas.width = square_size;
    canvas.height = square_size;
    theme.styles = Object.assign(
        {
            height: size + "px",
            width: size + "px",
        },
        theme.getReactStyles(),
    ) as unknown as { [style_name: string]: string };

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Could not get 2d context for canvas");
        return;
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

export function GobanBoardThemePicker(props: GobanThemePickerProperties): React.ReactElement {
    const size = props.size || 44;
    const canvases = React.useRef<HTMLCanvasElement[]>([]);
    const selectTheme = React.useRef<{ [k: string]: () => void }>({});
    const [, setCanvasesRenderedCt] = React.useState(0);
    const [, setBoard] = usePreference("goban-theme-board");

    const selected = getSelectedThemes();

    React.useEffect(() => {
        canvases.current.length = 0;

        for (const theme of Goban.THEMES_SORTED.board) {
            selectTheme.current[theme.theme_name] = () => {
                setBoard(theme.theme_name);
            };

            const canvas = document.createElement("canvas");
            renderSampleBoard(canvas, theme, size);
            canvases.current.push(canvas);
        }

        setCanvasesRenderedCt(canvases.current.length);
    }, [size]);

    const standard_themes = Goban.THEMES_SORTED.board.filter((x) => x.theme_name !== "Custom");

    return (
        <div className="GobanThemePicker">
            <div className="theme-set">
                {standard_themes.map((theme, idx) => (
                    <div
                        key={theme.theme_name}
                        title={_(theme.theme_name)}
                        className={
                            "selector" + (selected.board === theme.theme_name ? " active" : "")
                        }
                        style={theme.styles}
                        onClick={selectTheme.current[theme.theme_name]}
                    >
                        {canvases.current[idx] && <PersistentElement elt={canvases.current[idx]} />}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function GobanCustomBoardPicker(props: GobanThemePickerProperties): React.ReactElement {
    const size = props.size || 44;

    const [line_color, _setLineColor] = usePreference("goban-theme-custom-board-line");
    const [background_color, _setBackgroundColor] = usePreference(
        "goban-theme-custom-board-background",
    );
    const [background_image, _setBackgroundImage] = usePreference("goban-theme-custom-board-url");
    const sample_canvas = React.useRef<HTMLCanvasElement | undefined>(undefined);
    const [, refresh] = React.useState(0);
    const theme = Goban.THEMES_SORTED.board.filter((x) => x.theme_name === "Custom")[0];
    const [, setBoard] = usePreference("goban-theme-board");
    const selected = getSelectedThemes();

    const inputStyle = { height: `${size}px`, width: `${size * 1.5}px` };

    if (!theme) {
        requestAnimationFrame(() => refresh((x) => x + 1));
    }

    React.useEffect(() => {
        sample_canvas.current = document.createElement("canvas");
        renderSampleBoard(sample_canvas.current, theme, size);
        refresh((x) => x + 1);
    }, [theme, size, background_color, line_color, background_image]);

    function setBackgroundColor(ev: React.ChangeEvent<HTMLInputElement>) {
        _setBackgroundColor(ev.target.value);
    }

    function setLineColor(ev: React.ChangeEvent<HTMLInputElement>) {
        _setLineColor(ev.target.value);
    }

    function setBackgroundImage(ev: React.ChangeEvent<HTMLInputElement>) {
        _setBackgroundImage(ev.target.value);
    }

    if (!sample_canvas.current) {
        return <></>;
    }

    return (
        <div className="GobanCustomBoardPicker">
            <LineText className="customize">
                {pgettext("Create and use a custom board theme", "Customize board")}
            </LineText>

            <div className="GobanThemePicker">
                <div className="theme-set">
                    <div className="select-custom">
                        <div
                            key={theme.theme_name}
                            title={_(theme.theme_name)}
                            className={"selector" + (selected.board === "Custom" ? " active" : "")}
                            style={theme.styles}
                            onClick={() => setBoard("Custom")}
                        >
                            {sample_canvas && <PersistentElement elt={sample_canvas.current} />}
                        </div>
                    </div>

                    <input
                        type="color"
                        style={inputStyle}
                        value={background_color}
                        onChange={setBackgroundColor}
                    />
                    <button className="color-reset" onClick={() => _setBackgroundColor("")}>
                        <i className="fa fa-undo" />
                    </button>

                    <input
                        type="color"
                        style={inputStyle}
                        value={line_color}
                        onChange={setLineColor}
                    />
                    <button className="color-reset" onClick={() => _setLineColor("")}>
                        <i className="fa fa-undo" />
                    </button>
                </div>
            </div>

            <div className="custom-url-selection">
                <input
                    className="customUrlSelector"
                    type="text"
                    value={background_image}
                    placeholder={pgettext(
                        "Custom background image url for the goban",
                        "Custom background URL",
                    )}
                    onFocus={(e) => e.target.select()}
                    onChange={setBackgroundImage}
                />

                <button className="color-reset" onClick={() => _setBackgroundImage("")}>
                    <i className="fa fa-undo" />
                </button>
            </div>
        </div>
    );
}

export function renderSampleStone(
    canvas: HTMLCanvasElement,
    theme: GobanTheme,
    size: number,
    color: "white" | "black",
): void {
    canvas.setAttribute("width", size.toString());
    canvas.setAttribute("height", size.toString());
    theme.styles = Object.assign(
        {
            height: size + "px",
            width: size + "px",
        },
        theme.getReactStyles(),
    ) as unknown as { [style_name: string]: string };

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get 2d context for canvas");
    }
    const radius = Math.round(size / 2.2);

    if (color === "white") {
        const draw = () => {
            ctx.clearRect(0, 0, size, size);
            theme.placeWhiteStone(ctx, ctx, stones[0], size / 2, size / 2, radius);
        };
        const stones = theme.preRenderWhite(radius, 23434, draw);
        draw();
    } else {
        const draw = () => {
            ctx.clearRect(0, 0, size, size);
            theme.placeBlackStone(ctx, ctx, stones[0], size / 2, size / 2, radius);
        };
        const stones = theme.preRenderBlack(radius, 23434, draw);
        draw();
    }
}

export function GobanWhiteThemePicker(props: GobanThemePickerProperties): React.ReactElement {
    const size = props.size || 44;

    const canvases = React.useRef<HTMLCanvasElement[]>([]);
    const selectTheme = React.useRef<{ [k: string]: () => void }>({});
    const [, setCanvasesRenderedCt] = React.useState(0);
    const [, setWhite] = usePreference("goban-theme-white");
    usePreference("goban-theme-board"); // trigger refresh when board changes
    const selected = getSelectedThemes();
    const [background_color, _setBackgroundColor] = usePreference(
        "goban-theme-custom-board-background",
    );
    const [background_image, _setBackgroundImage] = usePreference("goban-theme-custom-board-url");
    const [, refresh] = React.useState(0);

    React.useEffect(() => {
        canvases.current.length = 0;

        for (const theme of Goban.THEMES_SORTED.white) {
            selectTheme.current[theme.theme_name] = () => {
                setWhite(theme.theme_name);
            };

            const canvas = document.createElement("canvas");
            renderSampleStone(canvas, theme, size, "white");
            canvases.current.push(canvas);
        }

        setCanvasesRenderedCt(canvases.current.length);
        refresh((x) => x + 1);
    }, [size]);

    const standard_themes = Goban.THEMES_SORTED.white.filter((x) => x.theme_name !== "Custom");
    const custom_board = Goban.THEMES_SORTED.board.filter((x) => x.theme_name === "Custom")[0];

    const active_standard_board_theme = Goban.THEMES_SORTED.board.filter(
        (x) => x.theme_name === selected.board,
    )[0];

    if (!active_standard_board_theme) {
        requestAnimationFrame(() => refresh((x) => x + 1));
    }

    const board_styles =
        selected.board === custom_board.theme_name
            ? {
                  backgroundColor: background_color,
                  backgroundImage: `url(${background_image})`,
              }
            : {
                  backgroundColor: active_standard_board_theme?.styles["backgroundColor"],
                  backgroundImage: active_standard_board_theme?.styles["backgroundImage"],
              };

    return (
        <div className="GobanThemePicker">
            <Experiment name="svg">
                <Default>
                    <div className="theme-set">
                        {standard_themes.map((theme) => (
                            <div
                                key={theme.theme_name}
                                title={_(theme.theme_name)}
                                className={
                                    "selector" +
                                    (selected.white === theme.theme_name ? " active" : "")
                                }
                                style={{
                                    ...theme.styles,
                                    ...board_styles,
                                }}
                                onClick={selectTheme.current[theme.theme_name]}
                            >
                                <ThemeSample theme={theme} size={size} color={"white"} />
                            </div>
                        ))}
                    </div>
                </Default>
                <Variant value="enabled">
                    <div className="theme-set">
                        {standard_themes.map((theme, idx) => (
                            <div
                                key={theme.theme_name}
                                title={_(theme.theme_name)}
                                className={
                                    "selector" +
                                    (selected.white === theme.theme_name ? " active" : "")
                                }
                                style={{
                                    ...theme.styles,
                                    ...board_styles,
                                }}
                                onClick={selectTheme.current[theme.theme_name]}
                            >
                                {canvases.current[idx] && (
                                    <PersistentElement elt={canvases.current[idx]} />
                                )}
                            </div>
                        ))}
                    </div>
                </Variant>
            </Experiment>
        </div>
    );
}

export function GobanCustomBlackPicker(props: GobanThemePickerProperties): React.ReactElement {
    const size = props.size || 44;

    const [url, _setUrl] = usePreference("goban-theme-custom-black-url");
    const [color, _setColor] = usePreference("goban-theme-custom-black-stone-color");
    const [, refresh] = React.useState(0);
    const theme = Goban.THEMES_SORTED.black.filter((x) => x.theme_name === "Custom")[0];
    const [, setBlack] = usePreference("goban-theme-black");
    usePreference("goban-theme-board"); // trigger refresh when board changes
    const selected = getSelectedThemes();
    const [background_color, _setBackgroundColor] = usePreference(
        "goban-theme-custom-board-background",
    );
    const [background_image, _setBackgroundImage] = usePreference("goban-theme-custom-board-url");

    const inputStyle = { height: `${size}px`, width: `${size * 1.5}px` };

    if (!theme) {
        requestAnimationFrame(() => refresh((x) => x + 1));
    }

    function setColor(ev: React.ChangeEvent<HTMLInputElement>) {
        _setColor(ev.target.value);
    }

    function setUrl(ev: React.ChangeEvent<HTMLInputElement>) {
        _setUrl(ev.target.value);
    }

    const custom_board = Goban.THEMES_SORTED.board.filter((x) => x.theme_name === "Custom")[0];

    const active_standard_board_theme = Goban.THEMES_SORTED.board.filter(
        (x) => x.theme_name === selected.board,
    )[0];
    const board_styles =
        selected.board === custom_board.theme_name
            ? {
                  backgroundColor: background_color,
                  backgroundImage: `url(${background_image})`,
              }
            : {
                  backgroundColor: active_standard_board_theme?.styles["backgroundColor"],
                  backgroundImage: active_standard_board_theme?.styles["backgroundImage"],
              };

    return (
        <div className="GobanCustomStonePicker">
            <LineText className="customize">
                {pgettext("Create and use a custom board theme", "Customize black stones")}
            </LineText>

            <div className="GobanThemePicker">
                <div className="theme-set">
                    <div className="select-custom">
                        <div
                            key={theme.theme_name}
                            title={_(theme.theme_name)}
                            className={"selector" + (selected.black === "Custom" ? " active" : "")}
                            style={{ ...theme.styles, ...board_styles }}
                            onClick={() => setBlack("Custom")}
                        >
                            <ThemeSample theme={theme} size={size} color={"black"} />
                        </div>
                    </div>

                    <input type="color" style={inputStyle} value={color} onChange={setColor} />
                    <button className="color-reset" onClick={() => _setColor("")}>
                        <i className="fa fa-undo" />
                    </button>
                </div>
            </div>

            <div className="custom-url-selection">
                <input
                    className="customUrlSelector"
                    type="text"
                    value={url}
                    placeholder={pgettext(
                        "A URL pointing to a custom black stone image",
                        "Custom black stone URL",
                    )}
                    onFocus={(e) => e.target.select()}
                    onChange={setUrl}
                />

                <button className="color-reset" onClick={() => _setUrl("")}>
                    <i className="fa fa-undo" />
                </button>
            </div>
        </div>
    );
}

export function GobanBlackThemePicker(props: GobanThemePickerProperties): React.ReactElement {
    const size = props.size || 44;

    const canvases = React.useRef<HTMLCanvasElement[]>([]);
    const selectTheme = React.useRef<{ [k: string]: () => void }>({});
    const [, setCanvasesRenderedCt] = React.useState(0);
    const [, setBlack] = usePreference("goban-theme-black");
    usePreference("goban-theme-board"); // trigger refresh when board changes
    const selected = getSelectedThemes();
    const [background_color, _setBackgroundColor] = usePreference(
        "goban-theme-custom-board-background",
    );
    const [background_image, _setBackgroundImage] = usePreference("goban-theme-custom-board-url");
    const [, refresh] = React.useState(0);

    React.useEffect(() => {
        canvases.current.length = 0;

        for (const theme of Goban.THEMES_SORTED.black) {
            selectTheme.current[theme.theme_name] = () => {
                setBlack(theme.theme_name);
            };

            const canvas = document.createElement("canvas");
            renderSampleStone(canvas, theme, size, "black");
            canvases.current.push(canvas);
        }

        setCanvasesRenderedCt(canvases.current.length);
        refresh((x) => x + 1);
    }, [size]);

    const standard_themes = Goban.THEMES_SORTED.black.filter((x) => x.theme_name !== "Custom");
    const custom_board = Goban.THEMES_SORTED.board.filter((x) => x.theme_name === "Custom")[0];

    const active_standard_board_theme = Goban.THEMES_SORTED.board.filter(
        (x) => x.theme_name === selected.board,
    )[0];

    if (!active_standard_board_theme) {
        requestAnimationFrame(() => refresh((x) => x + 1));
    }

    const board_styles =
        selected.board === custom_board.theme_name
            ? {
                  backgroundColor: background_color,
                  backgroundImage: `url(${background_image})`,
              }
            : {
                  backgroundColor: active_standard_board_theme?.styles["backgroundColor"],
                  backgroundImage: active_standard_board_theme?.styles["backgroundImage"],
              };

    return (
        <div className="GobanThemePicker">
            <Experiment name="canvas">
                <Default>
                    <div className="theme-set">
                        {standard_themes.map((theme) => (
                            <div
                                key={theme.theme_name}
                                title={_(theme.theme_name)}
                                className={
                                    "selector" +
                                    (selected.black === theme.theme_name ? " active" : "")
                                }
                                style={{
                                    ...theme.styles,
                                    ...board_styles,
                                }}
                                onClick={selectTheme.current[theme.theme_name]}
                            >
                                <ThemeSample theme={theme} size={size} color={"black"} />
                            </div>
                        ))}
                    </div>
                </Default>
                <Variant value="enabled">
                    <div className="theme-set">
                        {standard_themes.map((theme, idx) => (
                            <div
                                key={theme.theme_name}
                                title={_(theme.theme_name)}
                                className={
                                    "selector" +
                                    (selected.black === theme.theme_name ? " active" : "")
                                }
                                style={{
                                    ...theme.styles,
                                    ...board_styles,
                                }}
                                onClick={selectTheme.current[theme.theme_name]}
                            >
                                {canvases.current[idx] && (
                                    <PersistentElement elt={canvases.current[idx]} />
                                )}
                            </div>
                        ))}
                    </div>
                </Variant>
            </Experiment>
        </div>
    );
}

export function GobanCustomWhitePicker(props: GobanThemePickerProperties): React.ReactElement {
    const size = props.size || 44;

    const [url, _setUrl] = usePreference("goban-theme-custom-white-url");
    const [color, _setColor] = usePreference("goban-theme-custom-white-stone-color");
    const [, refresh] = React.useState(0);
    const theme = Goban.THEMES_SORTED.white.filter((x) => x.theme_name === "Custom")[0];
    const [, setWhite] = usePreference("goban-theme-white");
    const selected = getSelectedThemes();

    const inputStyle = { height: `${size}px`, width: `${size * 1.5}px` };

    if (!theme) {
        requestAnimationFrame(() => refresh((x) => x + 1));
    }

    function setColor(ev: React.ChangeEvent<HTMLInputElement>) {
        _setColor(ev.target.value);
    }

    function setUrl(ev: React.ChangeEvent<HTMLInputElement>) {
        _setUrl(ev.target.value);
    }

    return (
        <div className="GobanCustomStonePicker">
            <LineText className="customize">
                {pgettext("Create and use a custom board theme", "Customize white stones")}
            </LineText>

            <div className="GobanThemePicker">
                <div className="theme-set">
                    <div className="select-custom">
                        <div
                            key={theme.theme_name}
                            title={_(theme.theme_name)}
                            className={"selector" + (selected.white === "Custom" ? " active" : "")}
                            style={theme.styles}
                            onClick={() => setWhite("Custom")}
                        >
                            <ThemeSample theme={theme} size={size} color={"white"} />
                        </div>
                    </div>

                    <input type="color" style={inputStyle} value={color} onChange={setColor} />
                    <button className="color-reset" onClick={() => _setColor("")}>
                        <i className="fa fa-undo" />
                    </button>
                </div>
            </div>

            <div className="custom-url-selection">
                <input
                    className="customUrlSelector"
                    type="text"
                    value={url}
                    placeholder={pgettext(
                        "A URL pointing to a custom white stone image",
                        "Custom white stone URL",
                    )}
                    onFocus={(e) => e.target.select()}
                    onChange={setUrl}
                />

                <button className="color-reset" onClick={() => _setUrl("")}>
                    <i className="fa fa-undo" />
                </button>
            </div>
        </div>
    );
}

export function GobanThemePicker(props: GobanThemePickerProperties): React.ReactElement {
    return (
        <div className="GobanThemePicker">
            <GobanBoardThemePicker {...props} />
            <GobanWhiteThemePicker {...props} />
            <GobanBlackThemePicker {...props} />
            <Link to="/settings/theme" style={{ justifyContent: "center" }}>
                {pgettext("Link to settings page with more theme options", "More options")}
            </Link>
        </div>
    );
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
    const div = React.useRef<HTMLDivElement>(null);

    const [black] = usePreference("goban-theme-black");
    const [white] = usePreference("goban-theme-white");
    const [board] = usePreference("goban-theme-board");
    const [board_bg] = usePreference("goban-theme-custom-board-background");
    const [board_url] = usePreference("goban-theme-custom-board-url");
    const [black_color] = usePreference("goban-theme-custom-black-stone-color");
    const [black_url] = usePreference("goban-theme-custom-black-url");
    const [white_color] = usePreference("goban-theme-custom-white-stone-color");
    const [white_url] = usePreference("goban-theme-custom-white-url");

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

        div.current.appendChild(svg);

        return () => {
            div.current?.removeChild(svg);
        };
    }, [
        div,
        div.current,
        black,
        white,
        board,
        board_bg,
        board_url,
        black_color,
        black_url,
        white_color,
        white_url,
    ]);

    return <div ref={div} />;
}
