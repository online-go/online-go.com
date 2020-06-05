/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import * as Autosuggest from 'react-autosuggest';

interface PlayerAutocompleteProperties {
    onComplete: (user) => void;
    playerId?: number;
    placeholder?: string;
    ladderId?: number;
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
                (this.state as any).value = user.username;
            }
        }
    }

    UNSAFE_componentWillReceiveProps(next_props) {
        if (this.props.playerId !== next_props.player_id) {
            let user = player_cache.lookup(this.props.playerId);
            if (user && user.username) {
                this.setState({value: user.username});
            }
        }
    }

    clear() {
        this.setState({value: "", suggestions: []});
    }
    complete(username) {
        if (player_cache.lookup_by_username(username)) {
            if (this.last_on_complete_username !== username) {
                this.props.onComplete(player_cache.lookup_by_username(username));
                this.last_on_complete_username = username;
            }
        } else {
            this.props.onComplete(null);
            this.last_on_complete_username = null;
        }
    }
    onChange = (event, { newValue }) => {
        this.setState({
            value: newValue
        });
        this.complete(newValue);
    }
    onSuggestionsFetchRequested = ({ value }) => {
        if (this.current_search === value) {
            return;
        }

        abort_requests_in_flight("players/");
        this.current_search = value;

        if (value.length > 1) {
            let q = null;

            if (this.props.ladderId) {
                q = get(`ladders/${this.props.ladderId}/players/`, {player__username__istartswith: value, page_size: 10, no_challenge_information: 1});
            }
            else {
                q = get("players/", {username__istartswith: value, page_size: 10});
            }

            q.then((res) => {
                let suggestions = [];
                for (let user of res.results) {
                    if (this.props.ladderId) {
                        user.player.ladder_rank = user.rank;
                        user = user.player;
                    }

                    player_cache.update(user);
                    suggestions.push(user);
                }

                this.setState({ suggestions });

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
    }
    onSuggestionsClearRequested = () => {
        this.setState({
            suggestions: []
        });
    }
    //onBlur = (ev, {focusedSuggestion}) => {
    onBlur = (ev, {highlightedSuggestion}) => {
        if (this.tabbed_out) {
            if (highlightedSuggestion) {
                this.setState({value: getSuggestionValue(highlightedSuggestion)});
                this.complete(getSuggestionValue(highlightedSuggestion));
            }
        }
    }
    onKeyDown = (ev) => {
        if (ev.keyCode === 9) {
            this.tabbed_out = true;
        } else {
            this.tabbed_out = false;
        }
    }

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
                    highlightFirstSuggestion={true}
                    inputProps={inputProps}
                    />
            </span>
        );
    }
}
