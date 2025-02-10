#!/usr/bin/env python

import re

replacement_count = 0


translation_functions = [
    "_",
    "gettext",
    "ngettext",
    "pgettext",
    "npgettext",
    "llm_pgettext",
]


with open("build/ogs.strings.js", "r") as input_file:
    contents = input_file.read()

    def repl(m):
        global replacement_count
        replacement_count += 1
        # print(m[1])
        return (" " * (len(m[0]) - len(m[1]))) + m[1]

    new_contents = re.sub(
        r'Object\([a-zA-Z0-9_]+\["(pgettext|_|ngettext|gettext|npgettext|interpolate)"\]\)',
        repl,
        contents,
    )

    # The vite build system renames functions that have conflicting names amongst packages.
    # If conflicts exist for our translation functions we'll silently fail to extract
    # the strings, so we throw an error here so we are aware of it and can fix it.
    if re.search(r"_[$][0-9]+", new_contents):
        m = re.search(r"_[$][0-9]+", new_contents)
        if m:
            raise Exception(
                "Found possible translation function name conflict: %s" % m.group(0)
            )
    if re.search(r"interpolate[$][0-9]+", new_contents):
        raise Exception(
            "Found possible translation function name conflict: interpolate[$][0-9]+"
        )
    if re.search(r"gettext[$][0-9]+", new_contents):
        raise Exception(
            "Found possible translation function name conflict: gettext[$][0-9]+"
        )
    if re.search(r"ngettext[$][0-9]+", new_contents):
        raise Exception(
            "Found possible translation function name conflict: ngettext[$][0-9]+"
        )
    if re.search(r"pgettext[$][0-9]+", new_contents):
        raise Exception(
            "Found possible translation function name conflict: pgettext[$][0-9]+"
        )
    if re.search(r"npgettext[$][0-9]+", new_contents):
        raise Exception(
            "Found possible translation function name conflict: npgettext[$][0-9]+"
        )
    if re.search(r"llm_pgettext[$][0-9]+", new_contents):
        raise Exception(
            "Found possible translation function name conflict: llm_pgettext[$][0-9]+"
        )


print(
    "Writing ogs.strings.cleaned-for-xgettext.js with %d replacements"
    % replacement_count
)
open("build/ogs.strings.cleaned-for-xgettext.js", "w").write(new_contents)
