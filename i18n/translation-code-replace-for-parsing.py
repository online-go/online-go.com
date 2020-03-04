#!/usr/bin/env python


import re
import os

replacement_count = 0

with open('build/ogs.strings.js', 'r') as input_file:
    contents = input_file.read()

    def repl(m):
        global replacement_count
        replacement_count += 1
        #print(m[1])
        return (' ' * (len(m[0]) - len(m[1]))) + m[1]

    new_contents = re.sub(r'Object\([a-zA-Z0-9_]+\["(pgettext|_|ngettext|gettext|npgettext|interpolate)"\]\)', repl, contents)

print("Writing ogs.strings.cleaned-for-xgettext.js with %d replacements" % replacement_count)
open('build/ogs.strings.cleaned-for-xgettext.js', 'w').write(new_contents)

