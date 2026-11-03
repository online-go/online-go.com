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
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as data from "@/lib/data";
import { PriceBox } from "./Supporter";

type PriceBoxProps = React.ComponentProps<typeof PriceBox>;

test("the PayPal form sends the tier, because the server can't tell it from the amount", () => {
    data.set("user", { id: 1, anonymous: false } as ReturnType<typeof data.get<"user">>);

    const { container } = render(
        <MemoryRouter>
            <PriceBox
                account_id={1}
                currency="EUR"
                interval="month"
                slug="hane"
                grandfathered_plan={false}
                overrides={{}}
                config={
                    { subscriptions: [], country_code: "FR" } as unknown as PriceBoxProps["config"]
                }
                price={
                    {
                        active: true,
                        title: "Hane",
                        description: [],
                        slug: "hane",
                        price: { EUR: { month: 700, year: 7000 } },
                    } as unknown as PriceBoxProps["price"]
                }
            />
        </MemoryRouter>,
    );

    const field = container.querySelector('#paypal-form input[name="item_number"]');
    expect(field?.getAttribute("value")).toBe("hane");
});
