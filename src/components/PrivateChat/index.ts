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
import * as ReactDOM from "react-dom/client";
import { PrivateChat } from "./PrivateChat";
import { socket } from "@/lib/sockets";
import * as data from "@/lib/data";

interface PrivateChatInstance {
    user_id: number;
    username: string;
    open: () => void;
    sendChat: (text: string, as_system?: true) => void;
    close: () => void;
}

let private_chats: PrivateChatInstance[] = [];
let chat_container: HTMLDivElement | null = null;

function ensureChatContainer() {
    if (!chat_container) {
        chat_container = document.createElement("div");
        chat_container.className = "private-chats-container";
        document.body.appendChild(chat_container);
    }
    return chat_container;
}

function createPrivateChat(user_id: number, username: string): PrivateChatInstance {
    const container = document.createElement("div");
    ensureChatContainer().appendChild(container);

    const componentRef: { current: any } = { current: null };
    let displayState: "open" | "minimized" | "closed" = "open";
    const root: ReactDOM.Root;

    const instance: PrivateChatInstance = {
        user_id,
        username,
        open: () => {
            if (displayState === "closed") {
                displayState = "open";
                ensureChatContainer().appendChild(container);
            }
            if (componentRef.current?.setDisplayState) {
                componentRef.current.setDisplayState("open");
            }
        },
        sendChat: (text: string, as_system?: true) => {
            if (componentRef.current?.sendChat) {
                componentRef.current.sendChat(text, as_system);
            }
        },
        close: () => {
            if (componentRef.current?.handleClose) {
                componentRef.current.handleClose();
            }
            displayState = "closed";
            root.unmount();
            container.remove();
            private_chats = private_chats.filter((pc) => pc.user_id !== user_id);
        },
    };

    // Create a functional component with hooks
    const PrivateChatWrapper = React.forwardRef<any, any>((_, ref) => {
        const [displayState, setDisplayState] = React.useState<"open" | "minimized" | "closed">(
            "open",
        );
        const privateChatRef = React.useRef<any>(null);

        React.useImperativeHandle(
            ref,
            () => ({
                setDisplayState,
                sendChat: (text: string, as_system?: true) => {
                    if (privateChatRef.current?.sendChat) {
                        privateChatRef.current.sendChat(text, as_system);
                    }
                },
                handleClose: () => {
                    setDisplayState("closed");
                    instance.close();
                },
            }),
            [],
        );

        return React.createElement(PrivateChat, {
            ref: privateChatRef,
            user_id,
            username,
            displayState,
            onClose: () => {
                setDisplayState("closed");
                instance.close();
            },
        });
    });

    root = ReactDOM.createRoot(container);
    root.render(
        React.createElement(PrivateChatWrapper, {
            ref: (ref: any) => {
                componentRef.current = ref;
            },
        }),
    );

    return instance;
}

export function getPrivateChat(user_id: number, username: string = "") {
    for (let i = 0; i < private_chats.length; ++i) {
        if (private_chats[i].user_id === user_id) {
            return private_chats[i];
        }
    }

    const instance = createPrivateChat(user_id, username);
    private_chats.push(instance);
    return instance;
}

// Handle incoming private messages
socket.on("private-message", (line) => {
    const user = data.get("user");
    if (!user) {
        return;
    }

    let chat_instance;
    if (line.from.id === user.id) {
        chat_instance = getPrivateChat(line.to.id, line.to.username);
    } else if (line.to.id === user.id) {
        chat_instance = getPrivateChat(line.from.id, line.from.username);
        // Open the chat window for incoming messages
        chat_instance.open();
    }

    if (chat_instance) {
        chat_instance.sendChat(line.message, line.system);
    }
});
