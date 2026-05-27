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

import { ogsTest } from "@helpers";
import { kibitzBasicRoomTest } from "./kibitz-basic-room";
import { kibitzEditRoomDetailsTest } from "./kibitz-edit-room-details";
import { kibitzShareVariationTest } from "./kibitz-share-variation";

ogsTest.describe("@Kibitz basic flows", () => {
    ogsTest("Create room, navigate in, and post a chat message", kibitzBasicRoomTest);
    ogsTest("Share an analysis variation", kibitzShareVariationTest);
    ogsTest("Owner edits room details; non-owner cannot", kibitzEditRoomDetailsTest);
});
