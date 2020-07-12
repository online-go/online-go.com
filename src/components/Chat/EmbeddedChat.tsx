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
import { Timeout } from "misc";
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
    autoFocus?: boolean;
    updateTitle?: boolean;
}

let deferred_chat_update:Timeout = null;

export function EmbeddedChat(props:EmbeddedChatProperties):JSX.Element {
    return (
        <div className='EmbeddedChat'>
            <ChatLog {...props} />
            <ChatInput {...props} />
        </div>
    );
}

let scrolled_to_bottom:boolean = true;
function ChatLog({channel, autoFocus, updateTitle}:EmbeddedChatProperties):JSX.Element {
    const user = data.get("user");
    const rtl_mode = channel in global_channels && !!global_channels[channel].rtl;
    let chat_log_div = useRef(null);
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
        //input.current.focus();
        document.getElementById("chat-input")?.focus();
    }, [channel]);

    useEffect(() => {
        scrolled_to_bottom = true;
    }, [channel]);

    const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>):void => {
        let div = chat_log_div.current;
        if (!div) {
            return;
        }

        let tf = div.scrollHeight - div.scrollTop - 10 < div.offsetHeight;
        if (tf !== scrolled_to_bottom) {
            scrolled_to_bottom  = tf;
            div.className = (rtl_mode ? "rtl chat-log " : "chat-log ") + (tf ? "autoscrolling" : "");
        }
        scrolled_to_bottom = div.scrollHeight - div.scrollTop - 10 < div.offsetHeight;
    }, [channel]);

    window.requestAnimationFrame(() => {
        let div = chat_log_div.current;
        if (!div) {
            return;
        }

        if (scrolled_to_bottom) {
            div.scrollTop = div.scrollHeight;
            setTimeout(() => {
                try {
                    div.scrollTop = div.scrollHeight;
                } catch (e) {
                }
            } , 100);
        }
    });

    let last_line:ChatMessage;

    return (
        <div
            className={rtl_mode ? "rtl chat-log" : "chat-log"}
            ref={chat_log_div}
            onScroll={onScroll}
            onClick={focusInput}
            >
            {proxy?.channel.chat_log.map((line, idx) => {
                let ll = last_line;
                last_line = line;
                return <ChatLine key={line.message.i || `system-${idx}`} line={line} lastline={ll} />;
            })}
        </div>
    );
}


function ChatInput({channel, autoFocus}:EmbeddedChatProperties):JSX.Element {
    const user = data.get("user");
    const rtl_mode = channel in global_channels && !!global_channels[channel].rtl;
    let input = useRef(null);
    let [proxy, setProxy]:[ChatChannelProxy | null, (x:ChatChannelProxy) => void] = useState(null);
    let [show_say_hi_placeholder, set_show_say_hi_placeholder] = useState(true);

    useEffect(() => {
        let proxy = chat_manager.join(channel);
        setProxy(proxy);
    }, [channel]);

    const onKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>):boolean => {
        if (event.charCode === 13) {
            let input = event.target as HTMLInputElement;
            if (!comm_socket.connected) {
                swal(_("Connection to server lost"));
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
    }, [channel, proxy]);

    return (
        <TabCompleteInput ref={input} id="chat-input" className={rtl_mode ? "rtl" : ""}
            autoFocus={autoFocus}
            placeholder={
                !user.email_validated ? _("Chat will be enabled once your email address has been validated") :
                show_say_hi_placeholder ? _("Say hi!") : ""
            }
            disabled={user.anonymous || !data.get('user').email_validated}
            onKeyPress={onKeyPress}
        />
    );
}


export function EmbeddedChatCard(props:EmbeddedChatProperties):JSX.Element {
    return (
        <Card className="Card EmbeddedChatCard">
            <EmbeddedChat key={props.channel} {...props} />
        </Card>
    );
}
