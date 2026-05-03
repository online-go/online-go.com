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
import { _ } from "@/lib/translate";
import { GobanController } from "@/lib/GobanController";
import { GobanContainer } from "@/components/GobanContainer";
import {
    GobanControllerContext,
    GobanViewStateContext,
    GobanViewTabState,
} from "./GobanViewContext";
import { GobanViewTab, GobanViewTabProps } from "./GobanViewTab";
import { TabBar } from "./TabBar";
import { MoveNumberSlider } from "./MoveNumberSlider";
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
    hideFromBar?: boolean;
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
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
    /** Replace the built-in MoveNumberSlider. Renders unconditionally —
     *  including during takeovers — so consumers whose navigation model
     *  needs to remain visible across modes (e.g. joseki) keep a single
     *  control strip in the standard location. The "has-custom-slider"
     *  class is added to the GobanView root so portrait CSS can leave room
     *  for it above the tab bar. */
    customSlider?: React.ReactNode;
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
                hideFromBar: props.hideFromBar,
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
    customSlider,
    ref,
}: GobanViewProps): React.ReactElement {
    const { tabs, others } = React.useMemo(() => partitionChildren(children), [children]);

    // `children` is a fresh reference every parent render, so `tabs` gets a
    // new identity even when the tab set is semantically unchanged. Key the
    // reconciliation effects off a structural signature instead so they
    // only fire when the tab list has meaningfully changed.
    const tabsSignature = tabs
        .map((t) => `${t.id}:${t.type}:${t.disabled ? 1 : 0}:${t.defaultVisible ? 1 : 0}`)
        .join(",");

    const [viewMode, setViewMode] = React.useState<ViewMode>(() => goban_view_mode());
    const [squashed, setSquashed] = React.useState<boolean>(() => goban_view_squashed());
    const [toggleVisibility, setToggleVisibility] = React.useState<Record<string, boolean>>({});
    const [activeTakeover, setActiveTakeover] = React.useState<string | null>(
        defaultActiveTakeover ?? null,
    );

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
    }, [tabsSignature]);

    // Clear activeTakeover if the matching tab was removed or disabled.
    // prevTabsRef preserves the previous tab list so onToggle(false) can
    // still be resolved when the tab is no longer in the current render.
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
    }, [tabsSignature, activeTakeover]);

    const setToggle = React.useCallback((id: string, visible: boolean) => {
        setToggleVisibility((prev) => ({ ...prev, [id]: visible }));
    }, []);

    // The imperative ref must fire displaced.onToggle(false) and
    // opened.onToggle(true) the same way the click-path does, otherwise
    // takeovers opened from outside the tab bar (e.g. a More actions
    // popover) leave consumer mode flags out of sync with the visible UI.
    // Refs let the handle read the latest values without churning identity.
    const tabsRef = React.useRef(tabs);
    tabsRef.current = tabs;
    const activeTakeoverRef = React.useRef(activeTakeover);
    activeTakeoverRef.current = activeTakeover;

    React.useImperativeHandle(
        ref,
        () => ({
            setActiveTakeover: (id: string | null) => {
                const prevActiveId = activeTakeoverRef.current;
                if (prevActiveId === id) {
                    return;
                }
                setActiveTakeover(id);
                if (prevActiveId) {
                    const displaced = tabsRef.current.find(
                        (t) => t.id === prevActiveId && t.type === "takeover",
                    );
                    displaced?.onToggle?.(false);
                }
                if (id) {
                    const opened = tabsRef.current.find(
                        (t) => t.id === id && t.type === "takeover",
                    );
                    opened?.onToggle?.(true);
                }
            },
        }),
        [],
    );

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

    const handleTakeoverClose = (tab: TabDefinition) => {
        setActiveTakeover(null);
        tab.onToggle?.(false);
    };

    const renderPanel = (tab: TabDefinition, visible: boolean) => {
        // hideFromBar takeovers have no tab-bar button to click again, so
        // they need an in-panel close button.
        const showCloseButton = tab.type === "takeover" && tab.hideFromBar;
        return (
            <div
                key={tab.id}
                className={
                    `GobanView-tab-panel ${tab.type}` +
                    (visible ? "" : " hidden") +
                    (tab.type === "takeover" && activeTakeover === tab.id ? " active" : "")
                }
            >
                {showCloseButton && (
                    <button
                        type="button"
                        className="GobanView-tab-panel-close"
                        title={_("Close")}
                        aria-label={_("Close")}
                        onClick={() => handleTakeoverClose(tab)}
                    >
                        <i className="fa fa-times" />
                    </button>
                )}
                {tab.children}
            </div>
        );
    };

    // A `customSlider` renders during takeovers too; the built-in slider
    // keeps its existing "hide during takeover" rule.
    const sliderSlot: React.ReactNode = customSlider
        ? customSlider
        : !hasTakeover && <MoveNumberSlider />;

    const customSliderClass = customSlider ? " has-custom-slider" : "";

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
                            customSliderClass +
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
                        {sliderSlot}
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
                        customSliderClass +
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
                        {sliderSlot}
                        <TabBar tabs={tabs} />
                    </div>
                    {others}
                </div>
            </GobanViewStateContext.Provider>
        </GobanControllerContext.Provider>
    );
}

GobanViewComponent.displayName = "GobanView";

type GobanViewType = typeof GobanViewComponent & { Tab: typeof GobanViewTab };
export const GobanView = GobanViewComponent as GobanViewType;
GobanView.Tab = GobanViewTab;
