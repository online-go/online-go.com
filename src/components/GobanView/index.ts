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

export { GobanView } from "./GobanView";
export type { GobanViewRef, TabDefinition } from "./GobanView";
export { GobanViewTab } from "./GobanViewTab";
export type { GobanViewTabProps } from "./GobanViewTab";
export { MoveNumberSlider } from "./MoveNumberSlider";
export {
    GobanControllerContext,
    useGobanController,
    useGobanControllerOrNull,
} from "./GobanViewContext";
export { goban_view_mode, goban_view_squashed } from "./util";
export type { ViewMode } from "./util";
export { generateGobanHook, subscribeAllEvents, useViewMode, useZenMode } from "./hooks";
