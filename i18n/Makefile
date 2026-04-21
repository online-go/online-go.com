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
	$(MAKE) sync-translation-cache
	node jsonify-po-files.js

audit: sync-translation-cache

po:
	node jsonify-po-files.js

# Shared translation cache synchronized across instances via scp to pootle.
# See Q&A in i18n/Makefile commit history for rationale.
REMOTE_HOST := pootle
# Relative to remote $HOME — both ssh and scp resolve relative paths against
# the remote user's home, which avoids local tilde expansion clobbering the
# path with our own home directory.
REMOTE_DIR  := translation-cache
CACHE_FILES := autotranslations.json llm-keys-cache.json

# Pull each cache file from the server if present, merging into the local
# copy (server wins on per-key collisions). Hard-fails on ssh errors; a
# remote-missing file is not an error (first-run case).
translation-cache-pull:
	@for f in $(CACHE_FILES); do \
		echo "Checking $(REMOTE_HOST):$(REMOTE_DIR)/$$f"; \
		ssh $(REMOTE_HOST) test -f $(REMOTE_DIR)/$$f; \
		rc=$$?; \
		if [ $$rc -eq 0 ]; then \
			tmp=$$(mktemp); \
			scp $(REMOTE_HOST):$(REMOTE_DIR)/$$f $$tmp || exit 1; \
			node -e 'const fs=require("fs"),l=process.argv[1],s=process.argv[2];const a=fs.existsSync(l)?JSON.parse(fs.readFileSync(l,"utf-8")):{};const b=JSON.parse(fs.readFileSync(s,"utf-8"));for(const k of Object.keys(b))a[k]={...(a[k]||{}),...b[k]};fs.writeFileSync(l,JSON.stringify(a,null,4));' $$f $$tmp || exit 1; \
			rm -f $$tmp; \
			echo "  merged $$f"; \
		elif [ $$rc -eq 1 ]; then \
			echo "  $$f not on $(REMOTE_HOST), skipping"; \
		else \
			echo "Failed to reach $(REMOTE_HOST) (ssh exit $$rc)" >&2; \
			exit 1; \
		fi; \
	done

translation-cache-push:
	@ssh $(REMOTE_HOST) mkdir -p $(REMOTE_DIR)
	@for f in $(CACHE_FILES); do \
		echo "Pushing $$f to $(REMOTE_HOST):$(REMOTE_DIR)/$$f"; \
		scp $$f $(REMOTE_HOST):$(REMOTE_DIR)/$$f || exit 1; \
	done

sync-translation-cache:
	$(MAKE) translation-cache-pull
	node audit-translations.js
	$(MAKE) translation-cache-push

-include Makefile.production
