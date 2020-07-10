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
import { Card } from "material";
import { comm_socket } from "sockets";
import { _, interpolate } from "translate";
import { useEffect, useState, useRef, useCallback } from "react";
import { string_splitter, n2s, dup, Timeout } from "misc";
//import { ChatChannelProxy, global_channels, group_channels, tournament_channels } from 'chat_manager';
import { chat_manager, global_channels, ChatChannelProxy, ChatMessage } from 'chat_manager';
import { ChatLine } from './ChatLine';
import { TabCompleteInput } from "TabCompleteInput";

declare let swal;

interface EmbeddedChatState {
    chat_log: Array<ChatMessage>;
    show_say_hi_placeholder: boolean;
}

interface EmbeddedChatProperties {
    channel: string;
    autofocus?: boolean;
    updateTitle?: boolean;
}

let deferred_chat_update:Timeout = null;
let send_tokens = 5;
let flood_protection:Timeout = null;

export function EmbeddedChat({channel, autofocus, updateTitle}:EmbeddedChatProperties):JSX.Element {
    const user = data.get("user");
    const rtl_mode = channel in global_channels && !!global_channels[channel].rtl;
    let input = useRef(null);
    let [show_say_hi_placeholder, set_show_say_hi_placeholder] = useState(true);
    let [, refresh]:[number, (n:number) => void] = useState(0);
    let [proxy, setProxy]:[ChatChannelProxy | null, (x:ChatChannelProxy) => void] = useState(null);


    useEffect(() => {
        let proxy = chat_manager.join(channel);
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

    const focusInput = useCallback(():void => {
        input.current.focus();
    }, [channel]);

    const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>):void => {
        console.log("Scroll ", event);
    }, [channel]);

    const onKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>):boolean => {
        if (event.charCode === 13) {
            let input = event.target as HTMLInputElement;
            if (!comm_socket.connected) {
                swal(_("Connection to server lost"));
                return false;
            }

            sendChat(input.value, channel);
            syncStateSoon();
            if (show_say_hi_placeholder) {
                set_show_say_hi_placeholder(false);
            }
            input.value = "";
            return false;
        }

        return;

        function sendChat(full_text:string, channel:string) {
            function send_fragment(split_str:string) {
                if (flood_protection) {
                    return;
                }
                if (split_str.trim().length === 0) {
                    return;
                }

                if (send_tokens <= 0) {
                    let chillout_time = 20;
                    if (data.get("config.user").supporter) {
                        chillout_time = 10;
                    }
                    if (data.get("config.user").is_moderator) {
                        chillout_time = 2;
                    }

                    systemMessage(
                        interpolate(
                            _("Anti-flood system engaged. You will be able to talk again in {{time}} seconds."),
                            {"time": chillout_time}
                        )
                        , "flood"
                    );
                    let start = Date.now();
                    flood_protection = setInterval(() => {
                        clearSystemMessages("flood");
                        let left = chillout_time * 1000 - (Date.now() - start);
                        if (left > 0) {
                            systemMessage(
                                interpolate(
                                    _("Anti-flood system engaged. You will be able to talk again in {{time}} seconds."),
                                    {"time": Math.round(left / 1000)}
                                )
                                , "flood"
                            );
                        } else {
                            clearInterval(flood_protection);
                            flood_protection = null;
                        }
                    }, 1000);
                    return;
                }
                --send_tokens;
                setTimeout(() => { send_tokens = Math.min(5, send_tokens + 1); }, 2000);

                let user = data.get("config.user");

                let obj: any = {
                    "channel": channel,
                    "uuid": n2s(user.id) + "." + n2s(Date.now()),
                    "message": split_str
                };

                comm_socket.send("chat/send", obj);
                obj = dup(obj);
                obj.username = user.username;
                obj.id = user.id;
                obj.ranking = user.ranking;
                obj.professional = user.professional;
                obj.ui_class = user.ui_class;
                obj.message = {"i": obj.uuid, "t": Math.floor(Date.now() / 1000), "m": split_str};
                proxy.channel.chat_log.push(obj);
            }

            for (let split_str of string_splitter(full_text, 300)) {
                console.log("Should be sending ", split_str);
                send_fragment(split_str);
            }

        }

        function systemMessage(text:string, system_message_type:'flood'):void {
            proxy?.channel.chat_log.push({
                channel: channel,
                username: 'system',
                id: -1,
                ranking: 99,
                professional: false,
                ui_class: '',
                message: {
                    i: n2s(Date.now()),
                    t: Date.now() / 1000,
                    m: text,
                },
                system: true,
                system_message_type: system_message_type,
            });
            syncStateSoon();
        }

        function clearSystemMessages(system_message_type: 'flood'):void {
            for (let i = 0; i < proxy?.channel.chat_log.length; ++i) {
                if (proxy?.channel.chat_log[i].system && system_message_type === proxy?.channel.chat_log[i].system_message_type) {
                    proxy?.channel.chat_log.splice(i, 1);
                    --i;
                }
            }
            syncStateSoon();
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
    }, [channel, proxy]);


    let last_line:ChatMessage;

    return (
        <div className='EmbeddedChat'>
            <div
                className={rtl_mode ? "rtl chat-log" : "chat-log"}
                onScroll={onScroll}
                onClick={focusInput}
                >
                {proxy?.channel.chat_log.map((line, idx) => {
                    let ll = last_line;
                    last_line = line;
                    return <ChatLine key={line.message.i} line={line} lastline={ll} />;
                })}
            </div>

            <TabCompleteInput ref={input} className={rtl_mode ? "rtl" : ""}
                placeholder={
                    !user.email_validated ? _("Chat will be enabled once your email address has been validated") :
                    show_say_hi_placeholder ? _("Say hi!") : ""
                }
                disabled={user.anonymous || !data.get('user').email_validated}
                onKeyPress={onKeyPress}
            />
        </div>
    );
}


export function EmbeddedChatCard(props:EmbeddedChatProperties):JSX.Element {
    return (
        <Card className="Card EmbeddedChatCard">
            <EmbeddedChat key={props.channel} {...props} />
        </Card>
    );
}
