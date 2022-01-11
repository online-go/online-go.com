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
import { _, pgettext, interpolate } from "translate";
import { post, get, abort_requests_in_flight } from "requests";
import * as Autosuggest from "react-autosuggest";

interface GroupAutocompleteProperties {
    onComplete: (user) => void;
    placeholder?: string;
}

interface Suggestion {
    name: string;
}

const getSuggestionValue = (suggestion: Suggestion) => {
    return suggestion.name;
};

const renderSuggestion = (suggestion: Suggestion) => <div>{suggestion.name}</div>;

const groups_by_name = {};

interface GroupAutocompleteState {
    value: string;
    suggestions: Suggestion[];
}

export class GroupAutocomplete extends React.PureComponent<GroupAutocompleteProperties, GroupAutocompleteState> {
    last_on_complete_username = null;
    current_search = null;
    tabbed_out = false;

    constructor(props) {
        super(props);
        this.state = {
            value: "",
            suggestions: [],
        };
    }

    clear() {
        this.setState({ value: "" });
    }
    complete(groupname) {
        if (groupname in groups_by_name) {
            if (this.last_on_complete_username !== groupname) {
                this.props.onComplete(groups_by_name[groupname]);
                this.last_on_complete_username = groupname;
            }
        } else {
            this.props.onComplete(null);
            this.last_on_complete_username = null;
        }
    }
    onChange = (event, { newValue }) => {
        this.setState({
            value: newValue,
        });
        this.complete(newValue);
    };
    onSuggestionsFetchRequested = ({ value }) => {
        if (this.current_search === value) {
            return;
        }

        abort_requests_in_flight("players/");
        this.current_search = value;

        if (value.length > 1) {
            get("groups/", { name__istartswith: value, page_size: 10 })
                .then((res: { results: Suggestion[] }) => {
                    for (const group of res.results) {
                        groups_by_name[group.name] = group;
                    }

                    this.setState({
                        suggestions: res.results,
                    });

                    if (this.state.value in groups_by_name) {
                        this.complete(this.state.value);
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        } else {
            this.setState({
                suggestions: [],
            });
        }
    };
    onSuggestionsClearRequested = () => {
        this.setState({
            suggestions: [],
        });
    };
    //onBlur = (ev, {focusedSuggestion}) => {
    onBlur = (ev, { highlightedSuggestion }) => {
        if (this.tabbed_out) {
            if (highlightedSuggestion) {
                this.setState({ value: getSuggestionValue(highlightedSuggestion) });
                this.complete(getSuggestionValue(highlightedSuggestion));
            }
        }
    };
    onKeyDown = (ev) => {
        if (ev.keyCode === 9) {
            this.tabbed_out = true;
        } else {
            this.tabbed_out = false;
        }
    };

    render() {
        const { suggestions, value } = this.state;

        const inputProps = {
            placeholder: this.props.placeholder || _("Group name"),
            value,
            onBlur: this.onBlur,
            onKeyDown: this.onKeyDown,
            onChange: this.onChange,
        };

        return (
            <span className="GroupAutocomplete">
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
