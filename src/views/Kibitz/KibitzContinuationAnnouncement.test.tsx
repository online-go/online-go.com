/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import * as React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ChatMessage } from "@/lib/chat_manager";
import { ChatLine } from "@/components/Chat";

test("renders the continuation announcement with its room title linked", () => {
    const roomTitle = "Black vs White · #42";
    const line = {
        system: true,
        message: {
            t: 1,
            m: {
                type: "system",
                text: `Continue watching in a separate room: ${roomTitle}`,
                links: [{ text: roomTitle, href: "/kibitz/continuation-room" }],
            },
        },
    } as ChatMessage;

    render(
        <MemoryRouter>
            <ChatLine line={line} />
        </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: roomTitle })).toHaveAttribute(
        "href",
        "/kibitz/continuation-room",
    );
});
