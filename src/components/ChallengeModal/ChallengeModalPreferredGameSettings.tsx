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
import Select from "react-select";
import { OgsResizeDetector } from "@/components/OgsResizeDetector";
import { _, interpolate } from "@/lib/translate";
import {
    preferred_setting_label,
    sort_preferred_settings,
} from "@/components/ChallengeModal/ChallengeModal.utils";
import {
    ChallengeDetails,
    ChallengeInput,
    ChallengeModalConf,
    PreferredSettingOption,
} from "./ChallengeModal.types";
import { TimeControl } from "@/components/TimeControl";

type ChallengeModalPreferredGameSettingsProps = {
    preferredSettings: ChallengeDetails[];
    challenge: ChallengeInput;
    conf: ChallengeModalConf;
    timeControl: TimeControl;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onResize: () => void;
    selectPreferredSetting: (index: number) => void;
    deletePreferredSetting: (index: number) => void;
    addToPreferredSettings: () => void;
};

export function ChallengeModalPreferredGameSettings({
    preferredSettings,
    challenge,
    conf,
    timeControl,
    containerRef,
    onResize,
    selectPreferredSetting,
    deletePreferredSetting,
    addToPreferredSettings,
}: ChallengeModalPreferredGameSettingsProps) {
    const options: PreferredSettingOption[] = sort_preferred_settings(
        preferredSettings.map((setting: ChallengeDetails, index: number) => ({
            value: index,
            label: preferred_setting_label(setting),
            setting: setting,
        })),
    );

    const handicap = challenge.game.handicap;

    // see usePreferredSetting
    const rankMin = conf.restrict_rank ? challenge.min_ranking : -1000;
    const rankMax = challenge.max_ranking;

    const selected =
        options.find((opt: PreferredSettingOption) => {
            // note that for some reason conf.restrict_rank is not stored with prefs
            const optRestrictRank =
                opt.setting.min_ranking > -1000 && opt.setting.max_ranking < 1000;

            const rankChoiceMatch =
                (!optRestrictRank && !conf.restrict_rank) ||
                (optRestrictRank &&
                    conf.restrict_rank &&
                    opt.setting.min_ranking === rankMin &&
                    opt.setting.max_ranking === rankMax);

            const selected =
                (opt.setting.game.rules === challenge.game.rules &&
                    opt.setting.game.width === challenge.game.width &&
                    opt.setting.game.height === challenge.game.height &&
                    opt.setting.game.handicap === handicap &&
                    rankChoiceMatch &&
                    JSON.stringify(opt.setting.game.time_control_parameters) ===
                        JSON.stringify(timeControl)) ||
                null;

            return selected;
        }) || null;

    const handlePreferredSettingChange = (option: PreferredSettingOption | null) => {
        if (option) {
            selectPreferredSetting(option.value);
        }
    };

    return (
        <div
            className="preferred-settings-container"
            style={{ padding: "0.5em" }}
            ref={containerRef}
        >
            <OgsResizeDetector onResize={onResize} targetRef={containerRef} />
            <hr />
            <div className="preferred-settings-container">
                <div style={{ display: "flex", gap: "1em", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Select
                            classNamePrefix="ogs-react-select"
                            value={selected}
                            onChange={handlePreferredSettingChange}
                            options={options}
                            isClearable={false}
                            isSearchable={false}
                            menuPlacement="auto"
                            placeholder={interpolate(
                                _("Preferred settings ({{preferred_settings_count}})"),
                                {
                                    preferred_settings_count: preferredSettings.length,
                                },
                            )}
                        />
                    </div>
                    {selected ? (
                        <button
                            onClick={() => deletePreferredSetting(selected.value)}
                            className="xs reject"
                            style={{ flexShrink: 0 }}
                        >
                            {_("Delete")}
                        </button>
                    ) : (
                        <button onClick={addToPreferredSettings} className="sm success">
                            {_("Add current setting")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
