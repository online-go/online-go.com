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
import { createPortal } from "react-dom";
import { interpolate, pgettext } from "@/lib/translate";
import { twitchPlayerUrl } from "./kibitzStream";
import "./KibitzStreamPlayer.css";

/**
 * Where the stream's video is on screen:
 *
 * - "docked": over the stream panel's slot, as if it were part of the panel.
 * - "mini": a small floating window in a corner of the page.
 * - "popout": in a separate always-on-top window (desktop Chrome and Edge).
 * - "off": nowhere; the player is unloaded.
 */
export type KibitzStreamPlayerMode = "docked" | "mini" | "popout" | "off";

interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

function sameRect(a: Rect | null, b: Rect | null): boolean {
    return (
        a === b ||
        (!!a &&
            !!b &&
            a.left === b.left &&
            a.top === b.top &&
            a.width === b.width &&
            a.height === b.height)
    );
}

/** The slot's place on screen, or null while it is not on screen (its pane
 *  is hidden, or it has not mounted). Followed every frame, because the
 *  slot moves with scrolling and layout changes that fire no event here. */
export function useSlotRect(slot: HTMLElement | null): Rect | null {
    const [rect, setRect] = React.useState<Rect | null>(null);
    React.useEffect(() => {
        if (!slot) {
            setRect(null);
            return undefined;
        }
        let frame = 0;
        let last: Rect | null = null;
        const measure = () => {
            const r = slot.getBoundingClientRect();
            const next =
                r.width > 0 && r.height > 0
                    ? { left: r.left, top: r.top, width: r.width, height: r.height }
                    : null;
            if (!sameRect(next, last)) {
                last = next;
                setRect(next);
            }
            frame = requestAnimationFrame(measure);
        };
        measure();
        return () => cancelAnimationFrame(frame);
    }, [slot]);
    return rect;
}

// The Document Picture-in-Picture API is in Chromium browsers only and is
// not in TypeScript's DOM types yet.
interface DocumentPictureInPicture {
    requestWindow(options: { width: number; height: number }): Promise<Window>;
}
function documentPip(): DocumentPictureInPicture | null {
    return (
        (window as unknown as { documentPictureInPicture?: DocumentPictureInPicture })
            .documentPictureInPicture ?? null
    );
}

export function popoutSupported(): boolean {
    return documentPip() !== null;
}

/** A separate always-on-top window for the stream, where the browser
 *  supports one. It closes with the page that opened it. */
export function usePopoutWindow(): {
    window: Window | null;
    open: () => Promise<void>;
    close: () => void;
} {
    const [popout, setPopout] = React.useState<Window | null>(null);
    const popoutRef = React.useRef<Window | null>(null);

    const open = React.useCallback(async () => {
        const pip = documentPip();
        if (!pip || popoutRef.current) {
            return;
        }
        try {
            const win = await pip.requestWindow({ width: 480, height: 270 });
            win.document.title = pgettext("Title of the Kibitz stream's pop-out window", "Stream");
            const style = win.document.createElement("style");
            style.textContent =
                "html,body{margin:0;height:100%;background:#000;overflow:hidden}iframe{border:0;display:block;width:100%;height:100%}";
            win.document.head.appendChild(style);
            win.addEventListener("pagehide", () => {
                popoutRef.current = null;
                setPopout(null);
            });
            popoutRef.current = win;
            setPopout(win);
        } catch (error) {
            console.warn("kibitz: stream pop-out failed", error);
        }
    }, []);

    const close = React.useCallback(() => {
        popoutRef.current?.close();
    }, []);

    React.useEffect(() => () => popoutRef.current?.close(), []);

    return { window: popout, open, close };
}

function StreamFrame({ channel }: { channel: string }): React.ReactElement {
    return (
        <iframe
            src={twitchPlayerUrl(channel)}
            allow="autoplay; fullscreen"
            allowFullScreen
            title={interpolate(
                pgettext(
                    "Accessible name of a stream player in a Kibitz room",
                    "Stream: {{channel}}",
                ),
                { channel },
            )}
        />
    );
}

interface KibitzStreamPlayerProps {
    channel: string | null;
    mode: KibitzStreamPlayerMode;
    /** Where the docked player sits. */
    slotRect: Rect | null;
    popoutWindow: Window | null;
    canPopout: boolean;
    /** Mini player: back to the full-size stream. */
    onExpand: () => void;
    onPopout: () => void;
    /** Mini player: closes it. */
    onClose: () => void;
}

const MINI_MARGIN = 8;

/**
 * The room's stream player. There is one, and it stays mounted while it
 * moves between the panel and the mini player, so moving it never reloads
 * the stream. Only the pop-out window, which is another document, gets a
 * player of its own.
 */
export function KibitzStreamPlayer({
    channel,
    mode,
    slotRect,
    popoutWindow,
    canPopout,
    onExpand,
    onPopout,
    onClose,
}: KibitzStreamPlayerProps): React.ReactElement | null {
    // The mini player's offset from the bottom-right corner, as the reader
    // left it after dragging.
    const [offset, setOffset] = React.useState({ right: MINI_MARGIN, bottom: 72 });
    const drag = React.useRef<{
        x: number;
        y: number;
        right: number;
        bottom: number;
    } | null>(null);

    if (!channel || mode === "off") {
        return null;
    }

    if (mode === "popout") {
        return popoutWindow
            ? createPortal(
                  <StreamFrame key={channel} channel={channel} />,
                  popoutWindow.document.body,
              )
            : null;
    }

    // Docked while its slot is off screen for a moment (mounting, or a
    // layout change), the player stays mounted but out of sight, so the
    // stream does not reload.
    const style: React.CSSProperties =
        mode === "mini"
            ? { right: offset.right, bottom: offset.bottom }
            : slotRect
              ? {
                    left: slotRect.left,
                    top: slotRect.top,
                    width: slotRect.width,
                    height: slotRect.height,
                }
              : { left: -10000, top: 0, width: 1, height: 1, visibility: "hidden" };

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).closest("button")) {
            return;
        }
        drag.current = { x: event.clientX, y: event.clientY, ...offset };
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const start = drag.current;
        if (!start) {
            return;
        }
        const box = event.currentTarget.parentElement?.getBoundingClientRect();
        const width = box?.width ?? 0;
        const height = box?.height ?? 0;
        const clamp = (value: number, max: number) =>
            Math.min(Math.max(value, MINI_MARGIN), Math.max(MINI_MARGIN, max - MINI_MARGIN));
        setOffset({
            right: clamp(start.right - (event.clientX - start.x), window.innerWidth - width),
            bottom: clamp(start.bottom - (event.clientY - start.y), window.innerHeight - height),
        });
    };
    const onPointerUp = () => {
        drag.current = null;
    };

    return createPortal(
        <div className={`KibitzStreamPlayer KibitzStreamPlayer-${mode}`} style={style}>
            {mode === "mini" ? (
                <div
                    className="KibitzStreamPlayer-handle"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    <span className="KibitzStreamPlayer-grip" aria-hidden="true">
                        <i className="fa fa-arrows" />
                    </span>
                    <button
                        type="button"
                        onClick={onExpand}
                        title={pgettext("Makes the Kibitz mini player full size again", "Expand")}
                        aria-label={pgettext(
                            "Makes the Kibitz mini player full size again",
                            "Expand",
                        )}
                    >
                        <i className="fa fa-expand" />
                    </button>
                    {canPopout ? (
                        <button
                            type="button"
                            onClick={onPopout}
                            title={pgettext(
                                "Opens the Kibitz stream in a separate window that stays on top",
                                "Pop out",
                            )}
                            aria-label={pgettext(
                                "Opens the Kibitz stream in a separate window that stays on top",
                                "Pop out",
                            )}
                        >
                            <i className="fa fa-external-link" />
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={onClose}
                        title={pgettext("Closes the Kibitz mini player", "Close")}
                        aria-label={pgettext("Closes the Kibitz mini player", "Close")}
                    >
                        <i className="fa fa-times" />
                    </button>
                </div>
            ) : null}
            <div className="KibitzStreamPlayer-frame">
                <StreamFrame key={channel} channel={channel} />
            </div>
        </div>,
        document.body,
    );
}
