#!/usr/bin/env python2

import json
import os
import re
import sys
from xml.dom.minidom import parse
import xml.dom.minidom

cldr_main = "cldr/common/main";


def getText(nodelist):
    rc = []
    for node in nodelist:
        if node.nodeType == node.TEXT_NODE:
            rc.append(node.data)
    return ''.join(rc)


def read_and_generate(base_language_file):
    countries = {}

    dom = parse(base_language_file)
    lds = dom.getElementsByTagName("localeDisplayNames")[0]
    try:
        territories = lds.getElementsByTagName("territories")[0]
        for territory in territories.getElementsByTagName("territory"):
            alt = territory.getAttribute("alt")
            if alt == "variant": 
                continue
            if alt == "short": 
                continue
            cc = territory.getAttribute("type").strip().lower()
            name = getText(territory.childNodes).strip()
            countries[cc] = name

    except Exception as e:
        print(e)

    countries['un'] = "Unspecified";

    return countries



result = {}
for filename in sorted(os.listdir(cldr_main)):
    m = re.search('^([a-z]+)[.]xml$', filename)
    if m:
        base_language = m.group(1)
        print("Loading " + base_language)
        result[base_language] = read_and_generate(cldr_main + "/" + filename)

print("Writing build/countries.json")
with open('build/countries.json', 'w') as output:
    output.write(json.dumps(result))
print('Done.');
