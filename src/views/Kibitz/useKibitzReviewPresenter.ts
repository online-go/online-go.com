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

import { generateGobanHook } from "@/components/GobanView";
import * as data from "@/lib/data";
import type { GobanController } from "@/lib/GobanController";
import { isReviewPresenter } from "./kibitzReviewBoard";

/** Whether the viewer presents the review on the room's main board. It
 *  follows control as it passes between users. */
export const useKibitzReviewPresenter = generateGobanHook(
    (goban: GobanController["goban"] | null) => isReviewPresenter(goban, data.get("user")?.id),
    ["review_controller_id", "review.load-end"],
);
