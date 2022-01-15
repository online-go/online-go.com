/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import * as data from "data";
import * as moment from "moment";
import Linkify from "react-linkify";
import Split from "react-split";
import { Card } from "material";
import { Link } from "react-router-dom";
import { comm_socket } from "sockets";
import { _, pgettext, interpolate } from "translate";
import { localize_time_strings } from "localize-time";
import { useEffect, useState, useRef, useCallback } from "react";
import { Timeout, errorLogger } from "misc";
//import { ChatChannelProxy, global_channels, group_channels, tournament_channels } from 'chat_manager';
import {
    chat_manager,
    global_channels,
    ChatChannelProxy,
    ChatMessage,
    TopicMessage,
    ChannelInformation,
    resolveChannelInformation,
    cachedChannelInformation,
} from "chat_manager";
import { ChatLine } from "./ChatLine";
import { TabCompleteInput } from "TabCompleteInput";
import { Markdown } from "Markdown";
import { browserHistory } from "ogsHistory";
import { ObserveGamesComponent } from "ObserveGamesComponent";
import { profanity_filter } from "profanity_filter";
import { popover } from "popover";
import { ChatDetails } from "Chat";
import swal from "sweetalert2";
import { GroupList } from "src/lib/types";

interface ChatLogState {
    chat_log: Array<ChatMessage>;
    show_say_hi_placeholder: boolean;
}

interface ChatLogProperties {
    channel: string;
    autoFocus?: boolean;
    updateTitle?: boolean;
    hideTopic?: boolean;
    forceShowGames?: boolean;
    onShowChannels?: (tf: boolean) => void;
    onShowUsers?: (tf: boolean) => void;
    /* if properties are added to this, don't forget to
     * add a copy line in the ChatLog internal props construction */
    showingChannels?: boolean;
    showingUsers?: boolean;
}

interface InternalChatLogProperties extends ChatLogProperties {
    onShowGames?: (tf: boolean) => void;
    showingGames?: boolean;
    canShowGames?: boolean;
}

let deferred_chat_update: Timeout = null;

function saveSplitSizes(sizes: Array<number>): void {
    data.set("chat.split-sizes", sizes);
}

export function ChatLog(props: ChatLogProperties): JSX.Element {
    /* eslint-disable prefer-const */
    let [showing_games, set_showing_games]: [boolean, (tf: boolean) => void] = useState(
        data.get("chat.show-games", true) as boolean,
    );
    let [height, set_height]: [number, (tf: number) => void] = useState(document.body.clientHeight);
    /* eslint-enable prefer-const */
    const onShowGames = useCallback(
        (tf: boolean) => {
            //if (tf !== showing_games) {
            set_showing_games(tf);
            data.set("chat.show-games", tf);
            //}
        },
        [props.channel, showing_games],
    );

    useEffect(() => {
        function update_height() {
            if (height !== document.body.clientHeight) {
                set_height(document.body.clientHeight);
                height = document.body.clientHeight;
            }
        }
        window.addEventListener("resize", update_height);
        return () => {
            window.removeEventListener("resize", update_height);
        };
    }, []);

    if (!height) {
        requestAnimationFrame(() => {
            set_height(-1); // this forces react to keep running this until we get a client height
            set_height(document.body.clientHeight);
        });
    }

    let canShowGames = /^(group-|global)/.test(props.channel);
    const game_channel = /^(group-)/.test(props.channel) ? props.channel : ""; /* global */

    if (height <= 300) {
        canShowGames = false;
    }

    if (!canShowGames) {
        showing_games = false;
    }

    if (canShowGames && props.forceShowGames) {
        showing_games = true;
    }

    return (
        <div className="ChatLog">
            <ChannelTopic
                {...props}
                showingGames={showing_games}
                onShowGames={onShowGames}
                canShowGames={canShowGames}
            />
            {showing_games ? (
                <Split
                    className="split"
                    direction="vertical"
                    sizes={data.get("chat.split-sizes", [25, 75])}
                    gutterSize={7}
                    minSize={50}
                    onDragEnd={saveSplitSizes}
                >
                    <div className="game-list">
                        <ObserveGamesComponent
                            announcements={false}
                            updateTitle={false}
                            channel={game_channel}
                            namesByGobans={true}
                            miniGobanProps={{ noText: true, displayWidth: 64 }}
                            preferenceNamespace="chat"
                        />
                    </div>
                    <ChatLines {...props} />
                </Split>
            ) : (
                <ChatLines {...props} />
            )}
            <ChatInput {...props} />
        </div>
    );
}

function ChannelTopic({
    channel,
    hideTopic,
    onShowChannels,
    onShowUsers,
    onShowGames,
    showingChannels,
    showingUsers,
    showingGames,
    canShowGames,
}: InternalChatLogProperties): JSX.Element {
    if (hideTopic) {
        return null;
    }

    const user = data.get("user");

    const [editing, set_editing]: [boolean, (tf: boolean) => void] = useState(false as boolean);
    const [topic, set_topic]: [string, (tf: string) => void] = useState("");
    const [topic_updated, set_topic_updated]: [boolean, (tf: boolean) => void] = useState(false as boolean);
    const [name, set_name]: [string, (tf: string) => void] = useState(channel);
    const [group_id, set_group_id]: [number | null, (tf: number) => void] = useState(null);
    const [tournament_id, set_tournament_id]: [number | null, (tf: number) => void] = useState(null);
    const [banner, set_banner]: [string, (s: string) => void] = useState("");
    const [proxy, setProxy]: [ChatChannelProxy | null, (x: ChatChannelProxy) => void] = useState(null);
    const [title_hover, set_title_hover]: [string, (s: string) => void] = useState("");

    const groups = data.get<GroupList>("cached.groups", []);

    // member of group, or a moderator, or a tournament channel
    const topic_editable =
        user.is_moderator ||
        groups.filter((g) => `group-${g.id}` === channel).length > 0 ||
        channel.indexOf("tournament-") === 0;
    useEffect(() => {
        set_group_id(null);
        set_tournament_id(null);
        set_name("");
        set_topic("");
        set_title_hover("");
        set_banner("");

        resolveChannelInformation(channel)
            .then((info: ChannelInformation) => {
                set_name(info.name);
                if (info.group_id) {
                    set_group_id(info.group_id);
                    set_banner(info.banner);
                }
                if (info.tournament_id) {
                    set_tournament_id(info.tournament_id);
                }
            })
            .catch(errorLogger);
    }, [channel]);

    useEffect(() => {
        const proxy = chat_manager.join(channel);
        setProxy(proxy);
        set_topic(proxy.channel?.topic?.topic || "");
        set_title_hover(getTitleHover(proxy.channel?.topic));
        proxy.on("topic", (topic) => {
            set_topic(proxy.channel?.topic?.topic || "");
            set_title_hover(getTitleHover(proxy.channel?.topic));
        });

        function getTitleHover(topic: TopicMessage | null): string {
            if (topic && topic.username && topic.timestamp) {
                return topic.username + " - " + moment(new Date(topic.timestamp)).format("LL");
            }

            return "";
        }
    }, [channel]);

    const updateTopic = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            set_topic(ev.target.value);
            set_topic_updated(true);
        },
        [channel],
    );

    const partChannel = useCallback(() => {
        const joined = data.get("chat.joined");
        data.set("chat.active_channel", null);
        delete joined[channel];
        data.set("chat.joined", joined);

        const parted_channels = data.get("chat.parted", {});
        parted_channels[channel] = 1;
        data.set("chat.parted", parted_channels);

        browserHistory.push("/chat");
        //proxy?.channel.emit('should-part', channel);
    }, [proxy]);

    const toggleShowChannels = useCallback(() => {
        if (onShowChannels) {
            onShowChannels(!showingChannels);
        }
    }, [onShowChannels, showingChannels]);

    const toggleShowUsers = useCallback(() => {
        if (onShowUsers) {
            onShowUsers(!showingUsers);
        }
    }, [onShowUsers, showingUsers]);

    const startEditing = useCallback(() => {
        set_editing(true);
    }, []);

    const saveEdits = useCallback(() => {
        set_editing(false);
        if (topic_updated) {
            proxy.channel.setTopic(topic);
        }
    }, [topic, topic_updated, proxy]);

    const channelDetails = useCallback(
        (event) => {
            popover({
                elt: (
                    <ChatDetails
                        chatChannelId={channel}
                        subscribable={!(channel.startsWith("global") || channel === "shadowban")}
                        partFunc={partChannel}
                    />
                ),
                below: event.currentTarget,
                minWidth: 130,
            });
        },
        [channel, partChannel],
    );

    //const channel_leavable = global_channels.filter(chan => chan.id === channel && chan.primary_language).length === 0;

    return (
        <div className="ChatHeader" style={banner ? { backgroundImage: `url("${banner}")` } : {}}>
            <div className="backdrop" />
            <div className="foreground">
                <i
                    className={"header-icon fa fa-list" + (showingChannels ? " active" : "")}
                    onClick={toggleShowChannels}
                />

                {canShowGames &&
                    (showingGames ? (
                        <i className="header-icon ogs-goban active" onClick={() => onShowGames(false)} />
                    ) : (
                        <i className="header-icon ogs-goban" onClick={() => onShowGames(true)} />
                    ))}

                {editing && topic_editable ? (
                    <React.Fragment>
                        <i className="header-icon fa fa-save" onClick={saveEdits} />
                        <div className="channel-topic">
                            <input
                                value={topic}
                                className="channel-topic-edit"
                                placeholder={pgettext("Set channel topic", "Topic")}
                                onChange={updateTopic}
                                autoFocus={true}
                            />
                        </div>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        {topic_editable && <i className="header-icon fa fa-pencil" onClick={startEditing} />}
                        <div className="channel-topic" title={title_hover}>
                            <div className="topic">
                                <span className="content">
                                    <Linkify>{localize_time_strings(profanity_filter(topic.trim())) || name}</Linkify>
                                </span>
                            </div>
                        </div>
                    </React.Fragment>
                )}

                <i className={"header-icon fa fa-gear"} onClick={channelDetails} />
                {/*channel_leavable &&
                    <i className={'header-icon fa fa-times'}
                        title={pgettext("Leave the selected channel.", "Leave Channel")}
                        onClick={partChannel}
                        />
                */}

                <i className={"header-icon fa fa-users" + (showingUsers ? " active" : "")} onClick={toggleShowUsers} />
            </div>
        </div>
    );
}

let scrolled_to_bottom = true;
function ChatLines({
    channel,
    autoFocus,
    updateTitle,
    onShowChannels,
    onShowUsers,
}: InternalChatLogProperties): JSX.Element {
    const user = data.get("user");
    const rtl_mode = channel in global_channels && !!global_channels[channel].rtl;
    const chat_log_div = useRef(null);
    const [, refresh]: [number, (n: number) => void] = useState(0);
    const [proxy, setProxy]: [ChatChannelProxy | null, (x: ChatChannelProxy) => void] = useState(null);

    useEffect(() => {
        const proxy = chat_manager.join(channel);
        setProxy(proxy);
        proxy.on("chat", onChatMessage);
        proxy.on("chat-removed", onChatMessageRemoved);
        //chan.on("join", onChatJoin);
        //chan.on("part", onChatPart);
        syncStateSoon();

        return () => {
            //console.log("parting", channel);
            proxy.part();
            if (deferred_chat_update) {
                clearTimeout(deferred_chat_update);
                deferred_chat_update = null;
            }
        };

        function onChatMessageRemoved() {
            syncStateSoon();
        }

        function onChatMessage(obj) {
            if (proxy) {
                proxy.channel.markAsRead();
            }

            syncStateSoon();

            if (updateTitle) {
                if (document.hasFocus() || !proxy?.channel.unread_ct) {
                    window.document.title = _("Chat");
                } else {
                    window.document.title = `(${proxy?.channel.unread_ct}) ` + _("Chat");
                }
            }
        }

        function syncStateSoon() {
            if (!deferred_chat_update) {
                deferred_chat_update = setTimeout(() => {
                    deferred_chat_update = null;
                    proxy?.channel.markAsRead();
                    refresh(Math.random());
                }, 20);
            }
        }
    }, [channel]);

    const focusInput = useCallback((): void => {
        if (window.getSelection() && window.getSelection().toString() !== "") {
            // don't focus input if we're selecting text
            return;
        }
        //input.current.focus();
        document.getElementById("chat-input")?.focus();
        if (onShowChannels) {
            onShowChannels(false);
        }
        if (onShowUsers) {
            onShowUsers(false);
        }
    }, [channel]);

    useEffect(() => {
        scrolled_to_bottom = true;
    }, [channel]);

    const onScroll = useCallback(
        (event: React.UIEvent<HTMLDivElement>): void => {
            const div = chat_log_div.current;
            if (!div) {
                return;
            }

            const tf = div.scrollHeight - div.scrollTop - 10 < div.offsetHeight;
            if (tf !== scrolled_to_bottom) {
                scrolled_to_bottom = tf;
                div.className = (rtl_mode ? "rtl chat-lines " : "chat-lines ") + (tf ? "autoscrolling" : "");
            }
            scrolled_to_bottom = div.scrollHeight - div.scrollTop - 10 < div.offsetHeight;
        },
        [channel],
    );

    window.requestAnimationFrame(() => {
        const div = chat_log_div.current;
        if (!div) {
            return;
        }

        if (scrolled_to_bottom) {
            div.scrollTop = div.scrollHeight;
            setTimeout(() => {
                try {
                    div.scrollTop = div.scrollHeight;
                } catch (e) {
                    // ignore error
                }
            }, 100);
        }
    });

    let last_line: ChatMessage;

    return (
        <div
            className={rtl_mode ? "rtl chat-lines" : "chat-lines"}
            ref={chat_log_div}
            onScroll={onScroll}
            onClick={focusInput}
        >
            {proxy?.channel.chat_log.slice(-500).map((line, idx) => {
                const ll = last_line;
                last_line = line;
                return <ChatLine key={line.message.i || `system-${idx}`} line={line} lastline={ll} />;
            })}
        </div>
    );
}

function ChatInput({ channel, autoFocus }: InternalChatLogProperties): JSX.Element {
    const user = data.get("user");
    const rtl_mode = channel in global_channels && !!global_channels[channel].rtl;
    const input = useRef(null);
    const [proxy, setProxy]: [ChatChannelProxy | null, (x: ChatChannelProxy) => void] = useState(null);
    const [show_say_hi_placeholder, set_show_say_hi_placeholder] = useState(true);
    const [channel_name, set_channel_name] = useState(cachedChannelInformation(channel)?.name);

    useEffect(() => {
        const proxy = chat_manager.join(channel);
        setProxy(proxy);

        resolveChannelInformation(channel)
            .then((info) => {
                set_channel_name(info.name);
            })
            .catch((err) => 0);
    }, [channel]);

    const onKeyPress = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>): boolean => {
            if (event.charCode === 13) {
                const input = event.target as HTMLInputElement;
                if (!comm_socket.connected) {
                    void swal(_("Connection to server lost"));
                    return false;
                }

                if (proxy) {
                    proxy.channel.send(input.value);
                    if (show_say_hi_placeholder) {
                        set_show_say_hi_placeholder(false);
                    }
                    input.value = "";
                }
                return false;
            }

            return;
        },
        [channel, proxy],
    );

    return (
        <TabCompleteInput
            ref={input}
            id="chat-input"
            className={rtl_mode ? "rtl" : ""}
            autoFocus={autoFocus}
            placeholder={
                !user.email_validated
                    ? _("Chat will be enabled once your email address has been validated")
                    : show_say_hi_placeholder
                    ? pgettext(
                          "This is the placeholder text for the chat input field in games, chat channels, and private messages",
                          interpolate("Message {{who}}", { who: channel_name || "..." }),
                      )
                    : ""
            }
            disabled={user.anonymous || !data.get("user").email_validated}
            onKeyPress={onKeyPress}
        />
    );
}

export function EmbeddedChatCard(props: ChatLogProperties): JSX.Element {
    return (
        <Card className="Card EmbeddedChatCard">
            <ChatLog key={props.channel} {...props} hideTopic={true} forceShowGames={true} />
        </Card>
    );
}
