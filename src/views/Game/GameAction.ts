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

import type * as React from "react";

interface GameActionBase {
    /** For a "toggle" action this is also the id of the GobanView.Tab it switches. */
    id: string;
    /** A Font Awesome name ("sitemap") or a node for other icon sets. */
    icon: string | React.ReactNode;
    label: string;
    /** Tab bar placement and order; null when the action is not in the bar.
     *
     *  `bar` and `menuOrder` are the visibility switches of the tab bar and
     *  the "..." menu; `dockOrder` is the switch of the dock and the mobile
     *  list. An action that the dock and the list show disabled before it is
     *  usable ("Plan conditional moves", "Review this game") sets `dockOrder`
     *  and `disabled` under the broad condition, and sets `bar` and
     *  `menuOrder` only when the action is usable. */
    bar: { align: "left" | "center" | "right"; order: number; priority?: number } | null;
    /** Position in the "..." menu, lowest first. Not in the menu when unset. */
    menuOrder?: number;
    /** The "..." menu puts a divider after the last row of a section:
     *  "tabs" (analyze, chat, review, conditional moves and pause, at the
     *  top of the menu) and "play" (the in-game player actions). */
    menuSection?: "tabs" | "play";
    /** Position in the dock and the mobile scroll list, lowest first. Not in
     *  them when unset. */
    dockOrder?: number;
    active?: boolean;
    disabled?: boolean;
}

/** An action that runs `onClick`. */
export interface GameButtonAction extends GameActionBase {
    kind: "action";
    onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
}

/** A link. The tab bar has no link tabs, so a link is never in the bar. */
interface GameLinkAction extends GameActionBase {
    kind: "link";
    bar: null;
    href: string;
    /** Open in a new tab instead of routing in the app. */
    external?: boolean;
}

/** An action that shows or hides the GobanView toggle tab with the same id. */
export interface GameToggleAction extends GameActionBase {
    kind: "toggle";
    defaultVisible?: boolean;
    onToggle?: (visible: boolean) => void;
}

/**
 * One game page action. The tab bar, the "..." menu, the action dock and the
 * mobile list all render from the same list of these (see useGameActions),
 * each in its own order.
 */
export type GameAction = GameButtonAction | GameLinkAction | GameToggleAction;
