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

    # The vite build system may rename functions if there are naming conflicts.
    # Detect and fix any renamed translation functions (e.g., pgettext$1 -> pgettext)
    for func_name in translation_functions:
        pattern = rf"\b{re.escape(func_name)}\$\d+\b"
        count = len(re.findall(pattern, new_contents))
        if count > 0:
            new_contents = re.sub(pattern, func_name, new_contents)
            print(f"Fixed {count} occurrences of {func_name}$N -> {func_name}")


print(
    "Writing ogs.strings.cleaned-for-xgettext.js with %d replacements"
    % replacement_count
)
open("build/ogs.strings.cleaned-for-xgettext.js", "w").write(new_contents)
