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

import * as data from "@/lib/data";
import { readPortraitPane, writePortraitPane } from "./kibitzPortraitPane";

beforeEach(() => {
    data.remove("kibitz.portrait_pane");
    data.remove("kibitz.chat_tab");
});

test("defaults to the room chat", () => {
    expect(readPortraitPane()).toBe("room-chat");
});

test("round-trips a stored pane", () => {
    writePortraitPane("variations");
    expect(readPortraitPane()).toBe("variations");
});

test("seeds itself from the old chat tab", () => {
    data.set("kibitz.chat_tab", "game");
    expect(readPortraitPane()).toBe("game-chat");
    expect(data.get("kibitz.portrait_pane")).toBe("game-chat");
});

test("leaves the old chat tab for the landscape chat panel, which still uses it", () => {
    data.set("kibitz.chat_tab", "game");
    readPortraitPane();
    expect(data.get("kibitz.chat_tab")).toBe("game");
});

test("ignores a stored value that is not a pane", () => {
    data.set("kibitz.portrait_pane", "nonsense" as never);
    expect(readPortraitPane()).toBe("room-chat");
});
