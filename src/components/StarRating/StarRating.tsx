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

interface StarRatingProperties {
    value: number;
    rated?: boolean;
    onChange?: (value: number) => void;
}

function star_class(rating: number, v: number) {
    if (rating - (v - 1) < 1.0) {
        if (rating - (v - 1) >= 0.5) {
            return "fa-star-half-o";
        } else {
            return "fa-star-o";
        }
    }

    return "fa-star";
}

export class StarRating extends React.PureComponent<StarRatingProperties, { rating: number }> {
    setters: ((x: React.MouseEvent) => void)[] = [];
    preview: (() => void)[] = [];

    constructor(props: StarRatingProperties) {
        super(props);
        this.state = {
            rating: Math.max(0, Math.min(5, props.value)),
        };

        for (let i = 1; i <= 5; ++i) {
            this.setters.push(() => (this.props.onChange ? this.props.onChange(i) : 0));
        }

        for (let i = 1; i <= 5; ++i) {
            this.preview.push(this.props.onChange ? () => this.setState({ rating: i }) : () => 0);
        }
    }

    componentDidUpdate(oldProps: StarRatingProperties) {
        if (this.props.value !== oldProps.value) {
            this.setState({ rating: Math.max(0, Math.min(5, oldProps.value)) });
        }
    }

    stop_previewing = () => {
        if (!this.props.onChange) {
            return;
        }
        this.setState({ rating: Math.max(0, Math.min(5, this.props.value)) });
    };

    render() {
        return (
            <span
                className={
                    "StarRating" +
                    (this.props.onChange ? " interactive" : "") +
                    (this.props.rated ? " rated" : " unrated")
                }
            >
                {[1, 2, 3, 4, 5].map((v, idx) => (
                    <i
                        key={v}
                        className={"fa " + star_class(this.state.rating, v)}
                        onClick={this.setters[idx]}
                        onMouseOver={this.preview[idx]}
                        onMouseOut={this.stop_previewing}
                    />
                ))}
            </span>
        );
    }
}
