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

-include Makefile.production
