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
import { useContext, useEffect, useId, useRef } from "react";
import clsx from "clsx";
import { Link } from "react-router-dom";

interface MenuProps<T extends React.ElementType> {
    title: string | React.ReactElement;
    menuId: string;
    to?: string;
    children: React.ReactNode;
    className?: string;
    as?: T;
    openMenuLabel: string;
}

/**
 * A navbar menu, the children should be <MenuLink>
 *
 * Accessibility built following the pattern "Disclosure Navigation Menu with Top-Level Links"/
 * see: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/
 *
 * The menu must open on mouse hover, and when clicking or pressing space/enter on the accessibility button.
 * When the menu is open, it can be navigated with tab, and will close when pressing escape.
 */
export function Menu<T extends React.ElementType = "li">({
    title,
    menuId,
    to,
    children,
    className,
    as,
    openMenuLabel,
    ...rest
}: MenuProps<T>): React.ReactElement {
    const Component = as || "li";
    const menuRef = useRef<HTMLUListElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const ariaId = useId();
    const { activeMenu, setActiveMenu } = useContext(MenuContext);

    const isActive = activeMenu === menuId;

    // close on pressing escape
    useEffect(() => {
        if (isActive) {
            const closeOnEscape = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    setActiveMenu(null);
                }
            };
            document.addEventListener("keydown", closeOnEscape);
            return () => {
                document.removeEventListener("keydown", closeOnEscape);
            };
        }
        return () => {};
    }, [isActive]);

    // Add keyboard navigation (arrow up/down) for menu children, only when the menu is open.
    useEffect(() => {
        if (isActive) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();

                    // get focusable items in the menu
                    const items = Array.from(menuRef.current?.querySelectorAll("a, button") ?? []);
                    const activeElement = document.activeElement;

                    if (buttonRef.current === document.activeElement) {
                        // If the menu button is currently focused, and pressed down arrow then we focus the first item.
                        if (e.key === "ArrowDown") {
                            // @ts-expect-error nextElement will always be a <a> or <button>
                            items[0]?.focus();
                        }
                    } else {
                        // We focus the next or previous focusable item relatively the currently selected one.
                        const activeIndex = items.indexOf(activeElement as HTMLElement);
                        if (activeIndex >= 0) {
                            const nextIndex =
                                e.key === "ArrowDown" ? activeIndex + 1 : activeIndex - 1;
                            const nextElement = items[nextIndex];
                            if (nextElement) {
                                // @ts-expect-error nextElement will always be a <a> or <button>
                                nextElement.focus();
                            }
                        }
                    }
                }
            };
            document.addEventListener("keydown", handleKeyDown);
            return () => {
                document.removeEventListener("keydown", handleKeyDown);
            };
        }
        return () => {};
    }, [isActive]);

    return (
        <Component className={clsx("Menu", { active: isActive }, className)} {...rest}>
            {to ? (
                <Link className="Menu-title" to={to}>
                    {title}
                </Link>
            ) : (
                <span className="Menu-title" aria-hidden="true">
                    {title}
                </span>
            )}
            {/* This button is used to open the menu on screen readers and will be displayed only when focused. */}
            <button
                tabIndex={0}
                onClick={() => setActiveMenu(isActive ? null : menuId)}
                className={clsx("OpenMenuButton", {
                    active: isActive,
                })}
                aria-label={openMenuLabel}
                aria-expanded={isActive}
                aria-controls={ariaId}
                ref={buttonRef}
            >
                <span aria-hidden={true}>▼</span>
            </button>
            {/* Children will show one hovering the menu, or when the menu is opened via the button */}
            <ul className="Menu-children" id={ariaId} ref={menuRef}>
                {children}
            </ul>
        </Component>
    );
}

// menu context to track currently open menu
export const MenuContext = React.createContext<{
    activeMenu: string | null;
    setActiveMenu: (menu: string | null) => void;
}>({
    activeMenu: null,
    setActiveMenu: (_menu: string | null) => {},
});
