#!/usr/bin/env python3

import json
import os
import re
from xml.dom.minidom import parse

cldr_main = "cldr/common/main"


def getText(nodelist):
    rc = []
    for node in nodelist:
        if node.nodeType == node.TEXT_NODE:
            rc.append(node.data)
    return "".join(rc)


def read_and_generate(base_language_file):
    countries = {
        "un": "Unspecified",
    }

    dom = parse(base_language_file)
    localeDisplayNames = dom.getElementsByTagName("localeDisplayNames")
    if len(localeDisplayNames) == 0:
        print(f"No localeDisplayNames found in {base_language_file}")
        return countries
    lds = localeDisplayNames[0]

    territories = (
        lds.getElementsByTagName("territories")[0]
        if len(lds.getElementsByTagName("territories")) > 0
        else None
    )
    if territories is None:
        print(f"No territories found in {base_language_file}")
        return countries

    for territory in territories.getElementsByTagName("territory"):
        alt = territory.getAttribute("alt")
        if alt == "variant":
            continue
        if alt == "short":
            continue
        cc = territory.getAttribute("type").strip().lower()
        name = getText(territory.childNodes).strip()
        countries[cc] = name

    countries["un"] = "Unspecified"
    return countries


result = {}
for filename in sorted(os.listdir(cldr_main)):
    m = re.search("^([a-z]+)[.]xml$", filename)
    if m:
        base_language = m.group(1)
        print("Loading " + base_language)
        result[base_language] = read_and_generate(cldr_main + "/" + filename)

print("Writing build/countries.json")
with open("build/countries.json", "w") as output:
    output.write(json.dumps(result))
print("Done.")
