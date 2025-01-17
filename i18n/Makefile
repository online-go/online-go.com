all: build/countries.json

# For country names, we extract these from the CLDR
cldr_version=30.0.2
cldr/cldr-core.zip:
	mkdir -p cldr
	curl http://unicode.org/Public/cldr/$(cldr_version)/core.zip -o cldr/cldr-core.zip

cldr/common: cldr/cldr-core.zip
	cd cldr;\
		unzip -D cldr-core.zip

build/countries.json: cldr/common
	mkdir -p build
	./gen-country-lists.py

dev-run-translation-scripts:
	cd ../; npm run build:i18n
	#cp ../dist/ogs.js build/ogs.strings.js
	#cp ../dist/ogs.js.map build/ogs.strings.js.map
	#sed -i 's/ogs.js.map/ogs.strings.js.map/' build/ogs.strings.js
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
