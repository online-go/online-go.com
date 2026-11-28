/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import type { ThreeBoardStyle, ThreeRendererOptions } from "goban";
import { pgettext } from "@/lib/translate";

export type Board3dRotation = NonNullable<ThreeRendererOptions["rotation"]>;
export type Board3dTilt = "auto" | 0 | 15 | 25 | 35;
export type Board3dLighting = "studio" | "daylight";

/** The option lists shared by the board settings popover and the Settings page. */
export function board3dStyleOptions(): { value: ThreeBoardStyle; label: string }[] {
    return [
        { value: "floor", label: pgettext("3D board style", "Traditional floor goban") },
        { value: "tabletop", label: pgettext("3D board style", "Tabletop") },
    ];
}

export function board3dLightingOptions(): { value: Board3dLighting; label: string }[] {
    return [
        { value: "studio", label: pgettext("3D lighting preset", "Studio") },
        { value: "daylight", label: pgettext("3D lighting preset", "Warm daylight") },
    ];
}

export function board3dTiltOptions(): { value: Board3dTilt; label: string }[] {
    return [
        { value: "auto", label: pgettext("3D board angle", "Auto") },
        { value: 0, label: pgettext("3D board angle", "Overhead") },
        { value: 15, label: "15°" },
        { value: 25, label: "25°" },
        { value: 35, label: "35°" },
    ];
}

export function parseBoard3dTilt(value: string): Board3dTilt {
    const angle = Number(value);
    return angle === 0 || angle === 15 || angle === 25 || angle === 35 ? angle : "auto";
}

/** The next camera rotation, one quarter turn clockwise. */
export function nextBoard3dRotation(rotation: Board3dRotation): Board3dRotation {
    return ((rotation + 90) % 360) as Board3dRotation;
}
