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
import { SWEvent } from "./interface";

export function match(rule: SWEvent.Rule, request: Request) {
  switch (Object.prototype.toString.call(rule)) {
    // url 文本匹配
    case '[object String]':
      // 使用 URL() 将匹配规则传入的路径补全
      return request.url === new URL((rule as string), location.href).href;

    // url 正则匹配
    case '[object RegExp]':
      return request.url.match((rule as RegExp));

    // 支持自定义匹配
    case '[object Function]':
      return (rule as Function)(request);
  }
}
