/*
 * Copyright (C) 2012-2020  Online-go.com
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

export interface PopupMenuItem {
    title: string;
    onClick: () => void;
}

interface PopupMenuProps { list: PopupMenuItem[]; }

export class PopupMenu extends React.Component<PopupMenuProps, {isListOpen: boolean}> {

    constructor(props: PopupMenuProps) {
        super(props);
        this.state = {
          isListOpen: false
        };
    }

    toggleList = () => {
        this.setState(prevState => ({
          isListOpen: !prevState.isListOpen,
        }));
    }

    render() {
        const { isListOpen } = this.state;
        const { list } = this.props;

        return (
          <div className="popup-menu">
            <button
              type="button"
              className="popup-menu-button"
              onClick={this.toggleList}>
              <i className = "fa fa-caret-down"/>
            </button>
            {isListOpen && (
              <div
                role="list"
                className="popup-menu-list"
              >
                {list.map((item: PopupMenuItem) => (
                  <button
                    type="button"
                    className="popup-menu-item"
                    onClick={item.onClick}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
    }

    close = () => {
        if (this.state.isListOpen) {
            this.setState({
                isListOpen: false,
            });
        }

        console.log("closed");
    }

    componentDidUpdate() {
        const { isListOpen } = this.state;

        setTimeout(() => {
            if (isListOpen) {
              window.addEventListener('click', this.close);
            } else {
              window.removeEventListener('click', this.close);
            }
          }, 0);
    }
}
