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
import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/sockets";
import { challenge } from "@/components/ChallengeModal";
import { createModeratorNote } from "@/components/ModNoteModal";
import { _, pgettext, interpolate } from "@/lib/translate";
import * as data from "@/lib/data";
import ITC from "@/lib/ITC";
import { splitOnBytes, unicodeFilter } from "@/lib/misc";
import { profanity_filter } from "@/lib/profanity_filter";
import { player_is_ignored } from "@/components/BlockPlayer";
import { emitNotification } from "@/components/Notifications/NotificationManager";
import { PlayerCacheEntry } from "@/lib/player_cache";
import * as player_cache from "@/lib/player_cache";
import online_status from "@/lib/online_status";
import { openReport } from "@/components/Report";
import { alert } from "@/lib/swal_config";
import { TabCompleteInput } from "@/components/TabCompleteInput";
import { chat_markup } from "@/lib/chat_markup";

const date_format: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
};

interface PrivateChatProps {
    user_id: number;
    username: string;
    onClose?: () => void;
}

interface ChatLine {
    from: string;
    text: string;
    user_id: number;
    timestamp: number;
    isAction?: boolean;
}

interface PrivateChatProps {
    user_id: number;
    username: string;
    onClose?: () => void;
    displayState?: "open" | "minimized" | "closed";
}

export const PrivateChat = React.forwardRef<any, PrivateChatProps>((props, ref) => {
    const { user_id, username, onClose, displayState: initialDisplayState = "open" } = props;
    const [displayState, setDisplayState] = useState<"open" | "minimized" | "closed">(
        initialDisplayState,
    );

    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
        setDisplayState,
        sendChat,
        handleClose,
    }));

    const [player, setPlayer] = useState<PlayerCacheEntry>({
        id: user_id,
        username: "...",
        ui_class: "",
    });
    const [superchatEnabled, setSuperchatEnabled] = useState(false);
    const [lines, setLines] = useState<ChatLine[]>([]);
    const [lastDate, setLastDate] = useState(
        new Date(Date.now() - 864e5).toLocaleDateString(undefined, date_format),
    );
    const [floating] = useState(false);
    const [receivedMessages, setReceivedMessages] = useState<{ [key: string]: boolean }>({});
    const [lastUid, setLastUid] = useState<string>();
    const [isIgnored, setIsIgnored] = useState(false);
    const [chatBase] = useState(Math.floor(Math.random() * 100000).toString(36));
    const [chatNum, setChatNum] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const onlineStatusCallback = React.useCallback((_: number, isOnline: boolean) => {
        const playerDom = containerRef.current?.querySelector(".user.Player") as HTMLElement;
        if (playerDom) {
            if (isOnline) {
                playerDom.classList.remove("offline");
                playerDom.classList.add("online");
            } else {
                playerDom.classList.add("offline");
                playerDom.classList.remove("online");
            }
        }
    }, []);

    const handleSuperchat = React.useCallback(
        (config: { player_id: number; enable: boolean }) => {
            if (config.player_id === user_id) {
                setSuperchatEnabled(config.enable);
                if (config.enable) {
                    setDisplayState("open");
                }
            }
        },
        [user_id, setSuperchatEnabled, setDisplayState],
    );

    useEffect(() => {
        socket.send("chat/pm/load", { player_id: user_id });

        // Listen for superchat events
        socket.on("private-superchat", handleSuperchat);

        if (user_id) {
            online_status.subscribe(user_id, onlineStatusCallback);

            player_cache
                .fetch(user_id, ["username", "ui_class"])
                .then((player) => {
                    setPlayer(player);
                    if (player.ui_class?.match(/moderator/) && !data.get("user").is_moderator) {
                        setDisplayState("open");
                    }
                })
                .catch((err) => {
                    console.error(err);
                });

            // Check if player is ignored
            setIsIgnored(player_is_ignored(user_id));
        }

        // Cleanup
        return () => {
            socket.off("private-superchat", handleSuperchat);
            if (user_id) {
                online_status.unsubscribe(user_id, onlineStatusCallback);
            }
        };
    }, [user_id]);

    const addChat = React.useCallback(
        (from: string, txt: string, user_id: number, timestamp: number) => {
            from = unicodeFilter(from);
            const isAction = typeof txt === "string" && txt.substr(0, 4) === "/me ";
            const text = isAction ? txt.substr(4) : txt;

            // Check if we've already received this message
            const messageKey = `${txt} ${timestamp} ${from}`;
            if (receivedMessages[messageKey]) {
                return;
            }

            setLines((prevLines) => [...prevLines, { from, text, user_id, timestamp, isAction }]);

            if (bodyRef.current) {
                const body = bodyRef.current;
                const wasAtBottom = body.scrollHeight - body.scrollTop <= body.clientHeight + 50;
                setTimeout(() => {
                    if (wasAtBottom) {
                        body.scrollTop = body.scrollHeight;
                    }
                }, 0);
            }

            // Send notification if the chat is not focused and the message is not from us
            if (displayState !== "open" && user_id !== data.get("user").id) {
                emitNotification(from, txt, () => {
                    setDisplayState("open");
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                });
            }
        },
        [displayState, receivedMessages],
    );

    const sendChat = React.useCallback(
        (msg: string, as_system?: true) => {
            if (data.get("appeals.banned_user_id")) {
                void alert.fire(_("Your account is suspended - you cannot send messages."));
                return;
            }

            if (isIgnored && !as_system) {
                void alert.fire(_("You cannot send messages to an ignored user"));
                return;
            }

            while (msg.length) {
                const arr = splitOnBytes(msg, 500);
                const line = arr[0];
                msg = arr[1];

                addChat(data.get("user").username, line, user_id, Date.now() / 1000);
                const uid = chatBase + "." + (chatNum + 1).toString(36);
                setChatNum((prev) => prev + 1);
                setLastUid(uid);

                socket.send(
                    "chat/pm",
                    {
                        player_id: user_id,
                        username: player.username || "<e>",
                        uid,
                        message: line,
                        as_system,
                    },
                    (line) => {
                        if (line) {
                            setReceivedMessages((prev) => ({
                                ...prev,
                                [line.message.i + " " + line.message.t + " " + line.from.username]:
                                    true,
                            }));
                        }
                    },
                );
            }
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        },
        [addChat, chatBase, chatNum, isIgnored, player.username, user_id],
    );

    const handleKeyPress = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (
                !data.get("user").email_validated &&
                (player.ui_class?.indexOf("moderator") || 0) < 0 &&
                lines.length === 0
            ) {
                return;
            }

            if (e.key === "Enter") {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value === "") {
                    return;
                }
                sendChat(value);
                e.preventDefault();
            }
        },
        [lines.length, player.ui_class, sendChat],
    );

    const getInputPlaceholder = React.useCallback(() => {
        if (
            !data.get("user").email_validated &&
            (player.ui_class?.indexOf("moderator") || 0) < 0 &&
            lines.length === 0
        ) {
            return _("Chat will be enabled once your email address has been validated");
        }
        if (user_id) {
            return interpolate(
                pgettext(
                    "This is the placeholder text for the chat input field in games, chat channels, and private messages",
                    "Message {{who}}",
                ),
                { who: player.username },
            );
        }
        return "";
    }, [lines.length, player.ui_class, player.username, user_id]);

    const handleClose = React.useCallback(() => {
        setDisplayState("closed");
        if (onClose) {
            onClose();
        }
        ITC.send("private-chat-close", {
            user_id: user_id,
            username: player.username,
        });
        data.set(`pm.close-${user_id}`, lastUid);
        socket.send("chat/pm/close", { player_id: user_id });
    }, [lastUid, onClose, player.username, user_id]);

    const handleMinimize = React.useCallback(() => {
        if (superchatEnabled) {
            return;
        }
        setDisplayState("minimized");
        ITC.send("private-chat-minimize", {
            user_id: user_id,
            username: player.username,
        });
    }, [player.username, superchatEnabled, user_id]);

    // Unused in this version as we handle maximize through the click handler in the minimized view

    const handleSuperchatToggle = React.useCallback(() => {
        const newState = !superchatEnabled;
        setSuperchatEnabled(newState);
        socket.send("chat/pm/superchat", {
            player_id: user_id,
            username: player.username || "<e>",
            enable: newState,
        });
    }, [player.username, superchatEnabled, user_id]);

    const renderChatLine = React.useCallback(
        (line: ChatLine) => {
            const ts = new Date(line.timestamp * 1000);
            const showDate = lastDate !== ts.toLocaleDateString(undefined, date_format);
            if (showDate) {
                setLastDate(ts.toLocaleDateString(undefined, date_format));
            }

            return (
                <div
                    key={`${line.timestamp}-${line.from}`}
                    className={`chat-line chat-user-${line.user_id}`}
                >
                    {showDate && (
                        <div className="date">{ts.toLocaleDateString(undefined, date_format)}</div>
                    )}
                    <span className="timestamp">
                        [{ts.getHours()}:{(ts.getMinutes() < 10 ? "0" : "") + ts.getMinutes()}]{" "}
                    </span>
                    {line.isAction ? (
                        <>
                            <span> ** </span>
                            <span className="username">{line.from}</span>
                            <span> </span>
                        </>
                    ) : (
                        <>
                            <span className="username">{line.from}</span>
                            <span>: </span>
                        </>
                    )}
                    <span
                        dangerouslySetInnerHTML={{
                            __html: chat_markup(profanity_filter(line.text)) || "",
                        }}
                    />
                </div>
            );
        },
        [lastDate],
    );

    if (displayState === "closed") {
        return <></>;
    }

    const windowClasses = ["private-chat-window", displayState];
    if (superchatEnabled) {
        windowClasses.push("superchat");
    }
    if (!user_id) {
        windowClasses.push("system");
    }
    if (floating) {
        windowClasses.push("floating");
    }

    return (
        <div ref={containerRef} className={windowClasses.join(" ")}>
            <div className="paper-shadow top z2" />
            <div className="paper-shadow bottom z2" />
            <div className="title">
                <span className={`user Player nolink ${player.ui_class || ""}`}>
                    {player.username || username || "..."}
                </span>
                {data.get("user").is_moderator && (
                    <>
                        <i
                            className={`fa fa-bullhorn ${superchatEnabled ? "enabled" : ""}`}
                            onClick={handleSuperchatToggle}
                        />
                        <i
                            className="fa fa-clipboard"
                            onClick={() => createModeratorNote(user_id, "")}
                        />
                    </>
                )}
                {!data.get("user").is_moderator && user_id && (
                    <>
                        <i
                            className="fa fa-exclamation-triangle"
                            onClick={() => openReport({ reported_user_id: user_id })}
                        />
                        <i className="ogs-goban" onClick={() => challenge(user_id)} />
                    </>
                )}
                {user_id && (
                    <i
                        className="fa fa-info-circle"
                        onClick={() =>
                            window.open(
                                `/user/view/${user_id}/${encodeURIComponent(
                                    unicodeFilter(player.username || ""),
                                )}`,
                                "_blank",
                            )
                        }
                    />
                )}
                <i className="fa fa-minus" onClick={handleMinimize} />
                <i className="fa fa-times" onClick={handleClose} />
            </div>

            {player.ui_class?.match(/moderator/) && (
                <div className={`banner ${superchatEnabled ? "" : "banner-inactive"}`}>
                    <div className={`banner-text ${superchatEnabled ? "megaphone-banner" : ""}`}>
                        {superchatEnabled
                            ? _("OGS Moderator official message: please respond")
                            : _("(You are talking with an OGS Moderator)")}
                    </div>
                </div>
            )}

            <div ref={bodyRef} className="body">
                {lines.map(renderChatLine)}
            </div>

            <TabCompleteInput
                ref={inputRef}
                disabled={
                    !user_id ||
                    (!data.get("user").email_validated &&
                        (player.ui_class?.indexOf("moderator") || 0) < 0 &&
                        lines.length === 0)
                }
                placeholder={getInputPlaceholder()}
                onKeyPress={handleKeyPress}
            />
        </div>
    );
});
