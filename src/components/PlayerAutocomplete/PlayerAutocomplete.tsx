/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { _ } from "translate";
import { get, abort_requests_in_flight } from "requests";
import * as player_cache from "player_cache";
import * as Autosuggest from "react-autosuggest";
import { IdType } from "src/lib/types";

interface PlayerAutocompleteProperties {
    onComplete: (user: player_cache.PlayerCacheEntry | null) => void;
    playerId?: number;
    placeholder?: string;
    ladderId?: IdType;
    className?: string;
}

export interface PlayerAutocompleteRef {
    clear: () => void;
}

interface SuggestionEntry {
    id: number;
    username: string;
}

export const PlayerAutocomplete = React.forwardRef<
    PlayerAutocompleteRef,
    PlayerAutocompleteProperties
>(_PlayerAutocomplete);

function _PlayerAutocomplete(props: PlayerAutocompleteProperties, ref): JSX.Element {
    const [value, setValue]: [string, (x: string) => void] = React.useState(
        player_cache.lookup(props.playerId || 0)?.username || "",
    );
    const [suggestions, setSuggestions]: [SuggestionEntry[], (x: SuggestionEntry[]) => void] =
        React.useState([] as SuggestionEntry[]);
    const tabbed_out = React.useRef(false as boolean);
    const last_on_complete_username = React.useRef("");
    const search = React.useRef("");

    React.useImperativeHandle(ref, () => ({
        clear: () => {
            setValue("");
            setSuggestions([]);
            search.current = "";
            tabbed_out.current = false;
            last_on_complete_username.current = "";
        },
    }));

    React.useEffect(() => {
        setValue(player_cache.lookup(props.playerId || 0)?.username || "");
        setSuggestions([]);
    }, [props.playerId]);

    function onBlur(
        ev: unknown,
        { highlightedSuggestion }: { highlightedSuggestion: SuggestionEntry },
    ): void {
        //if (tabbed_out.current) {
        if (highlightedSuggestion) {
            setValue(getSuggestionValue(highlightedSuggestion));
            complete(getSuggestionValue(highlightedSuggestion));
        } else {
            complete(value);
        }
        //}
    }
    function onKeyDown(ev: React.KeyboardEvent<HTMLInputElement>) {
        if (ev.keyCode === 9) {
            tabbed_out.current = true;
        } else {
            tabbed_out.current = false;
        }

        if (ev.keyCode === 13) {
            complete(value);
        }
    }
    function onChange(ev: React.ChangeEvent<HTMLInputElement>, { newValue }: { newValue: string }) {
        setValue(newValue);
        //complete(newValue);
        console.log("on change fired");
    }

    function onSuggestionSelected(
        event: unknown,
        { suggestion }: { suggestion: SuggestionEntry },
    ): void {
        setValue(getSuggestionValue(suggestion));
        complete(getSuggestionValue(suggestion));
    }

    function complete(username: string): void {
        const player = player_cache.lookup_by_username(username);
        if (player) {
            if (last_on_complete_username.current !== username) {
                props.onComplete(player);
                last_on_complete_username.current = username;
            }
        } else {
            if (!username) {
                props.onComplete(null);
                last_on_complete_username.current = null;
            }
        }
    }

    function onSuggestionsClearRequested(): void {
        setSuggestions([]);
    }

    function onSuggestionsFetchRequested({ value }: { value: string }): void {
        if (search.current === value) {
            return;
        }

        abort_requests_in_flight("players/");
        search.current = value;

        if (value.length > 1) {
            const q = props.ladderId
                ? get(`ladders/${props.ladderId}/players/`, {
                      page_size: 10,
                      player__username__istartswith: value,
                      no_challenge_information: 1,
                  })
                : get("players/", {
                      page_size: 10,
                      username__istartswith: value,
                  });
            q.then((res) => {
                const new_suggestions = [];
                for (let user of res.results) {
                    if (props.ladderId) {
                        user.player.ladder_rank = user.rank;
                        user = user.player;
                    }

                    player_cache.update(user);
                    new_suggestions.push(user);
                }

                setSuggestions(new_suggestions);

                if (player_cache.lookup_by_username(value)) {
                    //complete(value);
                }
            }).catch((err) => {
                if (err.status !== 0) {
                    // status === 0 is an abort
                    console.log(err);
                }
            });
        } else {
            setSuggestions([]);
        }
    }

    const inputProps = React.useMemo(
        () => ({
            placeholder: props.placeholder || _("Player name"),
            value: value,
            onBlur: onBlur,
            onKeyDown: onKeyDown,
            onChange: onChange,
        }),
        [props.placeholder, value],
    );

    return (
        <span className={"PlayerAutocomplete " + (props.className || "")}>
            <Autosuggest
                suggestions={suggestions}
                onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                onSuggestionsClearRequested={onSuggestionsClearRequested}
                onSuggestionSelected={onSuggestionSelected}
                getSuggestionValue={getSuggestionValue}
                renderSuggestion={renderSuggestion}
                highlightFirstSuggestion={true}
                inputProps={inputProps}
            />
        </span>
    );
}

function getSuggestionValue(suggestion: SuggestionEntry): string {
    return suggestion.username;
}

function renderSuggestion(suggestion: SuggestionEntry): JSX.Element {
    return <div>{suggestion.username}</div>;
}
