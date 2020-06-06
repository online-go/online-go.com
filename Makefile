NODE_PATH:=node_modules:$(NODE_PATH)
PATH:=node_modules/.bin/:$(PATH)
DOCKER_RUN:=docker exec -it online-go --

dev: node_modules
	$(DOCKER_RUN) npm run dev

node_modules: package.json
	$(DOCKER_RUN) npm run yarn install

pretty prettier:
	$(DOCKER_RUN) npm run prettytsx
	$(DOCKER_RUN) npm run prettyts

lint tslint:
	$(DOCKER_RUN) npm run tslint -- --project tsconfig.json

min: minjs mincss

mincss:
	$(DOCKER_RUN) npm run gulp min_styl
	$(DOCKER_RUN) @echo 'gzipped ogs.min.css: ' `gzip -9 dist/ogs.min.css -c | wc -c`

minjs:
	$(DOCKER_RUN) npm run webpack -- --mode production --optimize-minimize --devtool=source-map --display-modules
	$(DOCKER_RUN) @echo 'gzipped ogs.min.js: ' `gzip -9 dist/ogs.min.js -c | wc -c`
	$(DOCKER_RUN) @echo 'gzipped vendor.min.js: ' `gzip -9 dist/vendor.min.js -c | wc -c`

analyze:
	$(DOCKER_RUN) ANALYZE=true npm run analyze

#NODE_PATH=$(NODE_PATH) PATH=$(PATH) PRODUCTION=true webpack --optimize-minimize --devtool=source-map --profile --json > analyze.json
#npm run webpack-bundle-analyzer dist/ analyze.json

.PHONY: dev lint tslint min minjs mincss

-include Makefile.production
