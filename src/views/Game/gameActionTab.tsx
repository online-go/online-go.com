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
import { GobanView } from "@/components/GobanView";
import { GameAction, GameButtonAction, GameToggleAction } from "./GameAction";

/** An action in the tab bar. A link is never in the bar. */
export type BarAction = (GameButtonAction | GameToggleAction) & {
    bar: NonNullable<GameAction["bar"]>;
};

const BAR_ALIGN = ["left", "center", "right"];

/** The actions in the tab bar, in bar order: left, center, then right,
 *  each in its `bar.order`. */
export function sortBarActions(actions: GameAction[]): BarAction[] {
    return actions
        .filter((a): a is BarAction => a.kind !== "link" && a.bar !== null)
        .sort(
            (a, b) =>
                BAR_ALIGN.indexOf(a.bar.align) - BAR_ALIGN.indexOf(b.bar.align) ||
                a.bar.order - b.bar.order,
        );
}

/** The tab bar presenter for one game action. `panel` is the content of a
 *  toggle tab, which GobanView lays out in the sidebar. */
export function gameActionTab(action: BarAction, panel?: React.ReactNode): React.ReactElement {
    const { bar } = action;
    if (action.kind === "toggle") {
        return (
            <GobanView.Tab
                key={action.id}
                id={action.id}
                type="toggle"
                align={bar.align}
                icon={action.icon}
                title={action.label}
                defaultVisible={action.defaultVisible}
                onToggle={action.onToggle}
            >
                {panel}
            </GobanView.Tab>
        );
    }
    return (
        <GobanView.Tab
            key={action.id}
            id={action.id}
            type="action"
            align={bar.align}
            priority={bar.priority}
            icon={action.icon}
            title={action.label}
            active={action.active}
            disabled={action.disabled}
            onClick={action.onClick}
        />
    );
}
