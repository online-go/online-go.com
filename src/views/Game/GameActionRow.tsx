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
import { browserHistory } from "@/lib/ogsHistory";
import { GobanViewStateContext } from "@/components/GobanView/GobanViewContext";
import { GameAction } from "./GameAction";
import "./GameActionRow.css";

interface GameActionRowProps {
    action: GameAction;
    /** Called after the action runs, e.g. to close the popover that holds
     *  the row. */
    onDone?: () => void;
}

/**
 * One labelled action, the same in the "..." menu, the dock and the mobile
 * list. The label is in a span after the icon, so the dock can clip it
 * while collapsed. Links route through the app on a plain click; the
 * popover this can render in has no Router context, so it cannot use
 * react-router's Link.
 */
export function GameActionRow({ action, onDone }: GameActionRowProps): React.ReactElement {
    const tab_state = React.useContext(GobanViewStateContext);
    const toggled_on = action.kind === "toggle" && !!tab_state?.toggleVisibility[action.id];
    const active = action.active || toggled_on;
    const className =
        "GameActionRow" + (active ? " active" : "") + (action.disabled ? " disabled" : "");
    const icon =
        typeof action.icon === "string" ? <i className={`fa fa-${action.icon}`} /> : action.icon;

    if (action.kind === "link") {
        const onClick = (ev: React.MouseEvent<HTMLAnchorElement>) => {
            if (action.disabled) {
                ev.preventDefault();
                return;
            }
            const modified =
                ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0;
            if (!action.external && !modified) {
                ev.preventDefault();
                browserHistory.push(action.href);
            }
            onDone?.();
        };
        return (
            <a
                className={className}
                href={action.href}
                title={action.label}
                data-action-id={action.id}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noreferrer" : undefined}
                aria-disabled={action.disabled || undefined}
                onClick={onClick}
            >
                {icon}
                <span className="GameActionRow-label">{action.label}</span>
            </a>
        );
    }

    const onClick = (ev: React.MouseEvent<HTMLButtonElement>) => {
        if (action.kind === "toggle") {
            const next = !toggled_on;
            tab_state?.setToggle(action.id, next);
            action.onToggle?.(next);
        } else {
            action.onClick?.(ev);
        }
        onDone?.();
    };
    return (
        <button
            type="button"
            className={className}
            title={action.label}
            data-action-id={action.id}
            disabled={action.disabled}
            aria-pressed={action.kind === "toggle" ? toggled_on : undefined}
            onClick={onClick}
        >
            {icon}
            <span className="GameActionRow-label">{action.label}</span>
        </button>
    );
}
