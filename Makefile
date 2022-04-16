NODE_PATH:=node_modules:$(NODE_PATH)
PATH:=node_modules/.bin/:$(PATH)

dev: node_modules .husky
	npm run dev

.husky: 
	npx husky install

node_modules: package.json
	npm ci --force

pretty prettier lint-fix:
	npm run prettier
	npm run lint:fix

min: minjs mincss

mincss:
	npm run gulp min_styl
	@echo 'gzipped ogs.min.css: ' `gzip -9 dist/ogs.min.css -c | wc -c`

minjs:
	npm run webpack -- --mode production --optimization-minimize --devtool=source-map
	@echo 'gzipped ogs.min.js: ' `gzip -9 dist/ogs.min.js -c | wc -c`
	@echo 'gzipped vendor.min.js: ' `gzip -9 dist/vendor.min.js -c | wc -c`

analyze:
	ANALYZE=true npm run analyze

#NODE_PATH=$(NODE_PATH) PATH=$(PATH) PRODUCTION=true webpack --optimization-minimize --devtool=source-map --profile --json > analyze.json
#npm run webpack-bundle-analyzer dist/ analyze.json

.PHONY: dev min minjs mincss

-include Makefile.production
