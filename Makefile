NODE_PATH:=node_modules:$(NODE_PATH)
PATH:=node_modules/.bin/:$(PATH)

dev: node_modules
	NODE_PATH=$(NODE_PATH) PATH=$(PATH) supervisor -w Gulpfile.js,webpack.config.js,tsconfig.json supervisor -w Gulpfile.js -x gulp --

node_modules:
	npm install yarn
	npm install supervisor
	NODE_PATH=$(NODE_PATH) PATH=$(PATH) yarn install

lint tslint:
	NODE_PATH=$(NODE_PATH) PATH=$(PATH) tslint --type-check --project tsconfig.json

min:
	NODE_PATH=$(NODE_PATH) PATH=$(PATH) PRODUCTION=true webpack --optimize-minimize --devtool=source-map --display-modules --output-filename 'ogs.min.js' 
	NODE_PATH=$(NODE_PATH) PATH=$(PATH) gulp min_styl
	@echo 'gzipped ogs.min.js: ' `gzip -9 dist/ogs.min.js -c | wc -c`
	@echo 'gzipped ogs.min.css: ' `gzip -9 dist/ogs.min.css -c | wc -c`


.PHONY: dev lint tslint min

-include Makefile.production
