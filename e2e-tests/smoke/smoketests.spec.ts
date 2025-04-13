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

import { ogsTest } from "@helpers";
import { smokeRegisterLogoutLogin } from "./smoke-register-operations";
import { smokeCssSanityTest } from "./smoke-css-sanity";

// ** These have to be run in the standard docker, so that the screenshots match!! **

ogsTest.describe("@Smoke Basic self contained tests to confirm server is functional", () => {
    ogsTest("Should be able to register, logout, login", smokeRegisterLogoutLogin);
    ogsTest("Basic screenshots should look right", smokeCssSanityTest);
});
