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
import { format, parse, isValid } from "date-fns";

interface DateTimePickerProps {
    value?: Date | null;
    onChange: (date: Date | null) => void;
    className?: string;
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps): React.ReactElement {
    const [dateStr, setDateStr] = React.useState(value ? format(value, "yyyy-MM-dd") : "");
    const [timeStr, setTimeStr] = React.useState(value ? format(value, "HH:mm") : "");

    React.useEffect(() => {
        if (value) {
            setDateStr(format(value, "yyyy-MM-dd"));
            setTimeStr(format(value, "HH:mm"));
        } else {
            setDateStr("");
            setTimeStr("");
        }
    }, [value]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDateStr = e.target.value;
        setDateStr(newDateStr);

        if (newDateStr) {
            const newDate = parse(newDateStr + " " + (timeStr || "00:00"), "yyyy-MM-dd HH:mm", new Date());
            if (isValid(newDate)) {
                onChange(newDate);
            }
        } else if (!timeStr) {
            onChange(null);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTimeStr = e.target.value;
        setTimeStr(newTimeStr);

        if (newTimeStr) {
            const newDate = parse((dateStr || format(new Date(), "yyyy-MM-dd")) + " " + newTimeStr, "yyyy-MM-dd HH:mm", new Date());
            if (isValid(newDate)) {
                onChange(newDate);
            }
        } else if (!dateStr) {
            onChange(null);
        }
    };

    return (
        <div className={`DateTimePicker ${className || ""}`}>
            <input
                type="date"
                value={dateStr}
                onChange={handleDateChange}
            />
            <input
                type="time"
                value={timeStr}
                onChange={handleTimeChange}
            />
        </div>
    );
}