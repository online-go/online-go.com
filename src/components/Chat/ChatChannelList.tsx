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
import { _, pgettext } from "translate";
import { useEffect, useState, useCallback, useRef } from "react";
import { Flag } from "Flag";
import { get } from "requests";
import { browserHistory } from "ogsHistory";
import { errorLogger, shouldOpenNewTab, slugify } from 'misc';
import {
    chat_manager,
    ChatChannelProxy,
    global_channels,
    group_channels,
    tournament_channels,
    ChannelInformation,
    resolveChannelInformation,
    cachedChannelInformation
} from 'chat_manager';


data.setDefault("chat.joined", {'global-english': true});

try {
    const joined_defaults: any = {};
    let found = false;
    for (const chan of global_channels) {
        try {
            if (chan.id === "global-help" && navigator.languages.indexOf("en") >= 0) {
                joined_defaults[chan.id] = true;
            }
            if (chan.id === "global-offtopic" && navigator.languages.indexOf("en") >= 0) {
                joined_defaults[chan.id] = true;
            }
        } catch (e) {
            console.error(e);
        }
        if (chan.navigator_language) {
            joined_defaults[chan.id] = true;
            found = true;
        }
    }
    if (found) {
        data.setDefault("chat.joined", joined_defaults);
    }
} catch (e) {
    console.error(e);
}


interface ChatChannelListProperties {
    channel: string;
}


function autojoin_channels() {
    const joined_channels = data.get("chat.joined");
    const parted_channels = data.get("chat.parted", {});

    for (const chan of group_channels) {
        const key = `group-${chan.id}`;
        if (!(key in parted_channels)) {
            joined_channels[key] = 1;
        }
    }
    for (const chan of tournament_channels) {
        const key = `group-${chan.id}`;
        if (!(key in parted_channels)) {
            joined_channels[key] = 1;
        }
    }
    for (const chan of global_channels) {
        if (chan.id.indexOf('supporter') >= 0 || chan.id.indexOf('shadowban') >= 0) {
            if (!(chan.id in parted_channels)) {
                joined_channels[chan.id] = 1;
            }
        }
    }

    data.set("chat.joined", joined_channels);
}


export function ChatChannelList({channel}: ChatChannelListProperties): JSX.Element {
    autojoin_channels();

    const joined_channels = data.get("chat.joined");
    const using_resolved_channel = !(
        group_channels.filter(chan => `group-${chan.id}` === channel).length
        + tournament_channels.filter(chan => `tournament-${chan.id}` === channel).length
        + global_channels.filter(chan => chan.id === channel).length
    );

    const [more, set_more]: [boolean, (tf: boolean) => void] = useState(false as boolean);
    const [search, set_search]: [string, (text: string) => void] = useState("");
    const [resolved_channel, set_resolved_channel]: [ChannelInformation | null, (s: ChannelInformation | null) => void] = useState(null);

    //pgettext("Joining chat channel", "Joining"));

    useEffect(() => {
        set_more(false);
        set_search("");
        set_resolved_channel(cachedChannelInformation(channel));

        let still_resolving = true;
        if (using_resolved_channel && !cachedChannelInformation(channel)) {
            resolveChannelInformation(channel)
            .then((info) => {
                if (still_resolving) {
                    set_resolved_channel(info);
                }
            })
            .catch(errorLogger);
        }

        return () => {
            still_resolving = false;
        };
    }, [channel]);


    let more_channels: JSX.Element;

    function chanSearch(chan: {name: string}): boolean {
        const s = search.toLowerCase().trim();

        if (s === "") {
            return true;
        }

        return chan.name.toLowerCase().indexOf(s) >= 0;
    }

    if (more) {
        more_channels = (
            <React.Fragment>
                <button className='primary' onClick={() => set_more(false)}>
                    <span className='triangle'>&#9651;</span><span className='text'>{_("More channels")}</span>
                </button>

                <div className='joinable'>
                    <input type="search"
                        autoFocus={true}
                        value={search}
                        onChange={(ev) => set_search(ev.target.value)}
                        placeholder={_("Search")}
                    />

                    {group_channels.filter(chan => !(`group-${chan.id}` in joined_channels) && chanSearch(chan)).map((chan) => (
                        <ChatChannel
                            key={`group-${chan.id}`}
                            channel={`group-${chan.id}`}
                            icon={chan.icon}
                            name={chan.name}
                        />
                    ))}

                    {tournament_channels.filter(chan => !(`tournament-${chan.id}` in joined_channels) && chanSearch(chan)).map((chan) => (
                        <ChatChannel
                            key={`tournament-${chan.id}`}
                            channel={`tournament-${chan.id}`}
                            name={chan.name}
                        />
                    ))}

                    {global_channels.filter(chan => !(chan.id in joined_channels) && chanSearch(chan)).map((chan) => (
                        <ChatChannel
                            key={chan.id}
                            channel={chan.id}
                            name={chan.name}
                            language={chan.language}
                            country={chan.country}
                        />
                    ))}
                </div>
            </React.Fragment>
        );
    } else {
        more_channels = (
            <button className='default' onClick={() => set_more(true)}>
                <span className='triangle'>&#9661;</span><span className='text'>{_("More channels")}</span>
            </button>
        );
    }


    return (
        <div className='ChatChannelList'>
            {using_resolved_channel
                ? <ChatChannel
                    key={channel}
                    channel={channel}
                    name={resolved_channel?.name || pgettext("Joining chat channel", "Joining...")}
                    icon={resolved_channel?.icon}
                    active={true}
                    joined={true}
                />
                : null
            }

            {group_channels.filter(chan => `group-${chan.id}` in joined_channels).map((chan) => (
                <ChatChannel
                    key={`group-${chan.id}`}
                    channel={`group-${chan.id}`}
                    active={channel === `group-${chan.id}`}
                    icon={chan.icon}
                    name={chan.name}
                    joined={true}
                />
            ))}

            {tournament_channels.filter(chan => `tournament-${chan.id}` in joined_channels).map((chan) => (
                <ChatChannel
                    key={`tournament-${chan.id}`}
                    channel={`tournament-${chan.id}`}
                    active={channel === `tournament-${chan.id}`}
                    name={chan.name}
                    joined={true}
                />
            ))}

            {global_channels.filter(chan => chan.id in joined_channels || chan.id === channel).map((chan) => (
                <ChatChannel
                    key={chan.id}
                    channel={chan.id}
                    active={channel === chan.id}
                    name={chan.name}
                    language={chan.language}
                    country={chan.country}
                    joined={true}
                />
            ))}

            {more_channels}
        </div>
    );
}



interface ChatChannelProperties {
    channel: string;
    name: string;
    active?: boolean;
    country?: string;
    language?: string | Array<string>;
    icon?: string;
    joined?: boolean;
}

export function ChatChannel(
    {channel, name, active, country, language, icon, joined}: ChatChannelProperties
): JSX.Element {
    const user = data.get('user');
    const user_country = user?.country || 'un';

    if (language && typeof(language) !== "string") {
        language = language[0];
    }


    const [proxy, setProxy]: [ChatChannelProxy | null, (x: ChatChannelProxy) => void] = useState(null);
    const [unread_ct, set_unread_ct]: [number, (x: number) => void] = useState(0);

    const setChannel = useCallback(() => {
        if (!joined) {
            const joined_channels = data.get("chat.joined");
            joined_channels[channel] = 1;
            data.set("chat.joined", joined_channels);
        }

        let next_location: string;

        if (name) {
            next_location = `/chat/${channel}/${slugify(name)}`;
        } else {
            next_location = `/chat/${channel}`;
        }

        if (next_location !== browserHistory.location.pathname) {
            console.log(next_location, browserHistory.location);
            browserHistory.push(next_location);
        } else {
            console.log("Same location");
        }
    }, [channel, name]);

    useEffect(() => {
        let proxy;

        if (joined) {
            proxy = chat_manager.join(channel);
            setProxy(proxy);
            proxy.on("chat", sync);
            proxy.on("chat-removed", sync);
            //chan.on("join", onChatJoin);
            //chan.on("part", onChatPart);
            sync();

            return () => {
                proxy.part();
            };
        }

        function sync() {
            if (proxy) {
                setTimeout(() => {
                    set_unread_ct(proxy.channel.unread_ct);
                }, 1);
            }
        }
    }, [channel, joined]);

    useEffect(() => {
        if (proxy && active) {
            proxy.channel.markAsRead();
            set_unread_ct(proxy.channel.unread_ct);
        }
    }, [active, proxy]);


    let icon_element: JSX.Element;

    if (channel.indexOf('tournament') === 0) {
        icon_element = <i className="fa fa-trophy" />;
    } else if (channel.indexOf('global') === 0 || channel === 'shadowban') {
        icon_element = <Flag country={country} language={language as string} user_country={user_country} />;
    } else if (channel.indexOf('group') === 0) {
        icon_element = <img src={icon}/>;
    }

    const mentioned = proxy?.channel.mentioned;
    let unread: JSX.Element;

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
    if (joined) {
        cls += " joined";
    } else {
        cls += " unjoined";
    }

    return (
        <div className={cls} onClick={setChannel} >
            <span className="channel-name">
                {icon_element}
                <span className='name'>{name}</span>
                {unread}
            </span>
        </div>
    );
}

