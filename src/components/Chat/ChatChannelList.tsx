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
import { useEffect, useState, useCallback } from "react";
import { Flag } from "Flag";
import { browserHistory } from "ogsHistory";
import { shouldOpenNewTab, slugify } from 'misc';
import { chat_manager, ChatChannelProxy, global_channels, group_channels, tournament_channels } from 'chat_manager';

data.setDefault("chat.joined", {});


interface ChatChannelListProperties {
    channel: string;
}

export function ChatChannelList({channel}:ChatChannelListProperties):JSX.Element {
    return (
        <div className='ChatChannelList'>
            {group_channels.map((chan) => (
                <ChatChannel
                    key={`group-${chan.id}`}
                    channel={`group-${chan.id}`}
                    active={channel === `group-${chan.id}`}
                    icon={chan.icon}
                    name={chan.name}
                />
            ))}

            {tournament_channels.map((chan) => (
                <ChatChannel
                    key={`tournament-${chan.id}`}
                    channel={`tournament-${chan.id}`}
                    active={channel === `tournament-${chan.id}`}
                    name={chan.name}
                />
            ))}

            {global_channels.map((chan) => (
                <ChatChannel
                    key={chan.id}
                    channel={chan.id}
                    active={channel === chan.id}
                    name={chan.name}
                    language={chan.language}
                    country={chan.country}
                />
            ))}
        </div>
    );
}



interface ChatChannelProperties {
    channel: string;
    name: string;
    active: boolean;
    country?: string;
    language?: string;
    icon?: string;
}

export function ChatChannel({channel, name, active, country, language, icon}:ChatChannelProperties):JSX.Element {
    const user = data.get('user');
    const user_country = user?.country || 'un';
    const joined_channels = data.get("chat.joined");

    let [proxy, setProxy]:[ChatChannelProxy | null, (x:ChatChannelProxy) => void] = useState(null);
    let [unread_ct, set_unread_ct]:[number, (x:number) => void] = useState(0);

    let setChannel = useCallback(() => {
        if (name) {
            browserHistory.push(`/chat/${channel}/${slugify(name)}`);
        } else {
            browserHistory.push(`/chat/${channel}`);
        }
    }, [channel, name]);

    useEffect(() => {
        let proxy = chat_manager.join(channel);
        if (proxy && active) {
            proxy.channel.markAsRead();
        }
        setProxy(proxy);
        proxy.on("chat", sync);
        proxy.on("chat-removed", sync);
        //chan.on("join", onChatJoin);
        //chan.on("part", onChatPart);
        sync();

        return () => {
            proxy.part();
        };

        function sync() {
            if (proxy) {
                set_unread_ct(proxy.channel.unread_ct);
            }
        }
    }, [channel]);



    let icon_element:JSX.Element;

    if (channel.indexOf('tournament') === 0) {
        icon_element = <i className="fa fa-trophy" />;
    } else if (channel.indexOf('global') === 0) {
        icon_element = <Flag country={country} language={language} user_country={user_country} />;
    } else if (channel.indexOf('group') === 0) {
        icon_element = <img src={icon}/>;
    }

    let mentioned = proxy?.channel.mentioned;
    let unread:JSX.Element;

    if (unread_ct) {
        unread = <span className="unread-count" data-count={`(${unread_ct})`} />;
    }


    let cls = "channel";
    if (active) {
        cls += " active";
    }
    if (mentioned) {
        cls += " mentioned";
    }
    if (unread_ct > 0) {
        cls += " unread";
    }
    if (channel in joined_channels) {
        cls += " joined";
    } else {
        cls += " unjoined";
    }

    return (
        <div className={cls} onClick={setChannel} >
            <span className="channel-name">
                {icon_element} {name} {unread}
            </span>
        </div>
    );
}

