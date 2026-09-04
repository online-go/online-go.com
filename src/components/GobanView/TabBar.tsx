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
import { selectVisibleTabs } from "./util";
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

/** Read the width, in px, the tab bar's buttons can use, the outer width of
 *  one button (margins included) and the gap between buttons. All three are
 *  null when the bar has no rendered button to measure. */
function measureBar(bar: HTMLDivElement): {
    available_width: number;
    button_width: number;
    gap: number;
} | null {
    const button = bar.querySelector<HTMLElement>(".GobanView-tab-button");
    const group = bar.querySelector<HTMLElement>(".GobanView-tab-bar-left");
    if (!button || !group) {
        return null;
    }
    const bar_style = getComputedStyle(bar);
    const padding =
        (parseFloat(bar_style.paddingLeft) || 0) + (parseFloat(bar_style.paddingRight) || 0);
    const button_style = getComputedStyle(button);
    const margin =
        (parseFloat(button_style.marginLeft) || 0) + (parseFloat(button_style.marginRight) || 0);
    return {
        available_width: bar.clientWidth - padding,
        button_width: button.offsetWidth + margin,
        gap: parseFloat(getComputedStyle(group).gap) || 0,
    };
}

export function TabBar({ tabs }: TabBarProps): React.ReactElement {
    const state = useGobanViewState();
    const barRef = React.useRef<HTMLDivElement>(null);

    const allBarTabs = tabs.filter((t) => t.type !== "always" && !t.hideFromBar);
    const hasOptionalTabs = allBarTabs.some((t) => t.priority !== undefined);

    // Ids of the optional tabs that fit at the last measurement. Optional
    // tabs start hidden so the bar never overflows before it is measured.
    const [visibleOptionalIds, setVisibleOptionalIds] = React.useState<string>("");

    // The measurement depends only on the required tabs, the bar width and
    // the button metrics, none of which change when optional tabs come and
    // go, so re-running it after a change settles on the same answer.
    const tabsSignature = allBarTabs.map((t) => `${t.id}:${t.align}:${t.priority ?? ""}`).join(",");
    const allBarTabsRef = React.useRef(allBarTabs);
    allBarTabsRef.current = allBarTabs;

    const measure = React.useCallback(() => {
        const bar = barRef.current;
        if (!bar) {
            return;
        }
        const metrics = measureBar(bar);
        const visible = metrics
            ? selectVisibleTabs(
                  allBarTabsRef.current,
                  metrics.available_width,
                  metrics.button_width,
                  metrics.gap,
              )
            : allBarTabsRef.current;
        setVisibleOptionalIds(
            visible
                .filter((t) => t.priority !== undefined)
                .map((t) => t.id)
                .join(","),
        );
    }, []);

    React.useLayoutEffect(() => {
        if (hasOptionalTabs) {
            measure();
        }
    }, [hasOptionalTabs, tabsSignature, measure]);

    React.useEffect(() => {
        const bar = barRef.current;
        if (!hasOptionalTabs || !bar || typeof ResizeObserver === "undefined") {
            return undefined;
        }
        const observer = new ResizeObserver(measure);
        observer.observe(bar);
        return () => observer.disconnect();
    }, [hasOptionalTabs, measure]);

    const visibleIds = new Set(visibleOptionalIds.split(","));
    const barTabs = allBarTabs.filter((t) => t.priority === undefined || visibleIds.has(t.id));
    const leftTabs = barTabs.filter((t) => (t.align ?? "left") === "left");
    const centerTabs = barTabs.filter((t) => t.align === "center");
    const rightTabs = barTabs.filter((t) => t.align === "right");

    const handleClick = (tab: TabDefinition, event: React.MouseEvent<HTMLButtonElement>) => {
        if (tab.type === "toggle") {
            const willBeVisible = !state.toggleVisibility[tab.id];
            state.setToggle(tab.id, willBeVisible);
            tab.onToggle?.(willBeVisible);
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
            data-tab-id={tab.id}
            title={tab.title}
            disabled={tab.disabled}
            onClick={(e) => handleClick(tab, e)}
        >
            {renderIcon(tab)}
        </button>
    );

    return (
        <div className="GobanView-tab-bar" ref={barRef}>
            <div className="GobanView-tab-bar-left">{leftTabs.map(renderTab)}</div>
            <div className="GobanView-tab-bar-center">{centerTabs.map(renderTab)}</div>
            <div className="GobanView-tab-bar-right">{rightTabs.map(renderTab)}</div>
        </div>
    );
}
