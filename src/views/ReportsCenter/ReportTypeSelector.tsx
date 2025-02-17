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

import Select, { SingleValue, components } from "react-select";

import { ReportType } from "@/components/Report";

const DropdownIndicator = components.DropdownIndicator as any;

const REPORT_TYPE_SELECTIONS: ReportTypeGroup[] = [
    {
        label: "Change type",
        options: [
            { value: "escaping", label: "Stopped Playing" },
            { value: "stalling", label: "Stalling" },
            { value: "score_cheating", label: "Score Cheating" },
            { value: "inappropriate_content", label: "Inappropriate Content" },
            { value: "harassment", label: "Harassment" },
            { value: "sandbagging", label: "Sandbagging" },
            { value: "ai_use", label: "AI Use" },
            { value: "other", label: "Other" },
        ],
    },
];

export interface ReportTypeSelection {
    value: ReportType;
    label: string;
}

interface ReportTypeGroup {
    label: string;
    options: ReportTypeSelection[];
}

interface ReportTypeSelectorProps {
    current_type: ReportType | undefined;
    lock: boolean;
    onUpdate: (new_value: ReportType) => void;
}

export function ReportTypeSelector(props: ReportTypeSelectorProps) {
    const onTypeChange = (e: SingleValue<ReportTypeSelection>) => {
        if (e) {
            props.onUpdate(e.value);
        }
    };

    const current_selection = REPORT_TYPE_SELECTIONS[0].options.find(
        (selection) => selection.value === props.current_type,
    );
    return (
        <Select
            isDisabled={props.lock}
            className="report-type-selector"
            classNamePrefix="ogs-react-select"
            value={current_selection}
            options={REPORT_TYPE_SELECTIONS}
            onChange={onTypeChange}
            getOptionLabel={(o) => o.label}
            getOptionValue={(o) => o.value}
            components={{
                Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                    <div
                        ref={innerRef}
                        {...innerProps}
                        className={(isFocused ? "focused " : "") + (isSelected ? "selected" : "")}
                    >
                        {data.label}
                    </div>
                ),
                DropdownIndicator: props.lock
                    ? (props) => (
                          <DropdownIndicator {...props}>
                              <i className="fa fa-lock" style={{ color: "gray" }}></i>
                          </DropdownIndicator>
                      )
                    : DropdownIndicator,
            }}
        />
    );
}
