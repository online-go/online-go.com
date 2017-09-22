/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {_, pgettext, interpolate} from "translate";
import {post, get, abort_requests_in_flight} from "requests";
import * as player_cache from "player_cache";

import _Autosuggest = require("react-autosuggest");
let Autosuggest = _Autosuggest as any;

interface PlayerAutocompleteProperties {
    onComplete: (user) => void;
    playerId?: number;
    placeholder?: string;
}

const getSuggestionValue = (suggestion) => {
    return suggestion.username;
};

const renderSuggestion = suggestion => ( <div>{suggestion.username}</div>);

export class PlayerAutocomplete extends React.PureComponent<PlayerAutocompleteProperties, any> {
    last_on_complete_username = null;
    current_search = null;
    tabbed_out = false;

    constructor(props) {
        super(props);
        this.state = {
            value: "",
            suggestions: []
        };

        if (this.props.playerId) {
            let user = player_cache.lookup(this.props.playerId);
            if (user && user.username) {
                this.state.value = user.username;
            }
        }
    }

    componentWillReceiveProps(next_props) {{{
        if (this.props.playerId !== next_props.player_id) {
            let user = player_cache.lookup(this.props.playerId);
            if (user && user.username) {
                this.setState({value: user.username});
            }
        }
    }}}

    clear() {
        this.setState({value: "", suggestions: []});
    }
    complete(username) {{{
        if (player_cache.lookup_by_username(username)) {
            if (this.last_on_complete_username !== username) {
                this.props.onComplete(player_cache.lookup_by_username(username));
                this.last_on_complete_username = username;
            }
        } else {
            this.props.onComplete(null);
            this.last_on_complete_username = null;
        }
    }}}
    onChange = (event, { newValue }) => {{{
        this.setState({
            value: newValue
        });
        this.complete(newValue);
    }}}
    onSuggestionsFetchRequested = ({ value }) => {{{
        if (this.current_search === value) {
            return;
        }

        abort_requests_in_flight('GET', 'players');
        this.current_search = value;

        if (value.length > 1) {
            get("players", {username__istartswith: value, page_size: 10})
            .then((res) => {
                //console.log("RESULTS: ", res.results);
                for (let user of res.results) {
                    player_cache.update(user);
                }

                this.setState({
                    suggestions: res.results
                });

                if (player_cache.lookup_by_username(this.state.value)) {
                    this.complete(this.state.value);
                }
            })
            .catch((err) => {
                console.log(err);
            });
        } else {
            this.setState({
                suggestions: []
            });
        }
    }}}
    onSuggestionsClearRequested = () => {{{
        this.setState({
            suggestions: []
        });
    }}}
    onBlur = (ev, {focusedSuggestion}) => {{{
        if (this.tabbed_out) {
            if (focusedSuggestion) {
                this.setState({value: getSuggestionValue(focusedSuggestion)});
                this.complete(getSuggestionValue(focusedSuggestion));
            }
        }
    }}}
    onKeyDown = (ev) => {{{
        if (ev.keyCode === 9) {
            this.tabbed_out = true;
        } else {
            this.tabbed_out = false;
        }
    }}}

    render() {
        let { suggestions, value } = this.state;

        const inputProps = {
            placeholder: this.props.placeholder || _("Player name"),
            value,
            onBlur: this.onBlur,
            onKeyDown: this.onKeyDown,
            onChange: this.onChange
        };

        return (
            <span className="PlayerAutocomplete">
                <Autosuggest
                    suggestions={this.state.suggestions}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                    getSuggestionValue={getSuggestionValue}
                    renderSuggestion={renderSuggestion}
                    focusFirstSuggestion={true}
                    inputProps={inputProps}
                    />
            </span>
        );
    }
}
