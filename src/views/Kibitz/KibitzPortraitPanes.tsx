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
import { pgettext } from "@/lib/translate";
import { ChatUserList } from "@/components/ChatUserList";
import { KibitzChatPanel, KibitzChatPanelProps } from "./KibitzChatPanel";
import { KibitzRoomList } from "./KibitzRoomList";
import { KibitzVariationList } from "./KibitzVariationList";
import type { KibitzLeftAsideProps } from "./KibitzLeftAside";
import type { KibitzPortraitPane } from "./kibitzPortraitPane";
import "./KibitzPortraitPanes.css";

interface KibitzPortraitPanesProps {
    active: KibitzPortraitPane;
    chat: KibitzChatPanelProps;
    leftAside: KibitzLeftAsideProps;
    roomChannel: string;
    /** The variation panel's contents, while the centre shows a draft or a
     *  posted variation. Null when it shows the live game, and the analysis
     *  pane then says so rather than sitting empty. */
    analysis: React.ReactNode;
    /** True while the centre has left the live game but the board for it is
     *  not built yet, which is a wait rather than an invitation to start
     *  something. */
    analysisPending?: boolean;
}

/**
 * The six panels that share the area below the board in portrait. All of
 * them stay mounted and the inactive ones are hidden, so switching panes
 * never re-joins a chat channel, drops the watched game's chat subscription
 * or loses the log's scroll position.
 */
export function KibitzPortraitPanes({
    active,
    chat,
    leftAside,
    roomChannel,
    analysis,
    analysisPending = false,
}: KibitzPortraitPanesProps): React.ReactElement {
    // Each panel reports both chats, but only knows whether its own is on
    // screen: the game panel never shows the room chat, so it calls every
    // room line unread. Take each flag from the panel that shows that chat.
    const { onUnreadChange } = chat;
    const unread = React.useRef({ room: false, game: false });
    const reportGame = React.useCallback(
        (next: { room: boolean; game: boolean }) => {
            unread.current = { ...unread.current, game: next.game };
            onUnreadChange?.(unread.current);
        },
        [onUnreadChange],
    );
    const reportRoom = React.useCallback(
        (next: { room: boolean; game: boolean }) => {
            unread.current = { ...unread.current, room: next.room };
            onUnreadChange?.(unread.current);
        },
        [onUnreadChange],
    );

    return (
        <div className="KibitzPortraitPanes">
            <div className="KibitzPortraitPanes-pane" hidden={active !== "game-chat"}>
                <KibitzChatPanel
                    {...chat}
                    mode="game"
                    visible={active === "game-chat"}
                    onUnreadChange={reportGame}
                />
            </div>
            <div className="KibitzPortraitPanes-pane" hidden={active !== "room-chat"}>
                <KibitzChatPanel
                    {...chat}
                    mode="room"
                    visible={active === "room-chat"}
                    onUnreadChange={reportRoom}
                />
            </div>
            <div className="KibitzPortraitPanes-pane" hidden={active !== "people"}>
                <ChatUserList channel={roomChannel} />
            </div>
            <div className="KibitzPortraitPanes-pane" hidden={active !== "variations"}>
                <KibitzVariationList
                    variations={leftAside.variations}
                    currentGameId={leftAside.currentGameId}
                    gameById={leftAside.variationGameById}
                    colorIndexes={leftAside.variationColorIndexes}
                    selectedVariationId={leftAside.selectedVariationId}
                    variationFocusRequestId={leftAside.variationFocusRequestId}
                    blockedVariationFlashId={leftAside.blockedVariationFlashId}
                    onRecallVariation={leftAside.onRecallVariation}
                    onHideVariation={leftAside.onHideVariation}
                    onCreateVariation={leftAside.onCreateVariation}
                    createVariationDisabled={leftAside.createVariationDisabled}
                    onClearAll={leftAside.onClearVariations}
                />
            </div>
            <div className="KibitzPortraitPanes-pane" hidden={active !== "rooms"}>
                <KibitzRoomList
                    rooms={leftAside.rooms}
                    activeRoomId={leftAside.activeRoomId}
                    onSelectRoom={leftAside.onSelectRoom}
                    onCreateRoom={leftAside.onCreateRoom}
                    canOpenCreateRoomFlow={leftAside.canOpenCreateRoomFlow}
                    signInHref={leftAside.signInHref}
                    blockedRoomIds={leftAside.blockedRoomIds}
                />
            </div>
            <div className="KibitzPortraitPanes-pane" hidden={active !== "analysis"}>
                {analysis ?? (
                    <div className="KibitzPortraitPanes-empty">
                        {analysisPending
                            ? pgettext(
                                  "Shown in the Kibitz analysis pane while the variation's board is still being built",
                                  "Preparing the board.",
                              )
                            : pgettext(
                                  "Shown in the Kibitz analysis pane while the board shows the live game",
                                  "Start a variation to analyze this game.",
                              )}
                    </div>
                )}
            </div>
        </div>
    );
}
