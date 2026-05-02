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
import { GobanViewTabState, GobanViewStateContext } from "./GobanViewContext";
import { TabDefinition } from "./GobanView";
import "./TabBar.css";

function useGobanViewState(): GobanViewTabState {
    const state = React.useContext(GobanViewStateContext);
    if (!state) {
        throw TypeError("TabBar must be rendered inside a GobanView.");
    }
    return state;
}

interface TabBarProps {
    tabs: TabDefinition[];
}

export function TabBar({ tabs }: TabBarProps): React.ReactElement {
    const state = useGobanViewState();

    const barTabs = tabs.filter((t) => t.type !== "always" && !t.hideFromBar);
    const leftTabs = barTabs.filter((t) => (t.align ?? "left") === "left");
    const centerTabs = barTabs.filter((t) => t.align === "center");
    const rightTabs = barTabs.filter((t) => t.align === "right");

    const handleClick = (tab: TabDefinition, event: React.MouseEvent<HTMLButtonElement>) => {
        if (tab.type === "toggle") {
            state.setToggle(tab.id, !state.toggleVisibility[tab.id]);
        } else if (tab.type === "takeover") {
            const prevActiveId = state.activeTakeover;
            const willBeActive = prevActiveId !== tab.id;
            state.setActiveTakeover(willBeActive ? tab.id : null);
            // Opening a different takeover deactivates the previous one.
            if (prevActiveId && prevActiveId !== tab.id) {
                const displaced = tabs.find((t) => t.id === prevActiveId);
                displaced?.onToggle?.(false);
            }
            tab.onToggle?.(willBeActive);
        } else {
            tab.onClick?.(event);
        }
    };

    const isActive = (tab: TabDefinition): boolean => {
        if (tab.type === "toggle") {
            return !!state.toggleVisibility[tab.id];
        }
        if (tab.type === "takeover") {
            return state.activeTakeover === tab.id;
        }
        return !!tab.active;
    };

    const renderIcon = (tab: TabDefinition) => {
        if (typeof tab.icon === "string") {
            return <i className={`fa fa-${tab.icon}`} />;
        }
        return tab.icon;
    };

    const renderTab = (tab: TabDefinition) => (
        <button
            key={tab.id}
            className={`GobanView-tab-button ${isActive(tab) ? "active" : ""}`}
            title={tab.title}
            disabled={tab.disabled}
            onClick={(e) => handleClick(tab, e)}
        >
            {renderIcon(tab)}
        </button>
    );

    return (
        <div className="GobanView-tab-bar">
            <div className="GobanView-tab-bar-left">{leftTabs.map(renderTab)}</div>
            <div className="GobanView-tab-bar-center">{centerTabs.map(renderTab)}</div>
            <div className="GobanView-tab-bar-right">{rightTabs.map(renderTab)}</div>
        </div>
    );
}
