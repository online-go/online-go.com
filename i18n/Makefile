all: build/countries.json

# For country names, we extract these from the CLDR
cldr_version=46
cldr/cldr-core.zip:
	mkdir -p cldr
	curl http://unicode.org/Public/cldr/$(cldr_version)/core.zip -o cldr/cldr-core.zip

cldr/common: cldr/cldr-core.zip
	cd cldr;\
		unzip -D cldr-core.zip

build/countries.json: cldr/common gen-country-lists.py
	mkdir -p build
	./gen-country-lists.py

dev-run-translation-scripts:
	# create our ogs.strings.js file 
	cd ../; npm run build:i18n
	python translation-code-replace-for-parsing.py
	# Create a unified pot file script is run on the translation server typically
	node create-unified-pot.js llm-translation-extraction
	node audit-translations.js
	node jsonify-po-files.js

audit:
	node audit-translations.js

po:
	node jsonify-po-files.js

-include Makefile.production
