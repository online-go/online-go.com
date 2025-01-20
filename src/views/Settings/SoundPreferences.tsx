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
import * as ReactSelect from "react-select";
import Select from "react-select";

import { current_language, pgettext } from "@/lib/translate";

import { usePreference } from "@/lib/preferences";

import { sfx, SpriteGroups, sprite_packs, ValidSound, ValidSoundGroup } from "@/lib/sfx";
import { SpritePack } from "@/lib/sfx_sprites";

import { EventEmitter } from "eventemitter3";
import { LineText } from "@/components/misc-ui";
import { Timeout } from "@/lib/misc";

import { Card } from "@/components/material";
import { Toggle } from "@/components/Toggle";
import { Flag } from "@/components/Flag";

import { PreferenceToggle } from "@/lib/SettingsCommon";

export function SoundPreferences(): React.ReactElement {
    const [tick_tock_start, __setTickTockStart] = usePreference("sound.countdown.tick-tock.start");
    const [ten_seconds_start, __setTenSecondsStart] = usePreference(
        "sound.countdown.ten-seconds.start",
    );
    const [five_seconds_start, __setFiveSecondsStart] = usePreference(
        "sound.countdown.five-seconds.start",
    );
    const [every_second_start, __setEverySecondStart] = usePreference(
        "sound.countdown.every-second.start",
    );
    const [count_direction, __setCountDirection] = usePreference(
        "sound.countdown.byoyomi-direction",
    );
    let count_direction_auto = "down";

    if (count_direction === "auto") {
        count_direction_auto =
            current_language === "ja" || current_language === "ko" ? "up" : "down";
    }

    const count_direction_computed =
        count_direction !== "auto" ? count_direction : count_direction_auto;

    function setTickTockStart(opt: ReactSelect.SingleValue<{ value: number }>): void {
        if (opt) {
            __setTickTockStart(opt.value);
        }
    }
    function setTenSecondsStart(opt: ReactSelect.SingleValue<{ value: number }>): void {
        if (opt) {
            __setTenSecondsStart(opt.value);
        }
    }
    function setFiveSecondsStart(opt: ReactSelect.SingleValue<{ value: number }>): void {
        if (opt) {
            __setFiveSecondsStart(opt.value);
        }
    }
    function setEverySecondStart(opt: ReactSelect.SingleValue<{ value: number }>): void {
        if (opt) {
            __setEverySecondStart(opt.value);
        }
    }
    function setCountDirection(opt: ReactSelect.SingleValue<{ value: string }>): void {
        if (opt) {
            __setCountDirection(opt.value);
        }
    }

    const start_options = [
        { value: 0, label: pgettext("Never play the countdown sound", "Never") },
        {
            value: 60,
            label: pgettext("Start playing the countdown sound at 60 seconds", "60 seconds"),
        },
        {
            value: 45,
            label: pgettext("Start playing the countdown sound at 45 seconds", "45 seconds"),
        },
        {
            value: 30,
            label: pgettext("Start playing the countdown sound at 30 seconds", "30 seconds"),
        },
        {
            value: 20,
            label: pgettext("Start playing the countdown sound at 20 seconds", "20 seconds"),
        },
        {
            value: 15,
            label: pgettext("Start playing the countdown sound at 15 seconds", "15 seconds"),
        },
        {
            value: 10,
            label: pgettext("Start playing the countdown sound at 10 seconds", "10 seconds"),
        },
        {
            value: 5,
            label: pgettext("Start playing the countdown sound at 5 seconds", "5 seconds"),
        },
        {
            value: 3,
            label: pgettext("Start playing the countdown sound at 3 seconds", "3 seconds"),
        },
    ];

    const start_options_fives = [
        { value: 0, label: pgettext("Never play the countdown sound", "Never") },
        {
            value: 60,
            label: pgettext("Start playing the countdown sound at 60 seconds", "60 seconds"),
        },
        {
            value: 45,
            label: pgettext("Start playing the countdown sound at 45 seconds", "45 seconds"),
        },
        {
            value: 30,
            label: pgettext("Start playing the countdown sound at 30 seconds", "30 seconds"),
        },
        {
            value: 20,
            label: pgettext("Start playing the countdown sound at 20 seconds", "20 seconds"),
        },
        {
            value: 15,
            label: pgettext("Start playing the countdown sound at 15 seconds", "15 seconds"),
        },
        {
            value: 10,
            label: pgettext("Start playing the countdown sound at 10 seconds", "10 seconds"),
        },
        {
            value: 5,
            label: pgettext("Start playing the countdown sound at 5 seconds", "5 seconds"),
        },
    ];

    const start_options_tens = [
        { value: 0, label: pgettext("Never play the countdown sound", "Never") },
        {
            value: 60,
            label: pgettext("Start playing the countdown sound at 60 seconds", "60 seconds"),
        },
        {
            value: 50,
            label: pgettext("Start playing the countdown sound at 50 seconds", "50 seconds"),
        },
        {
            value: 40,
            label: pgettext("Start playing the countdown sound at 40 seconds", "40 seconds"),
        },
        {
            value: 30,
            label: pgettext("Start playing the countdown sound at 30 seconds", "30 seconds"),
        },
        {
            value: 20,
            label: pgettext("Start playing the countdown sound at 20 seconds", "20 seconds"),
        },
        {
            value: 10,
            label: pgettext("Start playing the countdown sound at 10 seconds", "10 seconds"),
        },
    ];

    const counting_direction_options = [
        {
            value: "auto",
            label:
                count_direction_auto === "up"
                    ? pgettext(
                          "Let the system decide which way to announce seconds left on the clock (up)",
                          "Auto (up)",
                      )
                    : pgettext(
                          "Let the system decide which way to announce seconds left on the clock (down)",
                          "Auto (down)",
                      ),
        },
        { value: "down", label: pgettext("Announce seconds left counting down", "Down") },
        { value: "up", label: pgettext("Announce seconds left counting up", "Up") },
    ];

    return (
        <div>
            <div className="Settings-Card">
                <div>
                    <h4>{pgettext("Overall sound level", "Master Volume")}</h4>

                    <span></span>
                    <span>
                        <Volume
                            group="master"
                            sample={["black-1", "white-2", "capture-handful", "5_periods_left"]}
                        />
                    </span>
                </div>

                <div>
                    <h4>
                        {pgettext(
                            'Sound pack to use for things like "You have won" and "Undo requested" phrases',
                            "Game Voice",
                        )}
                    </h4>
                    <span>
                        <SoundPackSelect group="game_voice" options={SpriteGroups.game_voice} />
                    </span>
                    <span>
                        <Volume group="game_voice" sample={["byoyomi", "you_have_won"]} />
                    </span>
                </div>

                <div>
                    <h4>
                        {pgettext(
                            'Sound pack to use for clock countdown, "3", "2", "1"',
                            "Clock Countdown",
                        )}
                    </h4>
                    <span>
                        <SoundPackSelect group="countdown" options={SpriteGroups.countdown} />
                    </span>
                    <span>
                        <Volume
                            group="countdown"
                            sample={["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"]}
                        />
                    </span>
                </div>
                <div>
                    <h5>
                        {pgettext(
                            "When we should start playing the soft clock tick-tock sound when the clock is running out",
                            "Soft tick-tock every second starting at",
                        )}
                    </h5>

                    <span>
                        <Select
                            className="sound-option-select"
                            classNamePrefix="ogs-react-select"
                            value={start_options.filter((opt) => opt.value === tick_tock_start)[0]}
                            getOptionValue={(data) => data.value.toString()}
                            onChange={setTickTockStart}
                            options={start_options}
                            isClearable={false}
                            isSearchable={false}
                            blurInputOnSelect={true}
                            components={{
                                Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                                    <div
                                        ref={innerRef}
                                        {...innerProps}
                                        className={
                                            "sound-option " +
                                            (isFocused ? "focused " : "") +
                                            (isSelected ? "selected" : "")
                                        }
                                    >
                                        {data.label}
                                    </div>
                                ),
                                SingleValue: ({ innerProps, data }) => (
                                    <span {...innerProps} className="sound-option">
                                        {data.label}
                                    </span>
                                ),
                                ValueContainer: ({ children }) => (
                                    <div className="sound-option-container">{children}</div>
                                ),
                            }}
                        />
                    </span>

                    <span>
                        <PlayButton
                            sample={[
                                "tick",
                                "tock",
                                "tick",
                                "tock",
                                "tick",
                                "tock-3left",
                                "tick-2left",
                                "tock-1left",
                            ]}
                        />
                    </span>
                </div>
                <div>
                    <h5>
                        {pgettext(
                            "When we should start counting down at 10 second intervals",
                            "Count every 10 seconds starting at",
                        )}
                    </h5>

                    <span>
                        <Select
                            className="sound-option-select"
                            classNamePrefix="ogs-react-select"
                            value={
                                start_options_tens.filter(
                                    (opt) => opt.value === ten_seconds_start,
                                )[0]
                            }
                            getOptionValue={(data) => data.value.toString()}
                            onChange={setTenSecondsStart}
                            options={start_options_tens}
                            isClearable={false}
                            isSearchable={false}
                            blurInputOnSelect={true}
                            components={{
                                Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                                    <div
                                        ref={innerRef}
                                        {...innerProps}
                                        className={
                                            "sound-option " +
                                            (isFocused ? "focused " : "") +
                                            (isSelected ? "selected" : "")
                                        }
                                    >
                                        {data.label}
                                    </div>
                                ),
                                SingleValue: ({ innerProps, data }) => (
                                    <span {...innerProps} className="sound-option">
                                        {data.label}
                                    </span>
                                ),
                                ValueContainer: ({ children }) => (
                                    <div className="sound-option-container">{children}</div>
                                ),
                            }}
                        />
                    </span>

                    <span>
                        <PlayButton sample={["60", "50", "40", "30", "20", "10"]} />
                    </span>
                </div>
                <div>
                    <h5>
                        {pgettext(
                            "When we should start counting down at 5 second intervals",
                            "Count every 5 seconds starting at",
                        )}
                    </h5>

                    <span>
                        <Select
                            className="sound-option-select"
                            classNamePrefix="ogs-react-select"
                            value={
                                start_options_fives.filter(
                                    (opt) => opt.value === five_seconds_start,
                                )[0]
                            }
                            getOptionValue={(data) => data.value.toString()}
                            onChange={setFiveSecondsStart}
                            options={start_options_fives}
                            isClearable={false}
                            isSearchable={false}
                            blurInputOnSelect={true}
                            components={{
                                Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                                    <div
                                        ref={innerRef}
                                        {...innerProps}
                                        className={
                                            "sound-option " +
                                            (isFocused ? "focused " : "") +
                                            (isSelected ? "selected" : "")
                                        }
                                    >
                                        {data.label}
                                    </div>
                                ),
                                SingleValue: ({ innerProps, data }) => (
                                    <span {...innerProps} className="sound-option">
                                        {data.label}
                                    </span>
                                ),
                                ValueContainer: ({ children }) => (
                                    <div className="sound-option-container">{children}</div>
                                ),
                            }}
                        />
                    </span>

                    <span>
                        <PlayButton sample={["30", "25", "20", "15", "10", "5"]} />
                    </span>
                </div>

                <div>
                    <h5>
                        {pgettext(
                            "When we should start announcing time left on the clock every second",
                            "Count every second starting at",
                        )}
                    </h5>

                    <span>
                        <Select
                            className="sound-option-select"
                            classNamePrefix="ogs-react-select"
                            value={
                                start_options.filter((opt) => opt.value === every_second_start)[0]
                            }
                            getOptionValue={(data) => data.value.toString()}
                            onChange={setEverySecondStart}
                            options={start_options}
                            isClearable={false}
                            isSearchable={false}
                            blurInputOnSelect={true}
                            components={{
                                Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                                    <div
                                        ref={innerRef}
                                        {...innerProps}
                                        className={
                                            "sound-option " +
                                            (isFocused ? "focused " : "") +
                                            (isSelected ? "selected" : "")
                                        }
                                    >
                                        {data.label}
                                    </div>
                                ),
                                SingleValue: ({ innerProps, data }) => (
                                    <span {...innerProps} className="sound-option">
                                        {data.label}
                                    </span>
                                ),
                                ValueContainer: ({ children }) => (
                                    <div className="sound-option-container">{children}</div>
                                ),
                            }}
                        />
                    </span>

                    <span>
                        <PlayButton sample={["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"]} />
                    </span>
                </div>

                <div>
                    <h5>
                        {pgettext(
                            "When announcing how long is left on the clock during a byo-yomi period, should we count up or down?",
                            "Count up or down during a byo-yomi period?",
                        )}
                    </h5>

                    <span>
                        <Select
                            className="sound-option-select"
                            classNamePrefix="ogs-react-select"
                            value={
                                counting_direction_options.filter(
                                    (opt) => opt.value === count_direction,
                                )[0]
                            }
                            getOptionValue={(data) => data.value}
                            onChange={setCountDirection}
                            options={counting_direction_options}
                            isClearable={false}
                            isSearchable={false}
                            blurInputOnSelect={true}
                            components={{
                                Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                                    <div
                                        ref={innerRef}
                                        {...innerProps}
                                        className={
                                            "sound-option " +
                                            (isFocused ? "focused " : "") +
                                            (isSelected ? "selected" : "")
                                        }
                                    >
                                        {data.label}
                                    </div>
                                ),
                                SingleValue: ({ innerProps, data }) => (
                                    <span {...innerProps} className="sound-option">
                                        {data.label}
                                    </span>
                                ),
                                ValueContainer: ({ children }) => (
                                    <div className="sound-option-container">{children}</div>
                                ),
                            }}
                        />
                    </span>

                    <span>
                        <PlayButton
                            sample={
                                count_direction_computed === "up"
                                    ? ["1", "2", "3", "4", "5"]
                                    : ["5", "4", "3", "2", "1"]
                            }
                        />
                    </span>
                </div>

                <div>
                    <h4>
                        {pgettext(
                            "Sound pack to use for things like stone placement sounds",
                            "Stone Sounds",
                        )}
                    </h4>
                    <span>
                        <SoundPackSelect group="stones" options={SpriteGroups.stones} />
                    </span>
                    <span>
                        <Volume group="stones" sample={["black-1", "white-2", "black-3"]} />
                    </span>
                </div>

                <div>
                    <h4>{pgettext("Sound pack to use for various effects", "Effects")}</h4>
                    <span>
                        <SoundPackSelect group="effects" options={SpriteGroups.effects} />
                    </span>
                    <span>
                        <Volume group="effects" sample={["tutorial-bling", "tutorial-pass"]} />
                    </span>
                </div>
            </div>

            <LineText>
                {pgettext("Settings for individual sound options", "Individual sound options")}
            </LineText>

            <div className="flex-row">
                <div className="flex-col sound-sample-left-column">
                    <Card>
                        <SoundToggle
                            name={pgettext("Sound sample option", "Byoyomi")}
                            sprite="byoyomi"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Overtime")}
                            sprite="overtime"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Start Counting")}
                            sprite="start_counting"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Period")}
                            sprite="period"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "5 periods left")}
                            sprite="5_periods_left"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "4 periods left")}
                            sprite="4_periods_left"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "3 periods left")}
                            sprite="3_periods_left"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "2 periods left")}
                            sprite="2_periods_left"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Last period")}
                            sprite="last_period"
                            voiceOpt={true}
                        />
                    </Card>

                    <Card>
                        <SoundToggle
                            name={pgettext("Sound sample option", "Black wins")}
                            sprite="black_wins"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "White wins")}
                            sprite="white_wins"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "You have won")}
                            sprite="you_have_won"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Tie")}
                            sprite="tie"
                            voiceOpt={true}
                        />
                    </Card>

                    <Card>
                        <SoundToggle
                            name={pgettext("Sound sample option", "Challenge received")}
                            sprite="challenge_received"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Game started")}
                            sprite="game_started"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Game paused")}
                            sprite="game_paused"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Game resumed")}
                            sprite="game_resumed"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Undo granted")}
                            sprite="undo_granted"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Undo requested")}
                            sprite="undo_requested"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Pass")}
                            sprite="pass"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Remove the dead stones")}
                            sprite="remove_the_dead_stones"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Review started")}
                            sprite="review_started"
                            voiceOpt={true}
                        />
                    </Card>
                </div>
                <div className="flex-col">
                    <Card>
                        <SoundToggle
                            name={pgettext("Sound sample option", "Capture 1 stone")}
                            sprite="capture-1"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Capture 2 stones")}
                            sprite="capture-2"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Capture 3 stones")}
                            sprite="capture-3"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Capture 4 stones")}
                            sprite="capture-4"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Capture 5 stones")}
                            sprite="capture-5"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Capture 1 stone - pile")}
                            sprite="capture-1-pile"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Capture 2 stones - pile")}
                            sprite="capture-2-pile"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Capture 3 stones - pile")}
                            sprite="capture-3-pile"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Capture 4 stones - pile")}
                            sprite="capture-4-pile"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Capture lots of stones")}
                            sprite="capture-handful"
                        />
                    </Card>

                    <Card>
                        <SoundToggle
                            name={pgettext("Sound sample option", "Disconnected")}
                            sprite="disconnected"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Reconnected")}
                            sprite="reconnected"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Player disconnected")}
                            sprite="player_disconnected"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Player reconnected")}
                            sprite="player_reconnected"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Your opponent has disconnected")}
                            sprite="your_opponent_has_disconnected"
                            voiceOpt={true}
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Your opponent has reconnected")}
                            sprite="your_opponent_has_reconnected"
                            voiceOpt={true}
                        />
                    </Card>

                    <Card>
                        <SoundToggle
                            name={pgettext("Sound sample option", "Tutorial - bling")}
                            sprite="tutorial-bling"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Tutorial - pass")}
                            sprite="tutorial-pass"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Tutorial - fail")}
                            sprite="tutorial-fail"
                        />
                        <SoundToggle
                            name={pgettext("Sound sample option", "Tutorial - ping")}
                            sprite="tutorial-ping"
                        />
                    </Card>

                    <Card>
                        <PreferenceToggle
                            name={pgettext(
                                "Shift the audio to the left or right depending on where the stone was placed.",
                                "Positional stone placement effect",
                            )}
                            preference="sound.positional-stone-placement-effect"
                        />
                        {(navigator.vibrate as any) ? (
                            <PreferenceToggle
                                name={pgettext(
                                    "On mobile devices, vibrate when a stone is placed?",
                                    "Vibrate when stone is placed",
                                )}
                                preference="sound.vibrate-on-stone-placement"
                            />
                        ) : null}
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SoundToggle(props: {
    name: string;
    sprite: ValidSound;
    voiceOpt?: boolean;
}): React.ReactElement {
    const [on, __set]: [boolean, (x: boolean) => void] = React.useState(
        sfx.getSpriteEnabled(props.sprite),
    );
    const [voice, __setVoice]: [boolean, (x: boolean) => void] = React.useState(
        sfx.getSpriteVoiceEnabled(props.sprite),
    );

    function setSpriteEnabled(on: boolean): void {
        sfx.setSpriteEnabled(props.sprite, on);
        __set(on);
    }

    function setSpriteVoiceEnabled(on: boolean): void {
        sfx.setSpriteVoiceEnabled(props.sprite, on);
        __setVoice(on);
    }
    return (
        <div className="SoundToggle">
            <label>
                <span className="sound-toggle-name">{props.name}</span>
                <Toggle
                    id={`sprite-enabled-${props.sprite}`}
                    onChange={setSpriteEnabled}
                    checked={on}
                />
            </label>
            {props.voiceOpt && (
                <label className="SoundToggle-voice-label">
                    {voice ? (
                        <span className="voice-or-effect">
                            {pgettext("Use the spoken voice sound for this sound effect", "Voice")}
                        </span>
                    ) : (
                        <span className="voice-or-effect">
                            {pgettext("Use a non verbal sound effect", "Effect")}
                        </span>
                    )}
                    <Toggle
                        disabled={!on}
                        id={`sprite-enabled-${props.sprite}-voice`}
                        onChange={setSpriteVoiceEnabled}
                        checked={voice}
                    />
                </label>
            )}
            <PlayButton sample={props.sprite} />
        </div>
    );
}

function Volume(props: {
    group: ValidSoundGroup;
    sample: ValidSound | Array<ValidSound>;
}): React.ReactElement {
    const [volume, __setVolume]: [number, (x: number) => void] = React.useState(
        sfx.getVolume(props.group),
    );

    function setVolume(v: number): void {
        __setVolume(v);
        sfx.setVolume(props.group, v);
    }

    function setVolumeHandler(ev: React.ChangeEvent<HTMLInputElement>): void {
        setVolume(parseFloat(ev.target.value));
    }

    function toggleVolumeHandler(): void {
        if (volume > 0) {
            setVolume(0);
        } else {
            setVolume(1);
        }
    }

    return (
        <span className="volume">
            <i
                className={
                    "fa volume-icon " +
                    (volume === 0
                        ? "fa-volume-off"
                        : volume > 0.5
                          ? "fa-volume-up"
                          : "fa-volume-down")
                }
                onClick={toggleVolumeHandler}
            />
            <input
                type="range"
                onChange={setVolumeHandler}
                value={volume}
                min={0}
                max={1.0}
                step={0.05}
            />

            <PlayButton sample={props.sample} />
        </span>
    );
}

let play_timeout: Timeout | null = null;
const play_emitter = new EventEmitter();

function PlayButton(props: { sample: ValidSound | Array<ValidSound> }): React.ReactElement {
    const [playing, setPlaying]: [boolean, any] = React.useState(false);
    const samples: Array<ValidSound> =
        typeof props.sample === "string" ? [props.sample] : props.sample;

    function play(): void {
        const _samples = samples.slice();
        if (play_timeout) {
            clearTimeout(play_timeout);
        }
        sfx.stop();
        play_emitter.emit("stop");
        play_emitter.once("stop", () => setPlaying(false));

        function process_next() {
            play_timeout = null;
            if (_samples.length) {
                const sample = _samples.shift();
                play_timeout = setTimeout(process_next, 1000);
                if (sample) {
                    sfx.play(sample);
                }
            } else {
                setPlaying(false);
            }
        }

        process_next();
        setPlaying(true);
    }

    function stop(): void {
        play_emitter.emit("stop");
        if (play_timeout) {
            clearTimeout(play_timeout);
        }
        play_timeout = null;
        sfx.stop();
        setPlaying(false);
    }

    return playing ? (
        <span onClick={stop} style={{ cursor: "pointer" }}>
            <i className="fa fa-stop" />
        </span>
    ) : (
        <span onClick={play} style={{ cursor: "pointer" }}>
            <i className="fa fa-play" />
        </span>
    );
}

function SoundPackSelect(props: {
    group: ValidSoundGroup;
    options: Array<SpritePack>;
}): React.ReactElement {
    const [pack_id, __setPackId]: [string, (x: string) => void] = React.useState(
        sfx.getPackId(props.group),
    );

    function filter({ data }: { data: SpritePack }, text: string): boolean {
        if (!text) {
            text = "";
        }
        text = text.toLowerCase();
        const pack: SpritePack = data;

        if (pack.name.toLowerCase().indexOf(text) >= 0) {
            return true;
        }
        if (pack.pack_id.toLowerCase().indexOf(text) >= 0) {
            return true;
        }
        return false;
    }

    function setPackId(pack: ReactSelect.SingleValue<SpritePack>): void {
        if (pack) {
            __setPackId(pack.pack_id);
            sfx.setPackId(props.group, pack.pack_id);
        }
    }

    return (
        <Select
            className="sound-select"
            classNamePrefix="ogs-react-select"
            value={sprite_packs[pack_id]}
            onChange={setPackId}
            options={props.options}
            isClearable={false}
            isSearchable={false}
            blurInputOnSelect={true}
            filterOption={filter}
            getOptionLabel={(pack) => pack.pack_id}
            getOptionValue={(pack) => pack.pack_id}
            components={{
                Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                    <div
                        ref={innerRef}
                        {...innerProps}
                        className={
                            "sound-pack-option " +
                            (isFocused ? "focused " : "") +
                            (isSelected ? "selected" : "")
                        }
                    >
                        <Flag country={data.country} /> {data.name}
                    </div>
                ),
                SingleValue: ({ innerProps, data }) => (
                    <span {...innerProps} className="sound-pack-option">
                        <Flag country={data.country} /> {data.name}
                    </span>
                ),
                ValueContainer: ({ children }) => (
                    <div className="sound-pack-option-container">{children}</div>
                ),
            }}
        />
    );
}
