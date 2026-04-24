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
import { GobanController } from "@/lib/GobanController";
import { GobanContainer } from "@/components/GobanContainer";
import {
    GobanControllerContext,
    GobanViewStateContext,
    GobanViewTabState,
} from "./GobanViewContext";
import { GobanViewTab, GobanViewTabProps } from "./GobanViewTab";
import { TabBar } from "./TabBar";
import { goban_view_mode, goban_view_squashed, ViewMode } from "./util";
import "./GobanView.css";

export interface TabDefinition {
    id: string;
    icon?: string | React.ReactNode;
    type: "toggle" | "takeover" | "action" | "always";
    defaultVisible: boolean;
    mobilePosition: "top" | "bottom";
    align: "left" | "center" | "right";
    title?: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    onToggle?: (active: boolean) => void;
    children: React.ReactNode;
}

export interface GobanViewRef {
    /** Open or close a takeover programmatically. Pass null to close any
     *  currently-active takeover. */
    setActiveTakeover: (id: string | null) => void;
}

interface GobanViewProps {
    controller: GobanController;
    className?: string;
    children: React.ReactNode;
    /** Open this takeover on initial mount. Only read once; subsequent
     *  renders ignore changes. Use the ref API for mid-lifetime control. */
    defaultActiveTakeover?: string;
    ref?: React.Ref<GobanViewRef>;
}

function partitionChildren(children: React.ReactNode): {
    tabs: TabDefinition[];
    others: React.ReactNode[];
} {
    const tabs: TabDefinition[] = [];
    const others: React.ReactNode[] = [];
    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === GobanViewTab) {
            const props = child.props as GobanViewTabProps;
            tabs.push({
                id: props.id,
                icon: props.icon,
                type: props.type,
                defaultVisible: props.defaultVisible ?? false,
                mobilePosition: props.mobilePosition ?? "bottom",
                align: props.align ?? "left",
                title: props.title,
                active: props.active,
                disabled: props.disabled,
                onClick: props.onClick,
                onToggle: props.onToggle,
                children: props.children,
            });
        } else if (child !== null && child !== undefined && child !== false) {
            others.push(child);
        }
    });
    return { tabs, others };
}

function GobanViewComponent({
    controller,
    className,
    children,
    defaultActiveTakeover,
    ref,
}: GobanViewProps): React.ReactElement {
    const { tabs, others } = React.useMemo(() => partitionChildren(children), [children]);

    const [viewMode, setViewMode] = React.useState<ViewMode>(() => goban_view_mode());
    const [squashed, setSquashed] = React.useState<boolean>(() => goban_view_squashed());
    const [toggleVisibility, setToggleVisibility] = React.useState<Record<string, boolean>>({});
    const [activeTakeover, setActiveTakeover] = React.useState<string | null>(
        defaultActiveTakeover ?? null,
    );

    // Reconcile toggle defaults with the current tab list: seed any new toggle
    // tabs with their defaultVisible, and drop keys for tabs that no longer exist.
    React.useEffect(() => {
        setToggleVisibility((prev) => {
            const next: Record<string, boolean> = {};
            let changed = false;
            for (const tab of tabs) {
                if (tab.type !== "toggle") {
                    continue;
                }
                if (tab.id in prev) {
                    next[tab.id] = prev[tab.id];
                } else {
                    next[tab.id] = tab.defaultVisible;
                    changed = true;
                }
            }
            if (!changed && Object.keys(prev).length === Object.keys(next).length) {
                return prev;
            }
            return next;
        });
    }, [tabs]);

    // Clear activeTakeover if the matching tab was removed or disabled, and
    // notify its owner via `onToggle(false)` so they can tear down state.
    // The previous tab list is kept in a ref so we can resolve the onToggle
    // even when the tab has been removed entirely from the current render.
    const prevTabsRef = React.useRef<TabDefinition[]>(tabs);
    React.useEffect(() => {
        if (activeTakeover !== null) {
            const current = tabs.find((t) => t.id === activeTakeover && t.type === "takeover");
            if (!current || current.disabled) {
                const prev = prevTabsRef.current.find(
                    (t) => t.id === activeTakeover && t.type === "takeover",
                );
                (current ?? prev)?.onToggle?.(false);
                setActiveTakeover(null);
            }
        }
        prevTabsRef.current = tabs;
    }, [tabs, activeTakeover]);

    const setToggle = React.useCallback((id: string, visible: boolean) => {
        setToggleVisibility((prev) => ({ ...prev, [id]: visible }));
    }, []);

    React.useImperativeHandle(ref, () => ({ setActiveTakeover }), []);

    const onResize = React.useCallback(() => {
        const newMode = goban_view_mode();
        const newSquashed = goban_view_squashed();
        setViewMode((prev) => (prev !== newMode ? newMode : prev));
        setSquashed((prev) => (prev !== newSquashed ? newSquashed : prev));
    }, []);

    const tabState: GobanViewTabState = React.useMemo(
        () => ({
            toggleVisibility,
            activeTakeover,
            setToggle,
            setActiveTakeover,
        }),
        [toggleVisibility, activeTakeover, setToggle, setActiveTakeover],
    );

    const isPortrait = viewMode === "portrait";
    const hasTakeover = activeTakeover !== null;

    const { inlinePanels, takeoverPanels } = React.useMemo(
        () => ({
            inlinePanels: tabs.filter((t) => t.type === "toggle" || t.type === "always"),
            takeoverPanels: tabs.filter((t) => t.type === "takeover"),
        }),
        [tabs],
    );

    const isInlineVisible = (tab: TabDefinition): boolean => {
        if (hasTakeover) {
            return false;
        }
        if (tab.type === "always") {
            return true;
        }
        return !!toggleVisibility[tab.id];
    };

    const renderPanel = (tab: TabDefinition, visible: boolean) => (
        <div
            key={tab.id}
            className={
                `GobanView-tab-panel ${tab.type}` +
                (visible ? "" : " hidden") +
                (tab.type === "takeover" && activeTakeover === tab.id ? " active" : "")
            }
        >
            {tab.children}
        </div>
    );

    if (isPortrait) {
        const topPanels = inlinePanels.filter((t) => t.mobilePosition === "top");
        const bottomPanels = inlinePanels.filter((t) => t.mobilePosition === "bottom");
        const orderedPanels = [...topPanels, ...bottomPanels];

        return (
            <GobanControllerContext.Provider value={controller}>
                <GobanViewStateContext.Provider value={tabState}>
                    <div
                        className={
                            `GobanView portrait` +
                            (squashed ? " squashed" : "") +
                            (hasTakeover ? " has-takeover" : "") +
                            (className ? ` ${className}` : "")
                        }
                    >
                        <div className="GobanView-center">
                            <GobanContainer onResize={onResize} />
                        </div>
                        <div className="GobanView-mobile-scroll">
                            {orderedPanels.map((t) => renderPanel(t, isInlineVisible(t)))}
                        </div>
                        {takeoverPanels.map((t) => renderPanel(t, activeTakeover === t.id))}
                        <TabBar tabs={tabs} />
                        {others}
                    </div>
                </GobanViewStateContext.Provider>
            </GobanControllerContext.Provider>
        );
    }

    return (
        <GobanControllerContext.Provider value={controller}>
            <GobanViewStateContext.Provider value={tabState}>
                <div
                    className={
                        `GobanView ${viewMode}` +
                        (squashed ? " squashed" : "") +
                        (hasTakeover ? " has-takeover" : "") +
                        (className ? ` ${className}` : "")
                    }
                >
                    <div className="GobanView-center">
                        <GobanContainer onResize={onResize} />
                    </div>
                    <div className="GobanView-sidebar">
                        <div className="GobanView-sidebar-content">
                            {inlinePanels.map((t) => renderPanel(t, isInlineVisible(t)))}
                            {takeoverPanels.map((t) => renderPanel(t, activeTakeover === t.id))}
                        </div>
                        <TabBar tabs={tabs} />
                    </div>
                    {others}
                </div>
            </GobanViewStateContext.Provider>
        </GobanControllerContext.Provider>
    );
}

GobanViewComponent.displayName = "GobanView";

// Attach Tab as a static property for the compound component pattern
type GobanViewType = typeof GobanViewComponent & { Tab: typeof GobanViewTab };
export const GobanView = GobanViewComponent as GobanViewType;
GobanView.Tab = GobanViewTab;
