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
import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzRoomBroadcast } from "@/models/kibitz";
import type { Stream } from "@/views/GoTV/StreamManager";
import { twitchChatUrl, type useKibitzStream } from "./kibitzStream";
import type { KibitzStreamPlayerMode } from "./KibitzStreamPlayer";
import { useLiveStreams } from "./useLiveStreams";
import "./KibitzStreamPanel.css";

export type KibitzStreamState = ReturnType<typeof useKibitzStream>;

interface KibitzStreamPanelProps {
    broadcast: KibitzRoomBroadcast | null | undefined;
    stream: KibitzStreamState;
    /** Portrait shows the panel as a pane of its own; it fills the pane
     *  rather than keeping the landscape column's fixed height. */
    fill?: boolean;
    /** Receives the element the docked player covers. */
    onSlot: (slot: HTMLDivElement | null) => void;
    /** Where the player is now, so the panel can say when it is elsewhere. */
    playerMode: KibitzStreamPlayerMode;
    canPopout: boolean;
    /** Absent where the panel itself is what the mini player returns to
     *  only by leaving it (portrait: leaving the pane makes it mini). */
    onMini?: () => void;
    onPopout: () => void;
    /** Brings the player back into the panel from the mini player or the
     *  pop-out window. */
    onDock: () => void;
}

function useDarkTheme(): boolean {
    const read = () => document.documentElement.dataset.theme !== "light";
    const [dark, setDark] = React.useState(read);
    React.useEffect(() => {
        const observer = new MutationObserver(() => setDark(read()));
        observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
        return () => observer.disconnect();
    }, []);
    return dark;
}

/** Lets a viewer pick another live GoTV stream for themselves. */
function StreamSwitcher({
    current,
    onPick,
    onCancel,
}: {
    current: string | null;
    onPick: (channel: string) => void;
    onCancel: () => void;
}): React.ReactElement {
    const streams = useLiveStreams();
    return (
        <div className="KibitzStreamPanel-switcher">
            {streams.length === 0 ? (
                <div className="KibitzStreamPanel-note">
                    {pgettext(
                        "Shown in a Kibitz room when no GoTV stream is live to switch to",
                        "No streams are live right now.",
                    )}
                </div>
            ) : (
                <ul>
                    {streams.map((s: Stream) => (
                        <li key={s.stream_id}>
                            <button
                                type="button"
                                className={
                                    s.channel.toLowerCase() === current?.toLowerCase()
                                        ? "active"
                                        : undefined
                                }
                                onClick={() => onPick(s.channel)}
                            >
                                <span className="KibitzStreamPanel-switcherName">{s.username}</span>
                                <span className="KibitzStreamPanel-switcherTitle">{s.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <button type="button" className="xs" onClick={onCancel}>
                {pgettext("Closes the Kibitz stream list without switching", "Cancel")}
            </button>
        </div>
    );
}

/**
 * The stream a Kibitz room shows beside its board. The room recommends a
 * stream; each viewer may hide it, watch another one, or open the stream's
 * chat, and none of that changes what anyone else sees.
 */
export function KibitzStreamPanel({
    broadcast,
    stream,
    fill = false,
    onSlot,
    playerMode,
    canPopout,
    onMini,
    onPopout,
    onDock,
}: KibitzStreamPanelProps): React.ReactElement | null {
    const dark = useDarkTheme();
    const [switching, setSwitching] = React.useState(false);
    const [showChat, setShowChat] = React.useState(false);

    if (stream.hidden) {
        return (
            <div className="KibitzStreamPanel KibitzStreamPanel-collapsed">
                <button type="button" className="xs" onClick={stream.show}>
                    <i className="fa fa-television" />{" "}
                    {pgettext("Shows a Kibitz room's stream again after hiding it", "Show stream")}
                </button>
            </div>
        );
    }

    if (!stream.channel) {
        return null;
    }

    const channel = stream.channel;
    const label = stream.isRoomStream && broadcast?.title ? broadcast.title : channel;

    return (
        <div className={`KibitzStreamPanel${fill ? " KibitzStreamPanel-fill" : ""}`}>
            <div className="KibitzStreamPanel-bar">
                <span className="KibitzStreamPanel-label" title={label}>
                    <i className="fa fa-television" /> {label}
                </span>
                {!stream.isRoomStream && broadcast ? (
                    <button
                        type="button"
                        className="xs"
                        onClick={stream.useRoomStream}
                        title={interpolate(
                            pgettext(
                                "Tooltip on the Kibitz action that goes back to the room's own stream",
                                "Back to {{channel}}",
                            ),
                            { channel: broadcast.channel },
                        )}
                    >
                        {pgettext(
                            "Goes back to the stream a Kibitz room recommends",
                            "Room's stream",
                        )}
                    </button>
                ) : null}
                <button
                    type="button"
                    className="xs"
                    aria-pressed={switching}
                    onClick={() => setSwitching((v) => !v)}
                >
                    {pgettext("Opens the list of streams to watch in a Kibitz room", "Switch")}
                </button>
                <button
                    type="button"
                    className="xs"
                    aria-pressed={showChat}
                    onClick={() => setShowChat((v) => !v)}
                >
                    {pgettext("Shows or hides a stream's own chat in a Kibitz room", "Stream chat")}
                </button>
                {onMini && playerMode === "docked" ? (
                    <button
                        type="button"
                        className="xs"
                        onClick={onMini}
                        title={pgettext(
                            "Moves the Kibitz stream into a small floating player",
                            "Mini player",
                        )}
                        aria-label={pgettext(
                            "Moves the Kibitz stream into a small floating player",
                            "Mini player",
                        )}
                    >
                        <i className="fa fa-compress" />
                    </button>
                ) : null}
                {canPopout && playerMode !== "popout" ? (
                    <button
                        type="button"
                        className="xs"
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
                    className="xs"
                    onClick={stream.hide}
                    title={pgettext(
                        "Tooltip on the Kibitz action that hides the stream for this viewer only",
                        "Hide the stream for yourself. Others still see it.",
                    )}
                >
                    <i className="fa fa-times" />
                </button>
            </div>
            {switching ? (
                <StreamSwitcher
                    current={channel}
                    onPick={(next) => {
                        stream.watch(next);
                        setSwitching(false);
                    }}
                    onCancel={() => setSwitching(false)}
                />
            ) : null}
            {playerMode === "mini" || playerMode === "popout" ? (
                <div className="KibitzStreamPanel-elsewhere">
                    <span>
                        {playerMode === "popout"
                            ? pgettext(
                                  "Shown in a Kibitz room's stream panel while the stream plays in a separate window",
                                  "Playing in a separate window.",
                              )
                            : pgettext(
                                  "Shown in a Kibitz room's stream panel while the stream plays in the mini player",
                                  "Playing in the mini player.",
                              )}
                    </span>
                    <button type="button" className="xs" onClick={onDock}>
                        {pgettext(
                            "Brings the Kibitz stream back into the room's stream panel",
                            "Bring back",
                        )}
                    </button>
                </div>
            ) : (
                // The player itself is drawn over this slot (see
                // KibitzStreamPlayer), so moving it never reloads it.
                <div className="KibitzStreamPanel-video" ref={onSlot} />
            )}
            {showChat ? (
                <div className="KibitzStreamPanel-chat">
                    <iframe
                        key={`${channel}-${dark}`}
                        src={twitchChatUrl(channel, dark)}
                        title={interpolate(
                            pgettext(
                                "Accessible name of a stream's chat in a Kibitz room",
                                "Stream chat: {{channel}}",
                            ),
                            { channel },
                        )}
                    />
                </div>
            ) : null}
        </div>
    );
}
